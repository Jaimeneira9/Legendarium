"""
Schemas de autenticación — definen la forma de los datos
que entran (Request) y salen (Response) de los endpoints de auth.
"""
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """Datos para crear una cuenta nueva."""
    email: EmailStr
    password: str
    display_name: str | None = None


class LoginRequest(BaseModel):
    """Datos para iniciar sesión."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Respuesta con los tokens JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    """Petición para renovar un token expirado."""
    refresh_token: str


class UserResponse(BaseModel):
    """Datos públicos del usuario."""
    id: str
    email: str
    display_name: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    annual_reading_goal: int | None = 0
    annual_movie_goal: int | None = None


class ProfileUpdateRequest(BaseModel):
    """Datos para actualizar el perfil."""
    display_name: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    annual_reading_goal: int | None = None
    annual_movie_goal: int | None = None
