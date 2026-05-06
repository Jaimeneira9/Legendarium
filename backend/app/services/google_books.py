import asyncio
import re
import httpx

from supabase import Client
from app.schemas.books import BookSearchResult
from app.config import get_settings

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
GOOGLE_COVER_URL = "https://books.google.com/books/content"
_RETRY_DELAYS = {503: [1, 2], 429: [5, 15]}

# Campos mínimos necesarios — reduce el payload ~60%
_FIELDS = (
    "items(id,volumeInfo("
    "title,authors,publishedDate,imageLinks,"
    "description,categories,pageCount,industryIdentifiers,language"
    "))"
)


async def _get_with_retry(client: httpx.AsyncClient, url: str, params: dict) -> httpx.Response:
    response = await client.get(url, params=params)
    delays = _RETRY_DELAYS.get(response.status_code)
    if not delays:
        return response
    for delay in delays:
        await asyncio.sleep(delay)
        response = await client.get(url, params=params)
        if response.status_code not in _RETRY_DELAYS:
            return response
    return response


def _is_isbn(text: str) -> bool:
    """Detecta si el texto parece un ISBN-10 o ISBN-13."""
    cleaned = re.sub(r'[-\s]', '', text)
    return bool(re.match(r'^\d{10}(\d{3})?$', cleaned))


def _build_query(query: str, author: str | None = None) -> str:
    """
    Construye una query inteligente para Google Books API.
    - ISBN detectado → isbn:XXXXX
    - Con autor → intitle:query+inauthor:autor
    - Sin autor → query tal cual (Google decide la relevancia)
    """
    q = query.strip()

    if _is_isbn(q):
        return f"isbn:{re.sub(r'[-s]', '', q)}"

    if author:
        return f"intitle:{q}+inauthor:{author.strip()}"

    return q


def _best_cover(image_links: dict, google_books_id: str = "") -> str:
    """Obtiene la mejor portada disponible con fallbacks."""
    # 1. Intentar imageLinks de la API (mejor calidad)
    for size in ("extraLarge", "large", "medium", "thumbnail", "smallThumbnail"):
        url = image_links.get(size, "")
        if url:
            # Solo corregir protocolo, NO reducir zoom
            return url.replace("http://", "https://")

    # 2. Fallback: URL directa de Google Books (funciona ~95%)
    if google_books_id:
        return (
            f"{GOOGLE_COVER_URL}?id={google_books_id}"
            "&printsec=frontcover&img=1&zoom=1&source=gbs_api"
        )

    return ""


def _extract_isbn(info: dict) -> str | None:
    identifiers = info.get("industryIdentifiers", [])
    for id_type in ("ISBN_13", "ISBN_10"):
        match = next((i["identifier"] for i in identifiers if i["type"] == id_type), None)
        if match:
            return match
    return None


_SPAM_PATTERNS = [
    "summary of", "resumen de", "análisis de",
    "study guide", "workbook for", "cuaderno de",
]


def _is_quality_result(info: dict) -> bool:
    """Filtra resultados de baja calidad (resúmenes, guías, sin título)."""
    if "title" not in info:
        return False

    title_lower = info["title"].lower()
    return not any(p in title_lower for p in _SPAM_PATTERNS)


async def search_books(
    supabase: Client,
    query: str,
    max_results: int = 20,
    lang: str | None = "es",
    author: str | None = None,
) -> list[BookSearchResult]:
    from app.services.api_cache_service import get_cached_response, set_cached_response
    
    # 1. Intentar cache
    query_key = f"search:{query}:{lang}:{author or 'none'}"
    cached = await get_cached_response(supabase, "google_books", query_key)
    if cached:
        return [BookSearchResult(**b) for b in cached]

    # 2. Llamada real
    api_key = get_settings().google_books_api_key

    search_query = _build_query(query, author)

    params = {
        "q": search_query,
        "maxResults": max_results,
        "orderBy": "relevance",
        "printType": "books",
        "fields": _FIELDS,
        **({"key": api_key} if api_key else {}),
    }

    # Restricción de idioma (None o "all" = sin restricción)
    if lang and lang != "all":
        params["langRestrict"] = lang

    async with httpx.AsyncClient(timeout=15) as client:
        response = await _get_with_retry(client, GOOGLE_BOOKS_URL, params)
        response.raise_for_status()
        data = response.json()

    results = []

    for item in data.get("items", []):
        info = item.get("volumeInfo", {})

        if not _is_quality_result(info):
            continue

        raw_date = info.get("publishedDate", "0000")
        published_year = str(raw_date)[:4] if raw_date else "0000"

        google_id = item.get("id", "")
        cover = _best_cover(info.get("imageLinks", {}), google_id)

        # Fallback final: Open Library por ISBN
        if not cover:
            isbn = _extract_isbn(info)
            if isbn:
                cover = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"

        book = BookSearchResult(
            google_books_id=google_id,
            title=info["title"],
            authors=info.get("authors", ["Desconocido"]),
            published_date=published_year,
            cover_url=cover or None,
            description=info.get("description", ""),
            categories=info.get("categories", []),
            page_count=info.get("pageCount", 0),
            isbn=_extract_isbn(info),
        )
        results.append(book)

    # 3. Guardar en cache antes de devolver
    serialized_results = [b.model_dump() for b in results]
    await set_cached_response(supabase, "google_books", query_key, serialized_results)

    return results


async def get_book_details(google_books_id: str) -> BookSearchResult | None:
    url = f"{GOOGLE_BOOKS_URL}/{google_books_id}"

    api_key = get_settings().google_books_api_key
    params = {"key": api_key} if api_key else {}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return None
        data = response.json()

    info = data.get("volumeInfo", {})

    raw_date = info.get("publishedDate", "0000")
    published_year = str(raw_date)[:4] if raw_date else "0000"

    cover = _best_cover(info.get("imageLinks", {}), google_books_id)

    if not cover:
        isbn = _extract_isbn(info)
        if isbn:
            cover = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"

    return BookSearchResult(
        google_books_id=data.get("id", google_books_id),
        title=info.get("title", "Sin título"),
        authors=info.get("authors", ["Desconocido"]),
        published_date=published_year,
        cover_url=cover or None,
        description=info.get("description", ""),
        categories=info.get("categories", []),
        page_count=info.get("pageCount", 0),
        isbn=_extract_isbn(info),
    )
