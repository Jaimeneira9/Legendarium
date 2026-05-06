"""
Configuración del backend — carga variables de entorno con validación.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_key: str

    # APIs externas
    tmdb_api_key: str
    google_books_api_key: str = ""
    
    # Gmail Scanner
    gmail_user: str = ""
    gmail_app_password: str = ""
    owner_email: str = ""
    bank_notification_email: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Devuelve la configuración cacheada.
    lru_cache hace que solo se lea el .env una vez,
    no en cada petición HTTP.
    """
    return Settings()
