import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.dependencies import get_current_user, get_supabase

# Mock user data
MOCK_USER = {
    "id": "12345678-1234-5678-1234-567812345678",
    "email": "test@example.com"
}

def override_get_current_user():
    return MOCK_USER

# Apply overrides
app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture(scope="session")
def client():
    """
    Cliente síncrono para endpoints que no requieren async.
    """
    with TestClient(app) as c:
        yield c

@pytest.fixture
async def async_client():
    """
    Cliente asíncrono para probar los endpoints de nuestra API.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest.fixture
def mock_supabase():
    """
    Devuelve un mock de Supabase nuevo para cada test.
    Se inyecta dinámicamente en los overrides de FastAPI.
    """
    mock_client = MagicMock()
    app.dependency_overrides[get_supabase] = lambda: mock_client
    yield mock_client
    # Limpieza después del test
    app.dependency_overrides.pop(get_supabase, None)

