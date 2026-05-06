"""
Router de películas — búsqueda en TMDB y CRUD de la colección.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client
import logging

from app.dependencies import get_supabase, get_current_user
from app.config import get_settings, Settings
from app.services.tmdb import search_movies, get_movie_details, search_multi
from app.schemas.movies import (
    MovieSearchResult, UserMovieCreate, UserMovieUpdate, UserMovieResponse,
)
from app.services.movies_service import map_user_movie_row, ensure_movie_in_catalog

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Movies"])

@router.get("/movies/search-multi", response_model=list[MovieSearchResult])
async def search_combined(
    q: str = Query(..., description="Texto a buscar"),
    user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    return await search_multi(q, settings.tmdb_api_key)

@router.get("/movies/search", response_model=list[MovieSearchResult])
async def search(
    q: str = Query(..., description="Texto a buscar"),
    year: int | None = Query(None, description="Filtrar por año de estreno"),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    try:
        # 1. Buscar en nuestra DB
        local_results = supabase.table("movies")\
            .select("*")\
            .ilike("title", f"%{q}%")\
            .limit(10)\
            .execute()
        
        movies_list = []
        seen_ids = set()

        for m in local_results.data:
            seen_ids.add(m["tmdb_id"])
            movies_list.append(MovieSearchResult(
                tmdb_id=m["tmdb_id"],
                title=m["title"],
                original_title=m.get("original_title"),
                poster_url=m.get("poster_url"),
                backdrop_url=m.get("backdrop_url"),
                overview=m.get("overview"),
                release_date=str(m["release_date"]) if m.get("release_date") else None,
                genres=m.get("genres", []),
                vote_average=m.get("vote_average", 0),
                runtime=m.get("runtime") or 0
            ))

        # 2. Buscar en TMDB (usa cache)
        api_results = await search_movies(supabase, q, settings.tmdb_api_key, year=year)
        for m in api_results:
            if m.tmdb_id not in seen_ids:
                movies_list.append(m)

        return movies_list[:20]
    except Exception as e:
        logger.error(f"Error in hybrid movie search: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="Error en el servicio de búsqueda")

@router.get("/movies/{tmdb_id}", response_model=MovieSearchResult)
async def get_movie(
    tmdb_id: int,
    user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    result = await get_movie_details(tmdb_id, settings.tmdb_api_key)
    if result is None:
        raise HTTPException(status_code=404, detail="Película no encontrada")
    return result

@router.get("/me/movies", response_model=list[UserMovieResponse])
async def list_my_movies(
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    query = supabase.table("user_movies").select("*, movies(*)").eq("user_id", user["id"])
    if status_filter:
        query = query.eq("status", status_filter)
    result = query.order("updated_at", desc=True).order("id").limit(limit).offset(offset).execute()

    mapped_data = []
    for row in result.data:
        m = row.get("movies")
        if m and m.get("runtime") == 0:
            try:
                details = await get_movie_details(m["tmdb_id"], settings.tmdb_api_key)
                if details and details.runtime > 0:
                    supabase.table("movies").update({"runtime": details.runtime}).eq("id", m["id"]).execute()
                    row["movies"]["runtime"] = details.runtime
            except Exception as e:
                logger.error(f"Error repairing runtime: {e}")
        mapped_data.append(map_user_movie_row(row))
    return mapped_data

@router.post("/me/movies", response_model=UserMovieResponse, status_code=201)
async def add_movie(
    body: UserMovieCreate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    movie = await ensure_movie_in_catalog(supabase, body.tmdb_id)
    dup = supabase.table("user_movies").select("*").eq("user_id", user["id"]).eq("movie_id", movie["id"]).execute()
    if dup.data:
        update_data = body.model_dump(exclude={"tmdb_id"}, mode='json', exclude_none=True)
        row = supabase.table("user_movies").update(update_data).eq("id", dup.data[0]["id"]).execute().data[0]
        row["movies"] = movie
        return map_user_movie_row(row)

    insert_data = {
        "user_id": user["id"],
        "movie_id": movie["id"],
        **body.model_dump(exclude={"tmdb_id"}, mode='json')
    }
    row = supabase.table("user_movies").insert(insert_data).execute().data[0]
    row["movies"] = movie
    return map_user_movie_row(row)

@router.patch("/me/movies/{movie_id}", response_model=UserMovieResponse)
async def update_my_movie(
    movie_id: str, body: UserMovieUpdate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    data = body.model_dump(exclude_none=True, mode='json')
    if not data:
        raise HTTPException(status_code=400, detail="Nada que actualizar")
    result = supabase.table("user_movies").update(data).eq("id", movie_id).eq("user_id", user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No encontrada")
    row = result.data[0]
    m = supabase.table("movies").select("*").eq("id", row["movie_id"]).execute().data[0]
    row["movies"] = m
    return map_user_movie_row(row)

@router.delete("/me/movies/{movie_id}", status_code=204)
async def delete_my_movie(
    movie_id: str,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    result = supabase.table("user_movies").delete().eq("id", movie_id).eq("user_id", user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No encontrada")
    return None
