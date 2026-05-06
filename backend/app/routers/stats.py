from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import date, timedelta, datetime
from app.dependencies import get_supabase, get_current_user
from app.schemas.stats import (
    UserStatsSummary, ActivityEvent, ReadingProgressPoint, HabitCalendarDay, 
    GenreCount, GenreStats, MonthlyItem, MonthlyData,
    MonthlyReport, HabitAchievement, FinanceAnalysis, SeriesTimeBreakdown,
    DashboardStats, LegendTitle, LegendProfile,
    MonthlyHighlight, MonthlyHighlightBook, MonthlyHighlightMovie, MonthlyHighlightHabit
)

router = APIRouter(prefix="/me/stats", tags=["Stats"])

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Consolida summary, activity y progress en una sola llamada para el perfil."""
    summary = await get_summary(user, supabase)
    activity = await get_activity(user, supabase)
    progress = await get_reading_progress(user, supabase)
    
    return DashboardStats(
        summary=summary,
        activity=activity,
        progress=progress
    )

def _get_page_from_log(log: dict, page_count: int | None = None) -> int:
    """Extrae la página actual de un log, estimándola por % si es necesario."""
    curr_p = log.get("current_page")
    if curr_p is not None:
        return int(curr_p)
    
    curr_pct = log.get("progress_percentage")
    if curr_pct is not None and page_count:
        return int((float(curr_pct) / 100) * page_count)
    
    return 0

@router.get("/summary", response_model=UserStatsSummary)
async def get_summary(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Ejecutamos las consultas principales en paralelo para mejorar el rendimiento
    import asyncio
    books_task, movies_task, series_task = await asyncio.gather(
        asyncio.to_thread(supabase.table("user_books").select("status, rating").eq("user_id", user["id"]).execute),
        asyncio.to_thread(supabase.table("user_movies").select("status, rating").eq("user_id", user["id"]).execute),
        asyncio.to_thread(supabase.table("user_series").select("*, series(*)").eq("user_id", user["id"]).execute)
    )

    # Books
    books_data = books_task.data or []
    books_read = 0
    books_reading = 0
    book_ratings = []
    
    for b in books_data:
        st = (b.get("status") or "").strip().lower()
        if st == "read":
            books_read += 1
            if b.get("rating") is not None:
                book_ratings.append(float(b["rating"]))
        elif st == "reading":
            books_reading += 1

    # Movies
    movies_data = movies_task.data or []
    movies_watched = 0
    movies_watchlist = 0
    movie_ratings = []
    
    for m in movies_data:
        st = (m.get("status") or "").strip().lower()
        if st == "watched":
            movies_watched += 1
            if m.get("rating") is not None:
                movie_ratings.append(float(m["rating"]))
        elif st == "want_to_watch":
            movies_watchlist += 1

    # Averages
    avg_book_rating = round(sum(book_ratings) / len(book_ratings), 1) if book_ratings else None
    avg_movie_rating = round(sum(movie_ratings) / len(movie_ratings), 1) if movie_ratings else None

    # Series
    series_data = series_task.data or []
    series_watched = len([s for s in series_data if (s.get("status") or "").strip().lower() == "watched"])
    
    total_series_minutes = 0
    for row in series_data:
        s = row.get("series")
        if not s: continue
        
        curr_season = row.get("current_season", 1)
        curr_ep = row.get("current_episode", 0)
        seasons_data = s.get("seasons_data", [])
        
        absolute_ep = curr_ep
        if seasons_data:
            sorted_seasons = sorted(seasons_data, key=lambda x: x.get("season_number", 0))
            for sea in sorted_seasons:
                if sea.get("season_number", 0) < curr_season:
                    absolute_ep += sea.get("episode_count", 0)
                else:
                    break
        
        total_series_minutes += absolute_ep * (s.get("episode_run_time") or 0)

    return UserStatsSummary(
        books_read=books_read,
        books_reading=books_reading,
        movies_watched=movies_watched,
        movies_watchlist=movies_watchlist,
        avg_book_rating=avg_book_rating,
        avg_movie_rating=avg_movie_rating,
        series_watched=series_watched,
        total_series_minutes=total_series_minutes
    )

@router.get("/series_breakdown", response_model=list[SeriesTimeBreakdown])
async def get_series_breakdown(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Devuelve el desglose de tiempo invertido por serie."""
    series_res = supabase.table("user_series").select("*, series(*)").eq("user_id", user["id"]).execute()
    
    breakdown = []
    
    for row in series_res.data:
        s = row["series"]
        if not s: continue
        
        # Calcular episodio absoluto
        curr_season = row["current_season"]
        curr_ep = row["current_episode"]
        seasons_data = s.get("seasons_data", [])
        
        absolute_ep = curr_ep
        if seasons_data:
            sorted_seasons = sorted(seasons_data, key=lambda x: x["season_number"])
            for sea in sorted_seasons:
                if sea["season_number"] < curr_season:
                    absolute_ep += sea["episode_count"]
                elif sea["season_number"] == curr_season:
                    break
        
        minutes = absolute_ep * (s.get("episode_run_time") or 0)
        
        if minutes > 0:
            breakdown.append(SeriesTimeBreakdown(
                title=s["title"],
                poster_url=s.get("poster_url"),
                minutes_spent=minutes
            ))
            
    # Sort by minutes
    breakdown.sort(key=lambda x: x.minutes_spent, reverse=True)
    return breakdown

