import pytest
from unittest.mock import MagicMock
from datetime import date

# Indicamos a pytest que use asyncio para estas pruebas
pytestmark = pytest.mark.asyncio

async def test_list_habits(async_client, mock_supabase):
    """Prueba listar hábitos del usuario."""
    mock_supabase.table().select().eq().eq().order().execute.return_value = MagicMock(data=[{
        "id": "habit-1",
        "name": "Leer 20 páginas",
        "frequency": "daily",
        "color": "blue",
        "icon": "book",
        "target_days": [1, 2, 3, 4, 5, 6, 7],
        "is_archived": False,
        "created_at": "2026-01-01T00:00:00Z"
    }])
    
    response = await async_client.get("/me/habits")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Leer 20 páginas"

async def test_create_habit(async_client, mock_supabase):
    """Prueba crear un hábito."""
    mock_supabase.table().insert().execute.return_value = MagicMock(data=[{
        "id": "habit-new",
        "name": "Meditar",
        "frequency": "daily",
        "color": "green",
        "icon": "peace",
        "target_days": [1, 2, 3, 4, 5, 6, 7],
        "is_archived": False,
        "created_at": "2026-01-01T00:00:00Z"
    }])
    
    response = await async_client.post("/me/habits", json={
        "name": "Meditar",
        "frequency": "daily",
        "color": "green",
        "icon": "peace"
    })
    
    assert response.status_code == 201
    assert response.json()["name"] == "Meditar"

async def test_habits_today(async_client, mock_supabase):
    """Prueba listar hábitos de hoy con estado."""
    # Mock habits
    mock_supabase.table().select().eq().eq().order().execute.return_value = MagicMock(data=[{
        "id": "habit-1",
        "name": "Leer 20 páginas",
        "frequency": "daily",
        "color": "blue",
        "icon": "book",
        "target_days": [1, 2, 3, 4, 5, 6, 7],
        "is_archived": False,
        "created_at": "2026-01-01T00:00:00Z"
    }])
    
    # Mock logs
    mock_supabase.table().select().eq().gte().execute.return_value = MagicMock(data=[{
        "habit_id": "habit-1",
        "completed_at": date.today().isoformat()
    }])
    
    response = await async_client.get("/me/habits/today")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["completed_today"] is True
    assert data[0]["current_streak"] == 1

async def test_log_habit(async_client, mock_supabase):
    """Prueba loguear un hábito."""
    mock_supabase.table().select().eq().eq().execute.return_value = MagicMock(data=[{"id": "habit-1"}])
    mock_supabase.table().insert().execute.return_value = MagicMock()
    
    response = await async_client.post("/me/habits/habit-1/log")
    assert response.status_code == 201
    assert response.json()["message"] == "Hábito completado ✅"
