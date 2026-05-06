from pydantic import BaseModel
from datetime import date

class SeriesSearchResult(BaseModel):
    tmdb_id: int
    title: str
    original_title: str | None = None
    poster_url: str | None = None
    overview: str | None = None
    release_date: str | None = None
    genres: list[str] = []
    vote_average: float | None = None

class UserSeriesCreate(BaseModel):
    tmdb_id: int
    status: str = "want_to_watch"
    rating: float | None = None
    current_season: int = 1
    current_episode: int = 0
    last_watched_at: date | None = None

class UserSeriesUpdate(BaseModel):
    status: str | None = None
    rating: float | None = None
    notes: str | None = None
    current_season: int | None = None
    current_episode: int | None = None
    last_watched_at: date | None = None

class UserSeriesResponse(BaseModel):
    id: str
    status: str
    rating: float | None = None
    notes: str | None = None
    current_season: int
    current_episode: int
    last_watched_at: date | None = None
    # Catálogo
    tmdb_id: int
    title: str
    poster_url: str | None = None
    release_date: str | None = None
    total_seasons: int
    total_episodes: int
    episode_run_time: int = 0
    seasons_data: list[dict] = []
