import pytest
from unittest.mock import patch, MagicMock
from app.schemas.books import BookSearchResult

# Indicamos a pytest que use asyncio para estas pruebas
pytestmark = pytest.mark.asyncio

@patch("app.routers.books.search_books")
async def test_search_books(mock_search, async_client):
    """
    Prueba que el endpoint de búsqueda de libros en Google Books funciona.
    """
    mock_search.return_value = [
        BookSearchResult(
            google_books_id="xyz",
            title="The Hobbit",
            authors=["J.R.R. Tolkien"],
            cover_url="http://example.com/cover.jpg",
        )
    ]
    
    response = await async_client.get("/books/search?q=tolkien")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "The Hobbit"
    assert data[0]["google_books_id"] == "xyz"

async def test_list_my_books(async_client, mock_supabase):
    """
    Prueba listar los libros del usuario.
    """
    mock_execute = MagicMock()
    mock_execute.data = [
        {
            "id": "user-book-1",
            "status": "reading",
            "rating": None,
            "books": {
                "google_books_id": "xyz",
                "title": "The Hobbit",
                "authors": ["J.R.R. Tolkien"]
            }
        }
    ]
    mock_supabase.table().select().eq().order().execute.return_value = mock_execute
    mock_supabase.table().select().eq().execute.return_value = mock_execute
    
    response = await async_client.get("/me/books")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "The Hobbit"
    assert data[0]["status"] == "reading"

@patch("app.routers.books.get_book_details")
async def test_add_book(mock_get_details, async_client, mock_supabase):
    """
    Prueba añadir un libro a la colección.
    """
    mock_get_details.return_value = MagicMock(model_dump=lambda: {
        "google_books_id": "xyz", 
        "title": "The Hobbit",
        "authors": ["J.R.R. Tolkien"]
    })
    
    # Mocking different returns for different tables
    def mock_table(table_name):
        mock_obj = MagicMock()
        if table_name == "books":
            mock_obj.select().eq().execute.return_value = MagicMock(data=[])
            mock_obj.insert().execute.return_value = MagicMock(data=[{"id": "book-id", "google_books_id": "xyz", "title": "The Hobbit", "authors": ["J.R.R. Tolkien"]}])
        elif table_name == "user_books":
            mock_obj.select().eq().eq().execute.return_value = MagicMock(data=[])
            mock_obj.insert().execute.return_value = MagicMock(data=[{
                "id": "user-book-id",
                "status": "want_to_read",
                "rating": None,
                "notes": None
            }])
        return mock_obj
        
    mock_supabase.table.side_effect = mock_table
    
    response = await async_client.post("/me/books", json={
        "google_books_id": "xyz",
        "status": "want_to_read"
    })
    
    assert response.status_code == 201
    assert response.json()["title"] == "The Hobbit"
    assert response.json()["status"] == "want_to_read"

async def test_update_my_book(async_client, mock_supabase):
    """
    Prueba actualizar un libro en la colección.
    """
    mock_supabase.table().update().eq().eq().execute.return_value = MagicMock(data=[{
        "id": "user-book-id",
        "book_id": "book-id",
        "status": "reading",
        "current_page": 50,
        "rating": None
    }])
    
    mock_supabase.table().select().eq().execute.return_value = MagicMock(data=[{
        "google_books_id": "xyz",
        "title": "The Hobbit",
        "authors": ["J.R.R. Tolkien"]
    }])
    
    response = await async_client.patch("/me/books/user-book-id", json={
        "status": "reading",
        "current_page": 50
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "reading"
    assert response.json()["current_page"] == 50

async def test_delete_my_book(async_client, mock_supabase):
    """
    Prueba eliminar un libro de la colección.
    """
    mock_supabase.table().delete().eq().eq().execute.return_value = MagicMock(data=[{"id": "deleted-id"}])
    
    response = await async_client.delete("/me/books/user-book-id")
    assert response.status_code == 204
