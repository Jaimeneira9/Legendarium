import logging
from datetime import date
from supabase import Client
from app.schemas.books import UserBookResponse, UserBookCreate, UserBookUpdate, BookSearchResult
from app.services.google_books import get_book_details

logger = logging.getLogger(__name__)

def map_user_book_row(row: dict) -> UserBookResponse:
    """
    Mapea una fila de la tabla user_books (con join a books) al esquema UserBookResponse.
    """
    try:
        book_data = row.get("books", {})
        if isinstance(book_data, list) and len(book_data) > 0:
            book_data = book_data[0]

        return UserBookResponse(
            id=row["id"],
            status=row["status"],
            format=row.get("format", "physical"),
            rating=row.get("rating"),
            current_page=row.get("current_page", 0),
            progress_percentage=row.get("progress_percentage"),
            notes=row.get("notes"),
            started_at=row.get("started_at"),
            finished_at=row.get("finished_at"),
            google_books_id=book_data.get("google_books_id", ""),
            title=book_data.get("title", ""),
            authors=book_data.get("authors", []),
            cover_url=book_data.get("cover_url"),
            page_count=book_data.get("page_count"),
            published_date=book_data.get("published_date"),
            description=book_data.get("description"),
            categories=book_data.get("categories", []),
        )
    except Exception as e:
        logger.error(f"Error mapping user book row: {e}", exc_info=True)
        raise

async def log_book_progress(
    supabase: Client, 
    user_id: str, 
    user_book_id: str, 
    current_page: int | None, 
    progress_percentage: float | None, 
    log_date: date | None = None
):
    """Registra el progreso de lectura en una fecha específica."""
    if current_page is None and progress_percentage is None:
        return
    
    target_date = log_date or date.today()
    try:
        log_entry = {
            "user_id": user_id,
            "user_book_id": user_book_id,
            "log_date": target_date.isoformat()
        }
        if current_page is not None:
            log_entry["current_page"] = current_page
        if progress_percentage is not None:
            log_entry["progress_percentage"] = progress_percentage
            
        supabase.table("book_progress_logs").upsert(
            log_entry, 
            on_conflict="user_book_id,log_date"
        ).execute()
    except Exception as e:
        logger.warning(f"Failed to log book progress: {e}")

async def ensure_book_in_catalog(supabase: Client, google_books_id: str) -> dict:
    """Busca un libro en el catálogo local o lo importa de Google Books."""
    existing = supabase.table("books").select("*").eq("google_books_id", google_books_id).execute()
    if existing.data:
        return existing.data[0]
    
    details = await get_book_details(google_books_id)
    if not details:
        raise ValueError("Book not found in Google Books")
    
    insert_result = supabase.table("books").insert(details.model_dump()).execute()
    return insert_result.data[0]
