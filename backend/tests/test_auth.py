import pytest
from unittest.mock import MagicMock

# Indicamos a pytest que use asyncio para estas pruebas
pytestmark = pytest.mark.asyncio

async def test_register(async_client, mock_supabase):
    """Prueba el registro de un nuevo usuario."""
    mock_auth_response = MagicMock()
    mock_auth_response.user.id = "new-user-id"
    mock_auth_response.session.access_token = "access-token"
    mock_auth_response.session.refresh_token = "refresh-token"
    mock_auth_response.session.expires_in = 3600
    
    mock_supabase.auth.sign_up.return_value = mock_auth_response
    mock_supabase.table().insert().execute.return_value = MagicMock()
    
    response = await async_client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "display_name": "Test User"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "access-token"
    assert data["refresh_token"] == "refresh-token"

async def test_login(async_client, mock_supabase):
    """Prueba el inicio de sesión."""
    mock_auth_response = MagicMock()
    mock_auth_response.session.access_token = "access-token"
    mock_auth_response.session.refresh_token = "refresh-token"
    mock_auth_response.session.expires_in = 3600
    
    mock_supabase.auth.sign_in_with_password.return_value = mock_auth_response
    
    response = await async_client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "access-token"

async def test_get_me(async_client, mock_supabase):
    """Prueba obtener el perfil del usuario autenticado."""
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[{
        "id": "12345678-1234-5678-1234-567812345678",
        "display_name": "Mock User",
        "username": "mockuser",
        "avatar_url": None
    }])
    
    response = await async_client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["display_name"] == "Mock User"

async def test_update_me(async_client, mock_supabase):
    """Prueba actualizar el perfil del usuario."""
    mock_supabase.table().update().eq().execute.return_value = MagicMock(data=[{
        "id": "12345678-1234-5678-1234-567812345678",
        "display_name": "Updated User",
        "username": "updateduser",
        "avatar_url": None
    }])
    
    response = await async_client.patch("/auth/me", json={
        "display_name": "Updated User"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["display_name"] == "Updated User"