import logging as _log
_logger = _log.getLogger(__name__)

@router.get("/activity", response_model=list[ActivityEvent])
async def get_activity(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Obtiene la actividad reciente.
    Optimizado: Las consultas se ejecutan en paralelo.
    TODO: Cuando se aplique la migración SQL, usar la vista 'activity_feed' para 
    reducir esto a una sola consulta.
    """
    import asyncio

    # Intentar usar la vista primero
    try:
        view_res = supabase.table("activity_feed")\
            .select("*")\
            .eq("user_id", user["id"])\
            .order("timestamp", desc=True)\
            .limit(10).execute()
        if view_res.data:
            return view_res.data
    except Exception:
        pass

    # Fallback: Paralelo
    async def fetch_books():
        return supabase.table("user_books")\
            .select("id, finished_at, books(title, cover_url)")\
            .eq("user_id", user["id"])\
            .eq("status", "read")\
            .not_.is_("finished_at", "null")\
            .order("finished_at", desc=True)\
            .limit(10).execute()

    async def fetch_movies():
        return supabase.table("user_movies")\
            .select("id, watched_at, movies(title, poster_url, runtime)")\
            .eq("user_id", user["id"])\
            .eq("status", "watched")\
            .order("watched_at", desc=True)\
            .limit(10).execute()

    async def fetch_progress():
        return supabase.table("book_progress_logs")\
            .select("id, log_date, current_page, progress_percentage, user_books(books(title, cover_url, page_count))")\
            .eq("user_id", user["id"])\
            .order("log_date", desc=True)\
            .limit(10).execute()

    async def fetch_finance():
        return supabase.table("finance_transactions")\
            .select("id, date, amount, merchant, is_income")\
            .eq("user_id", user["id"])\
            .order("date", desc=True)\
            .limit(10).execute()

    async def fetch_series():
        return supabase.table("series_progress_logs")\
            .select("id, log_date, season, episode, user_series(series(title, poster_url, episode_run_time, seasons_data))")\
            .eq("user_id", user["id"])\
            .order("log_date", desc=True)\
            .limit(10).execute()

    results = await asyncio.gather(
        fetch_books(), fetch_movies(), fetch_progress(), fetch_finance(), fetch_series()
    )
    
    books, movies, progress, finance, series_logs = results
    events = []
    
    def to_dt(val: str) -> str:
        if val and "T" not in val:
            return f"{val}T00:00:00Z"
        return val

    for b in books.data:
        events.append(ActivityEvent(
            id=b["id"], type="book_finished", title="Libro terminado",
            detail=f"Has terminado de leer '{b['books']['title']}'",
            timestamp=to_dt(b["finished_at"]), image_url=b["books"]["cover_url"]
        ))

    for m in movies.data:
        m_meta = m.get("movies")
        events.append(ActivityEvent(
            id=m["id"], type="movie_watched", title="Película vista",
            detail=f"Has visto '{m_meta['title']}'",
            timestamp=to_dt(m["watched_at"]), image_url=m_meta["poster_url"],
            minutes_spent=m_meta.get("runtime") or 0
        ))

    for p in progress.data:
        ts = f"{p['log_date']}T12:00:00Z"
        title = p["user_books"]["books"]["title"]
        curr_p = p.get("current_page")
        curr_pct = p.get("progress_percentage")
        detail = f"Llegaste a la página {curr_p} de '{title}'" if curr_p is not None else \
                 f"Has avanzado al {curr_pct}% de '{title}'" if curr_pct is not None else \
                 f"Registraste avance en '{title}'"
        events.append(ActivityEvent(
            id=p["id"], type="reading_progress", title="Progreso de lectura",
            detail=detail, timestamp=ts, image_url=p["user_books"]["books"]["cover_url"]
        ))
        
    for f in finance.data:
        type_str = "Ingreso" if f["is_income"] else "Gasto"
        events.append(ActivityEvent(
            id=f["id"], type="finance_transaction", title=f"{type_str}: {f['merchant']}",
            detail=f"{f['amount']}€ registrados", timestamp=to_dt(f["date"]), image_url=None
        ))

    for s in series_logs.data:
        if not s["user_series"] or not s["user_series"]["series"]: continue
        s_meta = s["user_series"]["series"]
        events.append(ActivityEvent(
            id=s["id"], type="series_progress", title="Progreso de serie",
            detail=f"Visto T{s['season']}:E{s['episode']} de '{s_meta['title']}'",
            timestamp=f"{s['log_date']}T12:00:00Z", image_url=s_meta["poster_url"],
            minutes_spent=s_meta.get("episode_run_time") or 0
        ))

    events.sort(key=lambda x: x.timestamp, reverse=True)
    return events[:10]

@router.get("/report/{year}/{month}", response_model=MonthlyReport)
async def get_monthly_report(
    year: int, month: int,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """Genera un informe detallado del mes solicitado."""
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()

    # 1. Perfil (Velocidad de lectura)
    profile_res = supabase.table("profiles").select("reading_speed").eq("id", user["id"]).execute()
    profile = profile_res.data[0] if profile_res.data else {}
    speed = profile.get("reading_speed", 1.5)

    # 2. Finanzas
    finance_res = supabase.table("finance_transactions")\
        .select("*, category:finance_categories(*)")\
        .eq("user_id", user["id"])\
        .gte("date", start_str)\
        .lte("date", end_str)\
        .execute()
    
    income = sum(float(f["amount"]) for f in finance_res.data if f["is_income"])
    expenses = sum(float(f["amount"]) for f in finance_res.data if not f["is_income"])
    balance = income - expenses

    # Desglose finanzas
    categories_dict = {}
    for f in finance_res.data:
        if not f["is_income"]:
            cat = f.get("category")
            name = cat["name"] if cat else "Otros"
            color = cat["color"] if cat else "#94a3b8"
            
            if name not in categories_dict:
                categories_dict[name] = {"amount": 0.0, "color": color}
            categories_dict[name]["amount"] += float(f["amount"])
    
    finance_breakdown = []
    for cat_name, data in categories_dict.items():
        amt = data["amount"]
        pct = (amt / expenses * 100) if expenses > 0 else 0
        alert = None
        if pct > 30: alert = f"Esta categoría representa el {pct:.1f}% de tus gastos. ¡Ojo ahí!"
        
        finance_breakdown.append(FinanceAnalysis(
            category=cat_name,
            amount=round(amt, 2),
            percentage=round(pct, 1),
            color=data["color"],
            alert=alert
        ))
    finance_breakdown.sort(key=lambda x: x.amount, reverse=True)

    # 3. Libros
    # Libros terminados
    books_finished_res = supabase.table("user_books")\
        .select("id")\
        .eq("user_id", user["id"])\
        .eq("status", "read")\
        .gte("finished_at", start_str)\
        .lte("finished_at", end_str)\
        .execute()
    books_finished = len(books_finished_res.data)

    # Páginas leídas (Deltas en el mes)
    progress_res = supabase.table("book_progress_logs")\
        .select("*, user_books(books(page_count))")\
        .eq("user_id", user["id"])\
        .gte("log_date", start_str)\
        .lte("log_date", end_str)\
        .order("log_date", desc=False)\
        .execute()
    
    pages_read = 0
    book_trackers = {} # user_book_id -> last_page_before_current_month
    
    for log in progress_res.data:
        ub_id = log["user_book_id"]
        book_data = log.get("user_books", {}).get("books", {})
        page_count = book_data.get("page_count") if isinstance(book_data, dict) else None
        
        if ub_id not in book_trackers:
            prev = supabase.table("book_progress_logs")\
                .select("current_page, progress_percentage")\
                .eq("user_book_id", ub_id)\
                .lt("log_date", start_str)\
                .order("log_date", desc=True)\
                .limit(1).execute()
            book_trackers[ub_id] = _get_page_from_log(prev.data[0], page_count) if prev.data else 0
        
        current_page_val = _get_page_from_log(log, page_count)
        delta = max(0, current_page_val - book_trackers[ub_id])
        pages_read += delta
        book_trackers[ub_id] = current_page_val
    
    reading_time = int(pages_read * speed)

    # 4. Películas
    movies_res = supabase.table("user_movies")\
        .select("*, movies(*)")\
        .eq("user_id", user["id"])\
        .eq("status", "watched")\
        .gte("watched_at", start_str)\
        .lte("watched_at", end_str)\
        .execute()
    
    movies_watched = len(movies_res.data)
    movies_time = 0
    for m in movies_res.data:
        m_meta = m.get("movies")
        if not m_meta: continue
        
        # Reparar si falta duración
        m_runtime = m_meta.get("runtime") or 0
        if m_runtime == 0:
            try:
                from app.services.tmdb import get_movie_details
                from app.config import get_settings
                settings = get_settings()
                details = await get_movie_details(m_meta["tmdb_id"], settings.tmdb_api_key)
                if details and details.runtime > 0:
                    supabase.table("movies").update({"runtime": details.runtime}).eq("id", m_meta["id"]).execute()
                    m_runtime = details.runtime
            except: pass
        
        movies_time += m_runtime

    # 5. Series
    series_logs_res = supabase.table("series_progress_logs")\
        .select("*, user_series(series(*))")\
        .eq("user_id", user["id"])\
        .gte("log_date", start_str)\
        .lte("log_date", end_str)\
        .order("log_date", desc=False)\
        .execute()
    
    episodes_watched = 0
    series_time = 0
    series_trackers = {} # user_series_id -> last_absolute_ep_before_month

    def get_abs_ep(season, ep, seasons_data):
        abs_ep = ep
        if seasons_data:
            sorted_seasons = sorted(seasons_data, key=lambda x: x["season_number"])
            for sea in sorted_seasons:
                if sea["season_number"] < season:
                    abs_ep += sea["episode_count"]
                elif sea["season_number"] == season:
                    break
        return abs_ep

    for log in series_logs_res.data:
        us_id = log["user_series_id"]
        if not log["user_series"] or not log["user_series"]["series"]: continue
        s_meta = log["user_series"]["series"]
        
        # Reparar si falta duración
        s_runtime = s_meta.get("episode_run_time") or 0
        if s_runtime == 0:
            try:
                from app.services.tmdb import get_tv_details
                from app.config import get_settings
                settings = get_settings()
                details = await get_tv_details(s_meta["tmdb_id"], settings.tmdb_api_key)
                if details and details["episode_run_time"] > 0:
                    supabase.table("series").update({
                        "episode_run_time": details["episode_run_time"],
                        "seasons_data": details["seasons_data"],
                        "total_episodes": details["total_episodes"],
                        "total_seasons": details["total_seasons"]
                    }).eq("id", s_meta["id"]).execute()
                    s_runtime = details["episode_run_time"]
                    s_meta["seasons_data"] = details["seasons_data"]
            except: pass

        if us_id not in series_trackers:
            prev = supabase.table("series_progress_logs")\
                .select("season, episode")\
                .eq("user_series_id", us_id)\
                .lt("log_date", start_str)\
                .order("log_date", desc=True)\
                .limit(1).execute()
            if prev.data:
                series_trackers[us_id] = get_abs_ep(prev.data[0]["season"], prev.data[0]["episode"], s_meta.get("seasons_data", []))
            else:
                series_trackers[us_id] = 0
        
        current_abs = get_abs_ep(log["season"], log["episode"], s_meta.get("seasons_data", []))
        delta = max(0, current_abs - series_trackers[us_id])
        episodes_watched += delta
        series_time += delta * s_runtime
        series_trackers[us_id] = current_abs

    # 6. Hábitos
    habits_logs_res = supabase.table("habit_logs")\
        .select("habit_id, completed_at")\
        .eq("user_id", user["id"])\
        .gte("completed_at", start_str)\
        .lte("completed_at", end_str)\
        .execute()
    
    total_habits_res = supabase.table("habits").select("id").eq("user_id", user["id"]).eq("is_archived", False).execute()
    total_habits_count = len(total_habits_res.data)
    
    days_map = {} # date -> count
    for h in habits_logs_res.data:
        # Extraer solo la fecha del timestamp
        d = h["completed_at"].split("T")[0]
        days_map[d] = days_map.get(d, 0) + 1
    
    levels = {"Perfecto": 0, "Notable": 0, "Aceptable": 0, "Insuficiente": 0}
    days_in_month = (end_date - start_date).days + 1
    
    today = date.today()
    if today.year == year and today.month == month:
        check_days = today.day
    else:
        check_days = days_in_month

    for i in range(1, check_days + 1):
        d_str = date(year, month, i).isoformat()
        count = days_map.get(d_str, 0)
        pct = (count / total_habits_count) if total_habits_count > 0 else 0
        
        if pct >= 1: levels["Perfecto"] += 1
        elif pct >= 0.75: levels["Notable"] += 1
        elif pct >= 0.5: levels["Aceptable"] += 1
        else: levels["Insuficiente"] += 1
    
    habit_achievements = [HabitAchievement(level=k, days=v) for k, v in levels.items()]

    return MonthlyReport(
        year=year, month=month,
        income=income, expenses=expenses, balance=balance,
        finance_breakdown=finance_breakdown,
        books_finished=books_finished,
        pages_read=pages_read,
        reading_time_minutes=reading_time,
        movies_watched=movies_watched,
        movies_time_minutes=movies_time,
        episodes_watched=episodes_watched,
        series_time_minutes=series_time,
        total_enjoyment_minutes=reading_time + movies_time + series_time,
        habit_achievements=habit_achievements
    )

@router.get("/progress", response_model=list[ReadingProgressPoint])
async def get_reading_progress(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # 1. Obtener logs de los últimos 30 días
    since = (date.today() - timedelta(days=30)).isoformat()
    res = supabase.table("book_progress_logs")\
        .select("log_date, current_page, progress_percentage, user_book_id, user_books(books(title, cover_url, page_count))")\
        .eq("user_id", user["id"])\
        .gte("log_date", since)\
        .order("log_date")\
        .execute()
    
    # 2. Necesitamos saber en qué página estaba cada libro JUSTO ANTES del periodo
    # para poder calcular el primer delta correctamente.
    user_book_ids = list(set([row["user_book_id"] for row in res.data]))
    last_pages_before = {}
    
    for ub_id in user_book_ids:
        # Encontrar el log_date más reciente para este libro
        book_info = next((row["user_books"]["books"] for row in res.data if row["user_book_id"] == ub_id), {})
        page_count = book_info.get("page_count")

        prev_res = supabase.table("book_progress_logs")\
            .select("current_page, progress_percentage")\
            .eq("user_book_id", ub_id)\
            .lt("log_date", since)\
            .order("log_date", desc=True)\
            .limit(1).execute()
        if prev_res.data:
            last_pages_before[ub_id] = _get_page_from_log(prev_res.data[0], page_count)
        else:
            last_pages_before[ub_id] = 0

    # 3. Calcular deltas por día
    day_map = {}
    # Tracker de la última página vista por libro durante el recorrido
    current_tracker = last_pages_before.copy()

    for row in res.data:
        d = row["log_date"]
        ub_id = row["user_book_id"]
        book = row["user_books"]["books"]
        page_count = book.get("page_count")
        
        new_page = _get_page_from_log(row, page_count)
        
        # El progreso de hoy es: nueva_página - última_registrada
        prev_page = current_tracker.get(ub_id, 0)
        delta = max(0, new_page - prev_page)
        
        # Actualizar tracker para el siguiente log del mismo libro
        current_tracker[ub_id] = new_page

        if delta == 0 and len(res.data) > 1: 
            # Si no hubo avance real, no sumamos nada al gráfico
            continue

        if d not in day_map:
            day_map[d] = {"total": 0, "details": []}
        
        day_map[d]["total"] += delta
        day_map[d]["details"].append({
            "book_title": book["title"], 
            "pages": delta,
            "cover_url": book["cover_url"]
        })

    return [
        ReadingProgressPoint(date=d, total_pages=v["total"], details=v["details"]) 
        for d, v in sorted(day_map.items())
    ]

@router.get("/habits-calendar", response_model=list[HabitCalendarDay])
async def get_habits_calendar(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Get all habits to calculate target counts
    habits_res = supabase.table("habits").select("*").eq("user_id", user["id"]).eq("is_archived", False).execute()
    habits = habits_res.data
    
    # Get logs
    logs_res = supabase.table("habit_logs").select("completed_at, habits(name, icon, image_url)").eq("user_id", user["id"]).execute()
    
    # Map logs by date
    log_map = {}
    for row in logs_res.data:
        d = row["completed_at"]
        if d not in log_map:
            log_map[d] = []
        log_map[d].append({
            "name": row["habits"]["name"], 
            "icon": row["habits"]["icon"],
            "image_url": row["habits"]["image_url"]
        })

    # Generate stats for the last 35 days
    results = []
    for i in range(35):
        day_date = date.today() - timedelta(days=i)
        d_str = day_date.isoformat()
        dow = day_date.isoweekday() # 1=Mon, 7=Sun
        
        # Calculate target habits for this day
        target_count = 0
        for h in habits:
            # Check if habit was already created
            created_at = datetime.fromisoformat(h["created_at"].replace("Z", "+00:00")).date()
            if created_at > day_date:
                continue
                
            if h["frequency"] == "daily":
                target_count += 1
            elif h["frequency"] == "custom" and h["target_days"] and dow in h["target_days"]:
                target_count += 1
            elif h["frequency"] == "weekly":
                # For weekly, we'll just assume 1 target for simplicity or skip
                # Let's say weekly counts as 1 target on the day it's done or on Sunday
                if dow == 7: target_count += 1
        
        day_logs = log_map.get(d_str, [])
        results.append(HabitCalendarDay(
            date=day_date,
            count=len(day_logs),
            target_count=max(target_count, 1), # Avoid division by zero
            habits=day_logs
        ))

    return results[::-1] # Return chronological order


@router.get("/genres", response_model=GenreStats)
async def get_genre_stats(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Books: user_books join books(categories)
    books_res = supabase.table("user_books")\
        .select("books(categories)")\
        .eq("user_id", user["id"])\
        .execute()

    book_genre_counts: dict[str, int] = {}
    for row in books_res.data:
        categories = (row.get("books") or {}).get("categories") or []
        if not categories:
            continue
        genre = categories[0].split("/")[0].split(",")[0].strip()
        if genre:
            book_genre_counts[genre] = book_genre_counts.get(genre, 0) + 1

    # Movies: user_movies join movies(genres)
    movies_res = supabase.table("user_movies")\
        .select("movies(genres)")\
        .eq("user_id", user["id"])\
        .execute()

    movie_genre_counts: dict[str, int] = {}
    for row in movies_res.data:
        genres = (row.get("movies") or {}).get("genres") or []
        if not genres:
            continue
        genre = genres[0]
        if genre:
            movie_genre_counts[genre] = movie_genre_counts.get(genre, 0) + 1

    top_books = [
        GenreCount(genre=g, count=c)
        for g, c in sorted(book_genre_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    ]
    top_movies = [
        GenreCount(genre=g, count=c)
        for g, c in sorted(movie_genre_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    ]

    return GenreStats(books=top_books, movies=top_movies)


@router.get("/monthly-items", response_model=list[MonthlyData])
async def get_monthly_items(
    type: str = "books",
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    current_year = date.today().year
    year_start = f"{current_year}-01-01"
    year_end = f"{current_year}-12-31"

    # Initialize all 12 months with empty data
    month_map: dict[int, dict[str, Any]] = {
        m: {"items": [], "physical": 0, "electronic": 0} for m in range(1, 13)
    }

    if type == "books":
        res = supabase.table("user_books")\
            .select("finished_at, rating, format, books(title, cover_url)")\
            .eq("user_id", user["id"])\
            .eq("status", "read")\
            .not_.is_("finished_at", "null")\
            .gte("finished_at", year_start)\
            .lte("finished_at", year_end)\
            .execute()

        for row in res.data:
            finished_at = row["finished_at"]
            month_num = int(finished_at[5:7])
            book = row.get("books") or {}
            fmt = row.get("format", "physical")
            
            month_map[month_num]["items"].append(MonthlyItem(
                title=book.get("title", ""),
                cover_url=book.get("cover_url"),
                rating=row.get("rating"),
                date=finished_at,
                format=fmt
            ))
            
            if fmt == "electronic":
                month_map[month_num]["electronic"] += 1
            else:
                month_map[month_num]["physical"] += 1

    elif type == "movies":
        res = supabase.table("user_movies")\
            .select("watched_at, rating, movies(title, poster_url)")\
            .eq("user_id", user["id"])\
            .eq("status", "watched")\
            .not_.is_("watched_at", "null")\
            .gte("watched_at", year_start)\
            .lte("watched_at", year_end)\
            .execute()

        for row in res.data:
            watched_at = row["watched_at"]
            month_num = int(watched_at[5:7])
            movie = row.get("movies") or {}
            month_map[month_num]["items"].append(MonthlyItem(
                title=movie.get("title", ""),
                cover_url=movie.get("poster_url"),
                rating=row.get("rating"),
                date=watched_at
            ))
            # Por ahora las pelis las contamos todas como physical/default
            month_map[month_num]["physical"] += 1

    return [
        MonthlyData(
            month=m, 
            count=len(data["items"]), 
            physical_count=data["physical"],
            electronic_count=data["electronic"],
            items=data["items"]
        )
        for m, data in sorted(month_map.items())
    ]


# ─── Gamificación ────────────────────────────────────────────────────

_ALL_TITLES = [
    {
        "id": "first_step",
        "name": "El Primer Paso",
        "icon": "🌱",
        "description": "Añadiste tu primer libro",
        "condition": "books_total >= 1",
    },
    {
        "id": "avid_reader",
        "name": "Lector Ávido",
        "icon": "📚",
        "description": "Has leído 10 libros",
        "condition": "books_read >= 10",
    },
    {
        "id": "cinephile",
        "name": "Cinéfilo Empedernido",
        "icon": "🎬",
        "description": "Has visto 20 películas",
        "condition": "movies_watched >= 20",
    },
    {
        "id": "completionist",
        "name": "El Completista",
        "icon": "⭐",
        "description": "Mantienes una racha de 30 días en algún hábito",
        "condition": "habit_streak >= 30",
    },
    {
        "id": "habit_master",
        "name": "Maestro de la Constancia",
        "icon": "🔥",
        "description": "Has completado todos tus hábitos de hoy",
        "condition": "all_habits_today",
    },
    {
        "id": "binge_watcher",
        "name": "Devorador de Series",
        "icon": "📺",
        "description": "Has completado 3 series",
        "condition": "series_watched >= 3",
    },
    {
        "id": "legend",
        "name": "Leyenda Viviente",
        "icon": "🏆",
        "description": "Has leído 50 libros",
        "condition": "books_read >= 50",
    },
]


@router.get("/legend-profile", response_model=LegendProfile)
async def get_legend_profile(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Devuelve el título activo y el progreso de gamificación del usuario."""
    from app.schemas.stats import LegendTitle, LegendProfile

    # Recoger datos clave
    books_res = supabase.table("user_books").select("status").eq("user_id", user["id"]).execute()
    books_read = len([b for b in books_res.data if b["status"] == "read"])
    books_total = len(books_res.data)

    movies_res = supabase.table("user_movies").select("status").eq("user_id", user["id"]).execute()
    movies_watched = len([m for m in movies_res.data if m["status"] == "watched"])

    series_res = supabase.table("user_series").select("status").eq("user_id", user["id"]).execute()
    series_watched = len([s for s in series_res.data if s["status"] == "watched"])

    habits_res = supabase.table("habits").select("id").eq("user_id", user["id"]).eq("is_archived", False).execute()
    habit_ids = [h["id"] for h in habits_res.data]
    today = date.today().isoformat()
    
    max_streak = 0
    all_habits_done = False
    if habit_ids:
        logs_today = supabase.table("habit_logs").select("habit_id").eq("user_id", user["id"]).eq("completed_at", today).execute()
        completed_today_ids = {l["habit_id"] for l in logs_today.data}
        all_habits_done = len(completed_today_ids) >= len(habit_ids) and len(habit_ids) > 0

        # Racha máxima simple: número de días consecutivos del hábito más constante
        for hid in habit_ids:
            logs = supabase.table("habit_logs").select("completed_at").eq("habit_id", hid).eq("user_id", user["id"]).order("completed_at", desc=True).limit(60).execute()
            streak = 0
            prev_date = date.today()
            for lg in logs.data:
                d = date.fromisoformat(lg["completed_at"])
                if (prev_date - d).days <= 1:
                    streak += 1
                    prev_date = d
                else:
                    break
            max_streak = max(max_streak, streak)

    context = {
        "books_read": books_read,
        "books_total": books_total,
        "movies_watched": movies_watched,
        "series_watched": series_watched,
        "habit_streak": max_streak,
        "all_habits_today": all_habits_done,
    }

    def _evaluate(condition: str) -> float:
        """Devuelve el progreso (0.0–1.0) hacia la condición."""
        if condition == "all_habits_today":
            return 1.0 if context["all_habits_today"] else 0.0
        op_map = {">=": ">="}
        for op in [">="]:
            if op in condition:
                key, val = condition.split(op)
                actual = context.get(key.strip(), 0)
                target = int(val.strip())
                return min(actual / target, 1.0)
        return 0.0

    unlocked = []
    locked = []
    for t in _ALL_TITLES:
        progress = _evaluate(t["condition"])
        title = LegendTitle(
            id=t["id"],
            name=t["name"],
            icon=t["icon"],
            description=t["description"],
            unlocked=progress >= 1.0,
            progress=round(progress, 2),
        )
        if progress >= 1.0:
            unlocked.append(title)
        else:
            locked.append(title)

    # El título activo es el último desbloqueado (más difícil)
    active = unlocked[-1] if unlocked else None
    # El siguiente es el más cercano a completarse
    next_title = sorted(locked, key=lambda t: t.progress, reverse=True)[0] if locked else None

    return LegendProfile(
        active_title=active,
        unlocked_titles=unlocked,
        next_title=next_title,
    )


@router.get("/monthly-highlight", response_model=MonthlyHighlight)
async def get_monthly_highlight(
    year: int | None = None,
    month: int | None = None,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Genera las estrellas del mes: mejor libro, película y hábito."""
    from app.schemas.stats import (
        MonthlyHighlight, MonthlyHighlightBook, MonthlyHighlightMovie, MonthlyHighlightHabit
    )
    today = date.today()
    target_year = year or today.year
    target_month = month or today.month

    # Rango del mes
    start = date(target_year, target_month, 1)
    if target_month == 12:
        end = date(target_year + 1, 1, 1)
    else:
        end = date(target_year, target_month + 1, 1)

    # ── Mejor libro del mes (mayor rating, terminado en el mes) ──
    best_book = None
    books_res = supabase.table("user_books")\
        .select("*, books(*)")\
        .eq("user_id", user["id"])\
        .eq("status", "read")\
        .gte("finished_at", start.isoformat())\
        .lt("finished_at", end.isoformat())\
        .order("rating", desc=True)\
        .execute()
    
    books_finished = len(books_res.data)
    pages_this_month = 0

    if books_res.data:
        top = books_res.data[0]
        b = top.get("books", {}) or {}
        best_book = MonthlyHighlightBook(
            title=b.get("title", top.get("title", "?")),
            cover_url=b.get("cover_url"),
            rating=float(top["rating"]) if top.get("rating") else None,
            authors=b.get("authors", []),
        )
    
    # ── Páginas leídas en el mes (Delta entre el inicio y fin del mes) ──
    pages_this_month = 0
    # Obtenemos los últimos logs antes del mes para cada libro
    prev_logs_res = supabase.table("book_progress_logs")\
        .select("user_book_id, current_page")\
        .eq("user_id", user["id"])\
        .lt("log_date", start.isoformat())\
        .order("log_date", desc=True)\
        .execute()
    
    # Mapa de última página antes del mes
    last_page_before = {}
    for l in prev_logs_res.data:
        ub_id = l["user_book_id"]
        if ub_id not in last_page_before:
            last_page_before[ub_id] = l["current_page"] or 0

    # Obtenemos el progreso máximo alcanzado dentro del mes para cada libro
    month_logs_res = supabase.table("book_progress_logs")\
        .select("user_book_id, current_page")\
        .eq("user_id", user["id"])\
        .gte("log_date", start.isoformat())\
        .lt("log_date", end.isoformat())\
        .order("current_page", desc=True)\
        .execute()
    
    max_page_in_month = {}
    for l in month_logs_res.data:
        ub_id = l["user_book_id"]
        if ub_id not in max_page_in_month:
            max_page_in_month[ub_id] = l["current_page"] or 0
    
    for ub_id, max_p in max_page_in_month.items():
        prev_p = last_page_before.get(ub_id, 0)
        delta = max_p - prev_p
        if delta > 0:
            pages_this_month += delta

    # ── Episodios y tiempo de series en el mes ──
    episodes_this_month = 0
    series_minutes_this_month = 0

    # Obtenemos todas las series en las que hubo actividad este mes
    series_logs_res = supabase.table("series_progress_logs")\
        .select("*, user_series(*, series(*))")\
        .eq("user_id", user["id"])\
        .gte("log_date", start.isoformat())\
        .lt("log_date", end.isoformat())\
        .execute()

    if series_logs_res.data:
        # Agrupamos por serie para calcular deltas
        series_groups = {}
        for l in series_logs_res.data:
            us_id = l["user_series_id"]
            if us_id not in series_groups:
                series_groups[us_id] = []
            series_groups[us_id].append(l)

        for us_id, logs in series_groups.items():
            us_data = logs[0]["user_series"]
            s_data = us_data["series"]
            if not s_data: continue
            
            seasons = s_data.get("seasons_data", [])
            run_time = s_data.get("episode_run_time", 0)

            def _get_abs_ep(s, e):
                abs_ep = e
                for sea in sorted(seasons, key=lambda x: x["season_number"]):
                    if sea["season_number"] < s:
                        abs_ep += sea["episode_count"]
                    else: break
                return abs_ep

            # Máximo absoluto en el mes
            max_log = max(logs, key=lambda x: _get_abs_ep(x["season"], x["episode"]))
            max_abs = _get_abs_ep(max_log["season"], max_log["episode"])

            # Máximo absoluto antes del mes
            prev_logs = supabase.table("series_progress_logs")\
                .select("season, episode")\
                .eq("user_series_id", us_id)\
                .lt("log_date", start.isoformat())\
                .order("log_date", desc=True)\
                .limit(1)\
                .execute()
            
            prev_abs = 0
            if prev_logs.data:
                pl = prev_logs.data[0]
                prev_abs = _get_abs_ep(pl["season"], pl["episode"])
            
            delta_eps = max_abs - prev_abs
            if delta_eps > 0:
                episodes_this_month += delta_eps
                series_minutes_this_month += (delta_eps * run_time)

    # ── Mejor película del mes ──
    best_movie = None
    movies_res = supabase.table("user_movies")\
        .select("*, movies(*)")\
        .eq("user_id", user["id"])\
        .eq("status", "watched")\
        .gte("watched_at", start.isoformat())\
        .lt("watched_at", end.isoformat())\
        .order("rating", desc=True)\
        .execute()

    movies_watched_count = len(movies_res.data)
    movie_minutes_this_month = 0
    if movies_res.data:
        top = movies_res.data[0]
        m = top.get("movies", {}) or {}
        best_movie = MonthlyHighlightMovie(
            title=m.get("title", "?"),
            poster_url=m.get("poster_url"),
            rating=float(top["rating"]) if top.get("rating") else None,
        )
        # Aproximación: 110 min por película si no tenemos dato
        movie_minutes_this_month = movies_watched_count * 110

    # ── Hábito estrella del mes ──
    top_habit = None
    habits_res = supabase.table("habits")\
        .select("id, name, icon")\
        .eq("user_id", user["id"])\
        .eq("is_archived", False)\
        .execute()

    best_streak = 0
    for h in habits_res.data:
        logs = supabase.table("habit_logs")\
            .select("completed_at")\
            .eq("habit_id", h["id"])\
            .gte("completed_at", start.isoformat())\
            .lt("completed_at", end.isoformat())\
            .execute()
        streak = len(logs.data)
        if streak > best_streak:
            best_streak = streak
            top_habit = MonthlyHighlightHabit(
                name=h["name"],
                icon=h.get("icon"),
                streak=streak,
            )

    # Tiempo total de inmersión
    reading_minutes = pages_this_month * 2
    total_minutes = reading_minutes + series_minutes_this_month + movie_minutes_this_month
    
    if total_minutes >= 60:
        h = total_minutes // 60
        m = total_minutes % 60
        reading_time = f"{h}h {m}min" if m else f"{h}h"
    else:
        reading_time = f"{total_minutes} min"

    return MonthlyHighlight(
        year=target_year,
        month=target_month,
        best_book=best_book,
        best_movie=best_movie,
        top_habit=top_habit,
        pages_read=pages_this_month,
        books_finished=books_finished,
        movies_watched=movies_watched_count,
        episodes_watched=episodes_this_month,
        reading_time_estimate=reading_time,
    )
