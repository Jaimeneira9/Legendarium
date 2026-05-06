"""
Router de hábitos — CRUD, log diario y estadísticas.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from app.dependencies import get_supabase, get_current_user
from app.schemas.habits import (
    HabitCreate, HabitUpdate, HabitResponse, HabitWithStatus, HabitStats,
)
from app.services.habits import (
    calculate_streak, calculate_longest_streak, calculate_completion_rate,
)

router = APIRouter(tags=["Habits"])


@router.get("/me/habits", response_model=list[HabitResponse])
async def list_habits(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Lista mis hábitos activos (no archivados)."""
    result = (
        supabase.table("habits").select("*")
        .eq("user_id", user["id"]).eq("is_archived", False)
        .order("created_at").execute()
    )
    return [HabitResponse(**row) for row in result.data]


@router.post("/me/habits", response_model=HabitResponse, status_code=201)
async def create_habit(
    body: HabitCreate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Crea un nuevo hábito."""
    result = supabase.table("habits").insert({
        "user_id": user["id"],
        **body.model_dump(),
    }).execute()
    return HabitResponse(**result.data[0])


@router.patch("/me/habits/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: str, body: HabitUpdate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Edita un hábito existente."""
    data = body.model_dump(exclude_none=True, mode='json')
    if not data:
        raise HTTPException(status_code=400, detail="Nada que actualizar")

    result = (
        supabase.table("habits").update(data)
        .eq("id", habit_id).eq("user_id", user["id"]).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")
    return HabitResponse(**result.data[0])


@router.delete("/me/habits/{habit_id}", status_code=204)
async def archive_habit(
    habit_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Archiva un hábito (soft delete — no se borra, se oculta)."""
    result = (
        supabase.table("habits").update({"is_archived": True})
        .eq("id", habit_id).eq("user_id", user["id"]).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")


# ─── Log diario ────────────────────────────────────────────────────

@router.get("/me/habits/today", response_model=list[HabitWithStatus])
async def habits_today(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """
    Todos los hábitos con su estado de hoy (✅ o ❌).
    Este es el endpoint principal que usa la pantalla de hábitos.
    """
    today = date.today()

    # Obtener hábitos activos
    habits_result = (
        supabase.table("habits").select("*")
        .eq("user_id", user["id"]).eq("is_archived", False)
        .order("created_at").execute()
    )

    # Obtener todos los logs del usuario (últimos 90 días para rachas)
    since = (today - timedelta(days=90)).isoformat()
    logs_result = (
        supabase.table("habit_logs").select("habit_id, completed_at")
        .eq("user_id", user["id"]).gte("completed_at", since).execute()
    )

    # Agrupar logs por habit_id
    logs_by_habit: dict[str, list[date]] = {}
    for log in logs_result.data:
        hid = log["habit_id"]
        d = date.fromisoformat(log["completed_at"])
        logs_by_habit.setdefault(hid, []).append(d)

    habits = []
    for h in habits_result.data:
        dates = logs_by_habit.get(h["id"], [])
        # Pasamos todos los campos del row de DB que coincidan con HabitResponse
        habit_data = {k: v for k, v in h.items() if k in HabitResponse.model_fields}
        habits.append(HabitWithStatus(
            **habit_data,
            completed_today=today in dates,
            current_streak=calculate_streak(dates, today),
        ))

    return habits


@router.post("/me/habits/{habit_id}/log", status_code=201)
async def log_habit(
    habit_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Marca un hábito como completado HOY."""
    # Verificar que el hábito pertenece al usuario
    habit = (
        supabase.table("habits").select("id")
        .eq("id", habit_id).eq("user_id", user["id"]).execute()
    )
    if not habit.data:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")

    try:
        supabase.table("habit_logs").insert({
            "habit_id": habit_id,
            "user_id": user["id"],
            "completed_at": date.today().isoformat(),
        }).execute()
    except Exception:
        raise HTTPException(status_code=409, detail="Ya completado hoy")

    return {"message": "Hábito completado ✅"}


@router.delete("/me/habits/{habit_id}/log/{log_date}", status_code=204)
async def unlog_habit(
    habit_id: str, log_date: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Desmarca un hábito de un día específico (YYYY-MM-DD)."""
    result = (
        supabase.table("habit_logs").delete()
        .eq("habit_id", habit_id).eq("user_id", user["id"])
        .eq("completed_at", log_date).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Log no encontrado")


# ─── Estadísticas ──────────────────────────────────────────────────

@router.get("/me/habits/{habit_id}/stats", response_model=HabitStats)
async def habit_stats(
    habit_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """Estadísticas de un hábito: rachas, % de completitud."""
    habit = (
        supabase.table("habits").select("*")
        .eq("id", habit_id).eq("user_id", user["id"]).execute()
    )
    if not habit.data:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")

    logs = (
        supabase.table("habit_logs").select("completed_at")
        .eq("habit_id", habit_id).eq("user_id", user["id"])
        .order("completed_at").execute()
    )

    dates = [date.fromisoformat(l["completed_at"]) for l in logs.data]
    today = date.today()

    return HabitStats(
        habit_id=habit_id,
        habit_name=habit.data[0]["name"],
        current_streak=calculate_streak(dates, today),
        longest_streak=calculate_longest_streak(dates),
        total_completions=len(dates),
        completion_rate_week=calculate_completion_rate(dates, 7, today),
        completion_rate_month=calculate_completion_rate(dates, 30, today),
    )
