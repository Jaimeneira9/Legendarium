"""
Schemas de películas — validación de datos para búsqueda,
creación y actualización de películas en la colección del usuario.
"""
from pydantic import BaseModel
from datetime import date


class MovieSearchResult(BaseModel):
    """Un resultado de búsqueda de TMDB (normalizado)."""
    tmdb_id: int
    title: str
    original_title: str | None = None
    poster_url: str | None = None
    overview: str | None = None
    release_date: str | None = None
    genres: list[str] = []
    vote_average: float | None = None
    runtime: int = 0


class UserMovieCreate(BaseModel):
    """Datos para añadir una película a mi colección."""
    tmdb_id: int
    status: str = "want_to_watch"  # want_to_watch, watched, dropped
    rating: float | None = None
    watched_at: date | None = None


class UserMovieUpdate(BaseModel):
    """Datos para actualizar una película en mi colección."""
    status: str | None = None
    rating: float | None = None
    notes: str | None = None
    watched_at: date | None = None


class UserMovieResponse(BaseModel):
    """Una película en la colección del usuario."""
    id: str
    status: str
    rating: float | None = None
    notes: str | None = None
    watched_at: date | None = None
    # Datos de la película (del catálogo)
    tmdb_id: int
    title: str
    poster_url: str | None = None
    release_date: str | None = None
    runtime: int = 0
