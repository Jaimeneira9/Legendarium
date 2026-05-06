"""
Schemas de hábitos — validación de datos para CRUD de hábitos,
registro diario (logs) y estadísticas.
"""
from pydantic import BaseModel
from datetime import date


class HabitCreate(BaseModel):
    """Datos para crear un hábito."""
    name: str
    description: str | None = None
    icon: str | None = "✅"
    color: str | None = "#c96442"  # Terracotta por defecto
    frequency: str = "daily"  # daily, weekly, custom
    target_days: list[int] = [1, 2, 3, 4, 5, 6, 7]  # 1=Lun, 7=Dom
    image_url: str | None = None


class HabitUpdate(BaseModel):
    """Datos para editar un hábito."""
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    frequency: str | None = None
    target_days: list[int] | None = None
    image_url: str | None = None


class HabitResponse(BaseModel):
    """Un hábito del usuario."""
    id: str
    name: str
    description: str | None = None
    icon: str | None = None
    color: str | None = None
    frequency: str
    target_days: list[int]
    image_url: str | None = None
    is_archived: bool = False


class HabitWithStatus(HabitResponse):
    """Un hábito con su estado de hoy (completado o no)."""
    completed_today: bool = False
    current_streak: int = 0


class HabitStats(BaseModel):
    """Estadísticas de un hábito."""
    habit_id: str
    habit_name: str
    current_streak: int = 0
    longest_streak: int = 0
    total_completions: int = 0
    completion_rate_week: float = 0.0   # % de la última semana
    completion_rate_month: float = 0.0  # % del último mes
