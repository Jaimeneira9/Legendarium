"""
Router de autenticación — registro, login, refresh y perfil.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from supabase import Client

from app.dependencies import get_supabase, get_current_user
from app.limiter import limiter
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    ProfileUpdateRequest,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
@limiter.limit("3/hour")
async def register(request: Request, body: RegisterRequest, supabase: Client = Depends(get_supabase)):
    """
    Crea una cuenta nueva.

    1. Registra al usuario en Supabase Auth
    2. Crea un perfil en la tabla profiles
    3. Devuelve los tokens JWT para que la app pueda usarlos inmediatamente
    """
    try:
        # Registrar en Supabase Auth
        auth_response = supabase.auth.sign_up(
            {"email": body.email, "password": body.password}
        )

        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo crear la cuenta",
            )

        # Crear perfil en nuestra tabla
        supabase.table("profiles").insert(
            {
                "id": auth_response.user.id,
                "display_name": body.display_name or body.email.split("@")[0],
            }
        ).execute()

        session = auth_response.session
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cuenta creada pero no se pudo iniciar sesión. Verifica tu email.",
            )

        return TokenResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            expires_in=session.expires_in,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar: {str(e)}",
        )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, supabase: Client = Depends(get_supabase)):
    """
    Inicia sesión y devuelve los tokens JWT.
    """
    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )

        session = auth_response.session
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
            )

        return TokenResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            expires_in=session.expires_in,
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, supabase: Client = Depends(get_supabase)):
    """
    Renueva un token expirado usando el refresh_token.
    Los access_token duran ~1 hora; el refresh_token permite
    obtener uno nuevo sin que el usuario vuelva a hacer login.
    """
    try:
        auth_response = supabase.auth.refresh_session(body.refresh_token)

        session = auth_response.session
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado",
            )

        return TokenResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            expires_in=session.expires_in,
        )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo renovar el token",
        )


@router.get("/me", response_model=UserResponse)
async def get_me(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """
    Devuelve el perfil del usuario autenticado.
    """
    result = (
        supabase.table("profiles").select("*").eq("id", user["id"]).execute()
    )

    profile = result.data[0] if result.data else {}

    return UserResponse(
        id=user["id"],
        email=user["email"],
        display_name=profile.get("display_name"),
        username=profile.get("username"),
        avatar_url=profile.get("avatar_url"),
        bio=profile.get("bio"),
        annual_reading_goal=profile.get("annual_reading_goal"),
        annual_movie_goal=profile.get("annual_movie_goal"),
    )


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: ProfileUpdateRequest,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    """
    Actualiza el perfil del usuario autenticado.
    """
    update_data = body.model_dump(exclude_none=True, mode='json')

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay datos para actualizar",
        )

    result = (
        supabase.table("profiles")
        .update(update_data)
        .eq("id", user["id"])
        .execute()
    )

    profile = result.data[0] if result.data else {}

    return UserResponse(
        id=user["id"],
        email=user["email"],
        display_name=profile.get("display_name"),
        username=profile.get("username"),
        avatar_url=profile.get("avatar_url"),
        bio=profile.get("bio"),
        annual_reading_goal=profile.get("annual_reading_goal"),
        annual_movie_goal=profile.get("annual_movie_goal"),
    )
