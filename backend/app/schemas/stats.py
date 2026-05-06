from pydantic import BaseModel
from datetime import date, datetime
from typing import Any, Optional


class GenreCount(BaseModel):
    genre: str
    count: int


class GenreStats(BaseModel):
    books: list[GenreCount]
    movies: list[GenreCount]

class UserStatsSummary(BaseModel):
    books_read: int
    books_reading: int
    movies_watched: int
    movies_watchlist: int
    avg_book_rating: float | None = None
    avg_movie_rating: float | None = None
    series_watched: int = 0
    total_series_minutes: int = 0


class MonthlyItem(BaseModel):
    title: str
    cover_url: str | None = None
    rating: float | None = None
    date: str  # ISO date string
    format: str | None = None


class MonthlyData(BaseModel):
    month: int  # 1-12
    count: int
    physical_count: int = 0
    electronic_count: int = 0
    items: list[MonthlyItem]

class ActivityEvent(BaseModel):
    id: str
    type: str  # book_finished, movie_watched, reading_progress, finance_transaction, series_progress
    title: str
    detail: str
    timestamp: str
    image_url: str | None = None
    minutes_spent: int | None = None

class ReadingProgressPoint(BaseModel):
    date: date
    total_pages: int
    details: list[dict[str, Any]]  # [{book_title, pages, cover_url}]

class HabitCalendarDay(BaseModel):
    date: date
    count: int
    target_count: int
    habits: list[dict[str, Any]]  # [{name, icon, image_url}]

class HabitAchievement(BaseModel):
    level: str
    days: int

class FinanceAnalysis(BaseModel):
    category: str
    amount: float
    percentage: float
    color: str = "#94a3b8"
    alert: str | None = None

class SeriesTimeBreakdown(BaseModel):
    title: str
    poster_url: str | None = None
    minutes_spent: int

class MonthlyReport(BaseModel):
    year: int
    month: int
    income: float
    expenses: float
    balance: float
    finance_breakdown: list[FinanceAnalysis]
    
    books_finished: int
    pages_read: int
    reading_time_minutes: int
    
    movies_watched: int
    movies_time_minutes: int
    
    episodes_watched: int
    series_time_minutes: int
    
    total_enjoyment_minutes: int
    habit_achievements: list[HabitAchievement]

class DashboardStats(BaseModel):
    summary: UserStatsSummary
    activity: list[ActivityEvent]
    progress: list[ReadingProgressPoint]


class LegendTitle(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    unlocked: bool = False
    progress: float = 0.0  # 0.0 - 1.0


class LegendProfile(BaseModel):
    active_title: LegendTitle | None = None
    unlocked_titles: list[LegendTitle] = []
    next_title: LegendTitle | None = None


class MonthlyHighlightBook(BaseModel):
    title: str
    cover_url: str | None = None
    rating: float | None = None
    authors: list[str] = []


class MonthlyHighlightMovie(BaseModel):
    title: str
    poster_url: str | None = None
    rating: float | None = None


class MonthlyHighlightHabit(BaseModel):
    name: str
    icon: str | None = None
    streak: int = 0


class MonthlyHighlight(BaseModel):
    year: int
    month: int
    best_book: MonthlyHighlightBook | None = None
    best_movie: MonthlyHighlightMovie | None = None
    top_habit: MonthlyHighlightHabit | None = None
    pages_read: int = 0
    books_finished: int = 0
    movies_watched: int = 0
    episodes_watched: int = 0
    reading_time_estimate: str = "0 min"
