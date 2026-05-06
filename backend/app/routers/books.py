"""
Router de libros — búsqueda en Google Books y CRUD de la colección del usuario.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
from datetime import date
import logging

from app.dependencies import get_supabase, get_current_user
from app.services.google_books import search_books, get_book_details
from app.schemas.books import (
    BookSearchResult,
    UserBookCreate,
    UserBookUpdate,
    UserBookResponse,
)
from app.services.books_service import (
    map_user_book_row, 
    log_book_progress, 
    ensure_book_in_catalog
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Books"])

@router.get("/books/search", response_model=list[BookSearchResult])
async def search(
    q: str = Query(..., description="Texto a buscar (título, autor, ISBN...)"),
    lang: str | None = Query("es", description="Idioma: es, en, all"),
    author: str | None = Query(None, description="Filtrar por autor"),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    try:
        # 1. Buscar en nuestra DB (ilike en título o autores)
        local_query = supabase.table("books")\
            .select("*")\
            .ilike("title", f"%{q}%")

        if author:
            local_query = local_query.ilike("authors", f"%{author}%")

        local_results = local_query.limit(10).execute()
        books_list = []
        seen_ids = set()

        for b in local_results.data:
            seen_ids.add(b["google_books_id"])
            books_list.append(BookSearchResult(
                google_books_id=b["google_books_id"],
                title=b["title"],
                authors=b.get("authors", ["Desconocido"]),
                published_date=b.get("published_date", ""),
                cover_url=b.get("cover_url"),
                description=b.get("description"),
                categories=b.get("categories", []),
                page_count=b.get("page_count", 0)
            ))

        # 2. Buscar en Google Books (ahora usa cache interno)
        try:
            api_results = await search_books(supabase, q, lang=lang, author=author)
            for b in api_results:
                if b.google_books_id not in seen_ids:
                    books_list.append(b)
        except Exception as api_err:
            logger.warning(f"Google Books API error: {api_err}")

        # Priorizar resultados con portada
        books_list.sort(key=lambda b: (b.cover_url is None, b.cover_url == ""), reverse=False)
        return books_list[:20]

    except Exception as e:
        logger.error(f"Error in hybrid search: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error en el servicio de búsqueda",
        )

@router.get("/books/{google_books_id}", response_model=BookSearchResult)
async def get_book(
    google_books_id: str,
    user: dict = Depends(get_current_user),
):
    result = await get_book_details(google_books_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    return result

@router.get("/me/books", response_model=list[UserBookResponse])
async def list_my_books(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    query = supabase.table("user_books").select("*, books(*)").eq("user_id", user["id"])
    if status_filter:
        query = query.eq("status", status_filter)
    result = query.order("updated_at", desc=True).order("id").limit(limit).offset(offset).execute()
    return [map_user_book_row(row) for row in result.data]

@router.post("/me/books", response_model=UserBookResponse, status_code=status.HTTP_201_CREATED)
async def add_book(
    body: UserBookCreate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # 1. Asegurar que el libro esté en el catálogo local
    book = await ensure_book_in_catalog(supabase, body.google_books_id)

    # 2. Verificar si ya lo tiene
    existing_user_book = supabase.table("user_books")\
        .select("*")\
        .eq("user_id", user["id"])\
        .eq("book_id", book["id"])\
        .execute()

    if existing_user_book.data:
        existing_id = existing_user_book.data[0]["id"]
        update_data = body.model_dump(exclude={"google_books_id"}, mode='json', exclude_none=True)
        if update_data.get("status") == "read" and book.get("page_count"):
            update_data["current_page"] = book["page_count"]
            update_data["progress_percentage"] = 100
        
        res = supabase.table("user_books").update(update_data).eq("id", existing_id).execute()
        if "current_page" in update_data:
            await log_book_progress(supabase, user["id"], existing_id, 
                                   update_data["current_page"], update_data.get("progress_percentage"),
                                   body.finished_at)
        row = res.data[0]
        row["books"] = book
        return map_user_book_row(row)

    # 3. Crear relación
    insert_data = {
        "user_id": user["id"],
        "book_id": book["id"],
        **body.model_dump(exclude={"google_books_id"}, mode='json')
    }
    if body.status == "read" and book.get("page_count"):
        insert_data["current_page"] = book["page_count"]
        insert_data["progress_percentage"] = 100

    res = supabase.table("user_books").insert(insert_data).execute()
    if res.data and "current_page" in insert_data:
        await log_book_progress(supabase, user["id"], res.data[0]["id"], 
                               insert_data["current_page"], insert_data.get("progress_percentage"),
                               body.finished_at)
    
    row = res.data[0]
    row["books"] = book
    return map_user_book_row(row)

@router.patch("/me/books/{book_id}", response_model=UserBookResponse)
async def update_my_book(
    book_id: str,
    body: UserBookUpdate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    # 1. Obtener datos para cálculos
    user_book_query = supabase.table("user_books").select("book_id, books(page_count)")\
        .eq("id", book_id).eq("user_id", user["id"]).execute()
    
    if not user_book_query.data:
        raise HTTPException(status_code=404, detail="No encontrado")
    
    book_data = user_book_query.data[0].get("books", {})
    page_count = book_data.get("page_count") if isinstance(book_data, dict) else None

    # 2. Sync progreso
    if body.current_page is not None and page_count:
        body.progress_percentage = min(round((body.current_page / page_count) * 100, 2), 100.0)
    elif body.progress_percentage is not None and page_count:
        body.current_page = int((body.progress_percentage / 100) * page_count)

    update_data = body.model_dump(exclude_none=True, mode='json')
    if not update_data:
        raise HTTPException(status_code=400, detail="Sin datos")
    
    res = supabase.table("user_books").update(update_data).eq("id", book_id).eq("user_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No encontrado")

    if "current_page" in update_data or "progress_percentage" in update_data:
        await log_book_progress(supabase, user["id"], book_id, 
                               update_data.get("current_page"), update_data.get("progress_percentage"),
                               body.finished_at)

    row = res.data[0]
    book_res = supabase.table("books").select("*").eq("id", row["book_id"]).execute()
    row["books"] = book_res.data[0] if book_res.data else {}
    return map_user_book_row(row)

@router.delete("/me/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_book(
    book_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    res = supabase.table("user_books").delete().eq("id", book_id).eq("user_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No encontrado")
    return None
