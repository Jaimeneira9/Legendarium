"""
Servicio de hábitos — lógica de rachas (streaks) y estadísticas.
"""
from datetime import date, timedelta


def calculate_streak(completed_dates: list[date], today: date | None = None) -> int:
    """
    Calcula la racha actual (días consecutivos completados hasta hoy).

    Ejemplo: si hoy es Jueves y completaste Jue, Mié, Mar pero no Lunes → racha = 3

    Parámetros:
    - completed_dates: lista de fechas en las que se completó el hábito
    - today: fecha actual (por defecto hoy)
    """
    if not completed_dates:
        return 0

    if today is None:
        today = date.today()

    # Ordenar de más reciente a más antigua
    sorted_dates = sorted(set(completed_dates), reverse=True)

    # Si hoy no está completado, la racha puede empezar desde ayer
    if sorted_dates[0] == today:
        current = today
    elif sorted_dates[0] == today - timedelta(days=1):
        current = today - timedelta(days=1)
    else:
        # Ni hoy ni ayer → la racha está rota
        return 0

    streak = 0
    for d in sorted_dates:
        if d == current:
            streak += 1
            current -= timedelta(days=1)
        elif d < current:
            break

    return streak


def calculate_longest_streak(completed_dates: list[date]) -> int:
    """
    Calcula la racha más larga de toda la historia del hábito.
    """
    if not completed_dates:
        return 0

    sorted_dates = sorted(set(completed_dates))
    longest = 1
    current = 1

    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] == sorted_dates[i - 1] + timedelta(days=1):
            current += 1
            longest = max(longest, current)
        else:
            current = 1

    return longest


def calculate_completion_rate(
    completed_dates: list[date], days: int, today: date | None = None
) -> float:
    """
    Calcula el % de completitud en los últimos N días.

    Ejemplo: si days=7 y completaste 5 de los últimos 7 días → 71.4%
    """
    if today is None:
        today = date.today()

    start = today - timedelta(days=days - 1)
    count = sum(1 for d in completed_dates if start <= d <= today)

    return round((count / days) * 100, 1)
