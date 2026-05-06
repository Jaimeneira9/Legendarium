from slowapi import Limiter
from slowapi.util import get_remote_address

# Definición única del limitador para ser compartido entre módulos
limiter = Limiter(key_func=get_remote_address)
