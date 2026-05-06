"""
Schemas de libros — validación de datos para búsqueda,
creación y actualización de libros en la colección del usuario.
"""
from pydantic import BaseModel
from datetime import date


class BookSearchResult(BaseModel):
    """Un resultado de búsqueda de Google Books (normalizado)."""
    google_books_id: str
    title: str
    authors: list[str]
    published_date: str | None = None
    cover_url: str | None = None
    description: str | None = None
    categories: list[str] = []
    page_count: int | None = None
    isbn: str | None = None


class UserBookCreate(BaseModel):
    """Datos para añadir un libro a mi colección."""
    google_books_id: str
    status: str = "want_to_read"  # want_to_read, reading, read, dropped
    format: str = "physical"      # physical, electronic
    rating: float | None = None
    started_at: date | None = None
    finished_at: date | None = None


class UserBookUpdate(BaseModel):
    """Datos para actualizar un libro en mi colección."""
    status: str | None = None
    rating: float | None = None
    current_page: int | None = None
    progress_percentage: float | None = None
    format: str | None = None
    notes: str | None = None
    started_at: date | None = None
    finished_at: date | None = None


class UserBookResponse(BaseModel):
    """Un libro en la colección del usuario (con datos del catálogo)."""
    id: str
    status: str
    format: str = "physical"
    rating: float | None = None
    current_page: int = 0
    progress_percentage: float | None = None
    notes: str | None = None
    started_at: date | None = None
    finished_at: date | None = None
    # Datos del libro (del catálogo)
    google_books_id: str
    title: str
    authors: list[str]
    cover_url: str | None = None
    page_count: int | None = None
    published_date: str | None = None
    description: str | None = None
    categories: list[str] = []
    isbn: str | None = None
