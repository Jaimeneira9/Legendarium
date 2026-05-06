import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.routers import auth, books, movies, series, habits, stats, finance
from app.limiter import limiter

app = FastAPI(
    title="Legendarium API",
    description="Backend para el seguimiento de libros, películas y hábitos.",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuración de CORS
origins = [
    "http://localhost:8081",    # Expo / Mobile Web
    "http://localhost:3000",    # Frontend web local
    "exp://127.0.0.1:8081",     # Expo Go local
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de rutas
app.include_router(auth.router)
app.include_router(books.router)
app.include_router(movies.router)
app.include_router(series.router)
app.include_router(habits.router)
app.include_router(stats.router)
app.include_router(finance.router)

@app.on_event("startup")
async def startup_event():
    """Lanzar el escáner de Gmail en segundo plano."""
    from app.services.finance_scanner import scan_gmail_forever
    import asyncio
    asyncio.create_task(scan_gmail_forever())


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
