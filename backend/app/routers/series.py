from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
from app.dependencies import get_supabase, get_current_user
from app.config import get_settings, Settings
from app.services.tmdb import search_tv, get_tv_details
from app.schemas.series import (
    SeriesSearchResult, UserSeriesCreate, UserSeriesUpdate, UserSeriesResponse,
)
import logging
from datetime import date

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Series"])

def map_user_series_row(row: dict):
    s = row["series"]
    return {
        "id": row["id"],
        "status": row["status"],
        "rating": row["rating"],
        "notes": row["notes"],
        "current_season": row["current_season"],
        "current_episode": row["current_episode"],
        "last_watched_at": str(row["last_watched_at"]) if row.get("last_watched_at") else None,
        "tmdb_id": s["tmdb_id"],
        "title": s["title"],
        "poster_url": s["poster_url"],
        "release_date": str(s["first_air_date"]) if s.get("first_air_date") else None,
        "total_seasons": s.get("total_seasons", 1),
        "total_episodes": s.get("total_episodes", 1),
        "episode_run_time": s.get("episode_run_time", 0),
        "seasons_data": s.get("seasons_data", []),
    }

@router.get("/series/search", response_model=list[SeriesSearchResult])
async def search(
    q: str = Query(..., description="Texto a buscar"),
    year: int | None = Query(None, description="Filtrar por año de estreno"),
    anime: bool = Query(False, description="Solo anime"),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    """Busca series/anime."""
    try:
        # Buscar en local
        query = supabase.table("series").select("*").ilike("title", f"%{q}%")
        if year:
            query = query.gte("first_air_date", f"{year}-01-01").lte("first_air_date", f"{year}-12-31")
        
        local_results = query.limit(10).execute()
        results_list = []
        seen_ids = set()

        for s in local_results.data:
            seen_ids.add(s["tmdb_id"])
            results_list.append(SeriesSearchResult(
                tmdb_id=s["tmdb_id"],
                title=s["title"],
                original_title=s.get("original_title"),
                poster_url=s.get("poster_url"),
                overview=s.get("overview"),
                release_date=str(s["first_air_date"]) if s.get("first_air_date") else None,
                genres=s.get("genres", []),
                vote_average=s.get("vote_average", 0)
            ))

        # Buscar en TMDB (usa cache)
        api_results = await search_tv(supabase, q, settings.tmdb_api_key, year=year, anime_only=anime)
        for s in api_results:
            if s.tmdb_id not in seen_ids:
                results_list.append(s)

        return results_list[:20]
    except Exception as e:
        logger.error(f"Error in series search: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Error en el servicio de búsqueda")

@router.get("/me/series", response_model=list[UserSeriesResponse])
async def list_my_series(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    """Lista mis series con paginación."""
    query = supabase.table("user_series").select("*, series(*)").eq("user_id", user["id"])
    if status_filter:
        query = query.eq("status", status_filter)
    result = query.order("updated_at", desc=True).order("id").limit(limit).offset(offset).execute()
    
    mapped_data = []
    for row in result.data:
        s = row.get("series")
        # Auto-repair solo en la primera página para evitar llamadas masivas a TMDB al paginar
        if offset == 0 and s and (not s.get("seasons_data") or len(s.get("seasons_data", [])) == 0 or not s.get("episode_run_time")):
            try:
                details = await get_tv_details(s["tmdb_id"], settings.tmdb_api_key)
                if details:
                    supabase.table("series").update({
                        "seasons_data": details["seasons_data"],
                        "total_episodes": details["total_episodes"],
                        "total_seasons": details["total_seasons"],
                        "episode_run_time": details["episode_run_time"]
                    }).eq("id", s["id"]).execute()
                    row["series"].update({
                        "seasons_data": details["seasons_data"],
                        "total_episodes": details["total_episodes"],
                        "total_seasons": details["total_seasons"],
                        "episode_run_time": details["episode_run_time"]
                    })
            except Exception as e:
                logger.error(f"Error repairing series {s['tmdb_id']}: {e}")
        
        mapped_data.append(map_user_series_row(row))
        
    return mapped_data

@router.post("/me/series", response_model=UserSeriesResponse, status_code=201)
async def add_series(
    body: UserSeriesCreate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    """Añade serie a la colección."""
    existing = supabase.table("series").select("*").eq("tmdb_id", body.tmdb_id).execute()
    
    if existing.data:
        series = existing.data[0]
    else:
        details = await get_tv_details(body.tmdb_id, settings.tmdb_api_key)
        if not details: raise HTTPException(status_code=404, detail="No encontrada en TMDB")
        
        # Guardar en catálogo
        ins = supabase.table("series").insert({
            "tmdb_id": details["tmdb_id"], "title": details["title"],
            "original_title": details["original_title"], "poster_url": details["poster_url"],
            "overview": details["overview"], "first_air_date": details["release_date"],
            "genres": details["genres"], "vote_average": details["vote_average"],
            "total_seasons": details["total_seasons"], "total_episodes": details["total_episodes"],
            "episode_run_time": details["episode_run_time"],
            "seasons_data": details["seasons_data"],
        }).execute()
        series = ins.data[0]

    dup = supabase.table("user_series").select("*").eq("user_id", user["id"]).eq("series_id", series["id"]).execute()
    if dup.data:
        # Upsert logic
        existing_id = dup.data[0]["id"]
        update_data = body.model_dump(exclude={"tmdb_id"}, mode='json', exclude_none=True)
        row = supabase.table("user_series").update(update_data).eq("id", existing_id).execute().data[0]
    else:
        insert_data = {
            "user_id": user["id"], "series_id": series["id"],
            **body.model_dump(exclude={"tmdb_id"}, mode='json')
        }
        row = supabase.table("user_series").insert(insert_data).execute().data[0]

    row["series"] = series
    return map_user_series_row(row)

@router.patch("/me/series/{user_series_id}", response_model=UserSeriesResponse)
async def update_my_series(
    user_series_id: str, body: UserSeriesUpdate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Actualiza progreso, status, rating."""
    data = body.model_dump(exclude_none=True, mode='json')
    if not data: raise HTTPException(status_code=400, detail="Nada que actualizar")

    result = supabase.table("user_series").update(data).eq("id", user_series_id).eq("user_id", user["id"]).execute()
    if not result.data: raise HTTPException(status_code=404, detail="No encontrada")

    row = result.data[0]

    # Registrar log de progreso si ha cambiado la temporada o el episodio
    if "current_season" in data or "current_episode" in data:
        try:
            from datetime import date
            today = date.today().isoformat()
            supabase.table("series_progress_logs").upsert({
                "user_id": user["id"],
                "user_series_id": user_series_id,
                "season": row["current_season"],
                "episode": row["current_episode"],
                "log_date": today
            }, on_conflict="user_series_id, log_date").execute()
        except Exception as e:
            logger.error(f"Error logging series progress: {e}")

    s = supabase.table("series").select("*").eq("id", row["series_id"]).execute().data[0]
    row["series"] = s
    return map_user_series_row(row)

@router.delete("/me/series/{user_series_id}", status_code=204)
async def delete_my_series(
    user_series_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    supabase.table("user_series").delete().eq("id", user_series_id).eq("user_id", user["id"]).execute()
