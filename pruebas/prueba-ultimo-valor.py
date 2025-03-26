import os
import redis
from dotenv import load_dotenv

# Cargar variables desde el archivo .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Obtener las variables
redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_password = os.getenv("REDIS_PASSWORD")

redis_key = "proyecto:PEPI:Ernesto:almacen"
# Conexión a Redis
r = redis.Redis(
    host=redis_host,
    port=redis_port,
    password=redis_password,
    db=0,
    decode_responses=True  # para que devuelva strings en lugar de bytes
)

# Obtener el último valor
ultimo_valor = r.lindex(redis_key, -1)

# Mostrar primeros 20 caracteres
if ultimo_valor:
    print("Primeros 20 caracteres:", ultimo_valor[:20])
else:
    print("⚠️ La clave no tiene valores o no existe.")
