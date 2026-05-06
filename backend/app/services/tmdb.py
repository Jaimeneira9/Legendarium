"""
Servicio de TMDB — versión mejorada con resolución alta de pósters,
filtros de año/director, y detección de anime.
Documentación: https://developer.themoviedb.org/docs
"""
import asyncio
import httpx

from supabase import Client
from app.schemas.movies import MovieSearchResult

TMDB_BASE_URL = "https://api.themoviedb.org/3"
# Alta resolución — w780 en lugar de w500
TMDB_IMAGE_BASE_HD = "https://image.tmdb.org/t/p/w780"
TMDB_IMAGE_BASE_ORIGINAL = "https://image.tmdb.org/t/p/original"

# Genre IDs relevantes
ANIME_GENRE_ID = 16  # Animation — aproximación para detectar anime


def _build_poster_url(poster_path: str | None, original: bool = False) -> str | None:
    if not poster_path:
        return None
    base = TMDB_IMAGE_BASE_ORIGINAL if original else TMDB_IMAGE_BASE_HD
    return f"{base}{poster_path}"


def _map_movie(item: dict) -> MovieSearchResult:
    return MovieSearchResult(
        tmdb_id=item["id"],
        title=item.get("title", "Sin título"),
        original_title=item.get("original_title"),
        poster_url=_build_poster_url(item.get("poster_path")),
        overview=item.get("overview"),
        release_date=item.get("release_date"),
        genres=[],
        vote_average=item.get("vote_average"),
    )


def _map_tv(item: dict) -> MovieSearchResult:
    return MovieSearchResult(
        tmdb_id=item["id"],
        title=item.get("name", "Sin título"),
        original_title=item.get("original_name"),
        poster_url=_build_poster_url(item.get("poster_path")),
        overview=item.get("overview"),
        release_date=item.get("first_air_date"),
        genres=[],
        vote_average=item.get("vote_average"),
    )


async def search_movies(
    supabase: Client,
    query: str,
    api_key: str,
    max_results: int = 20,
    year: int | None = None,
) -> list[MovieSearchResult]:
    """Busca películas en TMDB con filtro opcional de año."""
    from app.services.api_cache_service import get_cached_response, set_cached_response
    
    query_key = f"movie:{query}:{year or 'none'}"
    cached = await get_cached_response(supabase, "tmdb_movie", query_key)
    if cached:
        return [MovieSearchResult(**m) for m in cached]
    params: dict = {
        "api_key": api_key,
        "query": query,
        "language": "es-ES",
        "page": 1,
        "include_adult": False,
    }
    if year:
        params["year"] = year

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{TMDB_BASE_URL}/search/movie", params=params)
        response.raise_for_status()
        data = response.json()

    results = [_map_movie(item) for item in data.get("results", [])[:max_results]]
    results = sorted(results, key=lambda r: 0 if r.poster_url else 1)
    
    serialized = [m.model_dump() for m in results]
    await set_cached_response(supabase, "tmdb_movie", query_key, serialized)
    
    return results


async def search_tv(
    supabase: Client,
    query: str,
    api_key: str,
    max_results: int = 20,
    year: int | None = None,
    anime_only: bool = False,
) -> list[MovieSearchResult]:
    """Busca series/anime en TMDB con filtro de año y tipo."""
    from app.services.api_cache_service import get_cached_response, set_cached_response
    
    query_key = f"tv:{query}:{year or 'none'}:{anime_only}"
    cached = await get_cached_response(supabase, "tmdb_tv", query_key)
    if cached:
        return [MovieSearchResult(**m) for m in cached]
    params: dict = {
        "api_key": api_key,
        "query": query,
        "language": "es-ES",
        "page": 1,
        "include_adult": False,
    }
    if year:
        params["first_air_date_year"] = year

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{TMDB_BASE_URL}/search/tv", params=params)
        response.raise_for_status()
        data = response.json()

    items = data.get("results", [])

    # Filtrar por anime si se solicita (genre_id 16 = Animation)
    if anime_only:
        items = [i for i in items if ANIME_GENRE_ID in i.get("genre_ids", [])]

    results = [_map_tv(item) for item in items[:max_results]]
    results = sorted(results, key=lambda r: 0 if r.poster_url else 1)
    
    serialized = [m.model_dump() for m in results]
    await set_cached_response(supabase, "tmdb_tv", query_key, serialized)
    
    return results


async def search_multi(
    query: str,
    api_key: str,
    max_results: int = 20,
) -> list[MovieSearchResult]:
    """Busca películas y series simultáneamente."""
    params: dict = {
        "api_key": api_key,
        "query": query,
        "language": "es-ES",
        "page": 1,
        "include_adult": False,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{TMDB_BASE_URL}/search/multi", params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("results", []):
        if item["media_type"] == "movie":
            results.append(_map_movie(item))
        elif item["media_type"] == "tv":
            results.append(_map_tv(item))
    
    return results[:max_results]


async def get_movie_details(tmdb_id: int, api_key: str) -> MovieSearchResult | None:
    """Obtiene detalles completos de una película con póster en alta resolución."""
    params = {"api_key": api_key, "language": "es-ES"}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{TMDB_BASE_URL}/movie/{tmdb_id}", params=params)
        if response.status_code != 200:
            return None
        data = response.json()

    return MovieSearchResult(
        tmdb_id=data["id"],
        title=data.get("title", "Sin título"),
        original_title=data.get("original_title"),
        # Póster original en detalles para mayor calidad
        poster_url=_build_poster_url(data.get("poster_path"), original=True),
        overview=data.get("overview"),
        release_date=data.get("release_date"),
        genres=[g["name"] for g in data.get("genres", [])],
        vote_average=data.get("vote_average"),
        runtime=data.get("runtime", 0),
    )


async def get_tv_details(tmdb_id: int, api_key: str) -> dict | None:
    """Obtiene los detalles completos de una serie, incluyendo temporadas."""
    params = {"api_key": api_key, "language": "es-ES"}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{TMDB_BASE_URL}/tv/{tmdb_id}", params=params)
        if response.status_code != 200:
            return None
        data = response.json()

    return {
        "tmdb_id": data["id"],
        "title": data.get("name", "Sin título"),
        "original_title": data.get("original_name"),
        # Póster original en detalles
        "poster_url": _build_poster_url(data.get("poster_path"), original=True),
        "overview": data.get("overview"),
        "release_date": data.get("first_air_date"),
        "genres": [g["name"] for g in data.get("genres", [])],
        "vote_average": data.get("vote_average"),
        "total_seasons": data.get("number_of_seasons", 1),
        "total_episodes": data.get("number_of_episodes", 1),
        "episode_run_time": data.get("episode_run_time", [0])[0] if data.get("episode_run_time") else 0,
        "seasons_data": [
            {
                "season_number": s["season_number"],
                "episode_count": s["episode_count"]
            }
            for s in data.get("seasons", [])
            if s["season_number"] > 0
        ]
    }
