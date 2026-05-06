import logging
from supabase import Client
from app.schemas.movies import UserMovieResponse, UserMovieCreate, UserMovieUpdate
from app.services.tmdb import get_movie_details

logger = logging.getLogger(__name__)

def map_user_movie_row(row: dict) -> UserMovieResponse:
    """
    Mapea una fila de la tabla user_movies (con join a movies) al esquema UserMovieResponse.
    """
    try:
        movie_data = row.get("movies", {})
        if isinstance(movie_data, list) and len(movie_data) > 0:
            movie_data = movie_data[0]

        return UserMovieResponse(
            id=row["id"],
            status=row["status"],
            rating=row.get("rating"),
            notes=row.get("notes"),
            watched_at=row.get("watched_at"),
            tmdb_id=movie_data.get("tmdb_id", 0),
            title=movie_data.get("title", ""),
            poster_url=movie_data.get("poster_url"),
            release_date=str(movie_data["release_date"]) if movie_data.get("release_date") else None,
            runtime=movie_data.get("runtime") or 0,
        )
    except Exception as e:
        logger.error(f"Error mapping user movie row: {e}", exc_info=True)
        raise

async def ensure_movie_in_catalog(supabase: Client, tmdb_id: int) -> dict:
    """Busca una película en el catálogo local o la importa de TMDB."""
    existing = supabase.table("movies").select("*").eq("tmdb_id", tmdb_id).execute()
    if existing.data:
        return existing.data[0]
    
    # Nota: Aquí asumo que tmdb_id es de película. En una implementación real 
    # habría que distinguir entre movie y tv.
    from app.config import get_settings
    settings = get_settings()
    details = await get_movie_details(tmdb_id, settings.tmdb_api_key)
    if not details:
        raise ValueError("Movie not found in TMDB")
    
    insert_result = supabase.table("movies").insert(details.model_dump()).execute()
    return insert_result.data[0]
