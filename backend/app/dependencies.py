from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.config import get_settings

security = HTTPBearer()

def get_supabase(settings=Depends(get_settings)) -> Client:
    """
    Crea un cliente de Supabase usando el service_role para tener
    permisos completos (bypass RLS cuando sea necesario).
    """
    return create_client(settings.supabase_url, settings.supabase_service_key)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase),
) -> dict:
    """
    Verifica el JWT del usuario y devuelve sus datos.
    """
    token = credentials.credentials

    try:
        # Usamos el cliente de supabase para verificar el token
        user_response = supabase.auth.get_user(token)
        user = user_response.user

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
            )

        return {
            "id": user.id,
            "email": user.email,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"AUTH ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo verificar el token",
        )
