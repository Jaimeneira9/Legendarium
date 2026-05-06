import pytest
from unittest.mock import patch, MagicMock

# Indicamos a pytest que use asyncio para estas pruebas
pytestmark = pytest.mark.asyncio

@patch("app.routers.movies.search_movies")
async def test_search_movies(mock_search, async_client):
    """
    Prueba que el endpoint de búsqueda de películas en TMDB funciona.
    """
    mock_search.return_value = [
        {
            "tmdb_id": 123,
            "title": "Inception",
            "overview": "A dream within a dream.",
            "poster_url": "http://example.com/poster.jpg"
        }
    ]
    
    response = await async_client.get("/movies/search?q=inception")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "Inception"
    assert data[0]["tmdb_id"] == 123

async def test_list_my_movies(async_client, mock_supabase):
    """
    Prueba listar las películas del usuario.
    """
    # Configurar el mock de Supabase
    mock_execute = MagicMock()
    mock_execute.data = [
        {
            "id": "abc",
            "status": "watched",
            "rating": 5,
            "movies": {
                "tmdb_id": 123,
                "title": "Inception"
            }
        }
    ]
    mock_supabase.table().select().eq().order().execute.return_value = mock_execute
    mock_supabase.table().select().eq().execute.return_value = mock_execute
    
    response = await async_client.get("/me/movies")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Inception"
    assert data[0]["status"] == "watched"

@patch("app.routers.movies.get_movie_details")
async def test_add_movie(mock_get_details, async_client, mock_supabase):
    """
    Prueba añadir una película a la colección.
    """
    mock_get_details.return_value = MagicMock(model_dump=lambda: {"tmdb_id": 123, "title": "Inception"})
    
    # Mocking different returns for different tables
    def mock_table(table_name):
        mock_obj = MagicMock()
        if table_name == "movies":
            mock_obj.select().eq().execute.return_value = MagicMock(data=[])
            mock_obj.insert().execute.return_value = MagicMock(data=[{"id": "movie-id", "tmdb_id": 123, "title": "Inception"}])
        elif table_name == "user_movies":
            mock_obj.select().eq().eq().execute.return_value = MagicMock(data=[])
            mock_obj.insert().execute.return_value = MagicMock(data=[{
                "id": "user-movie-id",
                "status": "watched",
                "rating": None,
                "notes": None
            }])
        return mock_obj
        
    mock_supabase.table.side_effect = mock_table
    
    response = await async_client.post("/me/movies", json={
        "tmdb_id": 123,
        "status": "watched"
    })
    
    assert response.status_code == 201
    assert response.json()["title"] == "Inception"
    assert response.json()["status"] == "watched"

async def test_update_my_movie(async_client, mock_supabase):
    """
    Prueba actualizar una película en la colección.
    """
    mock_supabase.table().update().eq().eq().execute.return_value = MagicMock(data=[{
        "id": "user-movie-id",
        "book_id": "movie-id",
        "movie_id": "movie-id",
        "status": "plan_to_watch",
        "rating": 4
    }])
    
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[{
        "tmdb_id": "123",
        "title": "Inception"
    }])
    
    response = await async_client.patch("/me/movies/user-movie-id", json={
        "status": "plan_to_watch",
        "rating": 4
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "plan_to_watch"
    assert response.json()["rating"] == 4

async def test_delete_my_movie(async_client, mock_supabase):
    """
    Prueba eliminar una película de la colección.
    """
    mock_supabase.table().delete().eq().eq().execute.return_value = MagicMock(data=[{"id": "deleted-id"}])
    
    response = await async_client.delete("/me/movies/user-movie-id")
    assert response.status_code == 204
