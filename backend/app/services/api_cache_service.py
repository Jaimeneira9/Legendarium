import logging
import json
from datetime import datetime, timedelta, timezone
from supabase import Client
from typing import Any, Optional

logger = logging.getLogger(__name__)

async def get_cached_response(
    supabase: Client, 
    service: str, 
    query_key: str
) -> Optional[Any]:
    """Busca una respuesta en el cache de la DB."""
    try:
        now = datetime.now(timezone.utc).isoformat()
        res = supabase.table("api_cache")\
            .select("response_json")\
            .eq("service", service)\
            .eq("query_key", query_key)\
            .gt("expires_at", now)\
            .execute()
        
        if res.data:
            return res.data[0]["response_json"]
    except Exception as e:
        # Fallback silencioso si la tabla no existe o falla
        logger.debug(f"Cache miss or table missing for {service}:{query_key}: {e}")
    return None

async def set_cached_response(
    supabase: Client, 
    service: str, 
    query_key: str, 
    response_data: Any, 
    expire_days: int = 7
):
    """Guarda una respuesta en el cache de la DB."""
    try:
        expires_at = (datetime.now(timezone.utc) + timedelta(days=expire_days)).isoformat()
        supabase.table("api_cache").upsert({
            "service": service,
            "query_key": query_key,
            "response_json": response_data,
            "expires_at": expires_at
        }, on_conflict="service,query_key").execute()
    except Exception as e:
        logger.warning(f"Failed to set cache for {service}:{query_key}: {e}")
