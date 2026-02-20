import redis
from decouple import config

print("=== EXPLICIT REDIS TEST (no URL) ===")

host = config('REDIS_HOST')
port = config('REDIS_PORT', cast=int)
password = config('REDIS_PASSWORD')

print(f"Connecting to {host}:{port} ...")

try:
    r = redis.Redis(
        host=host,
        port=port,
        password=password,
        ssl=True,
        ssl_cert_reqs="required",
        socket_connect_timeout=10,
        socket_timeout=10,
    )
    result = r.ping()
    print("✅ SUCCESS! Redis ping returned:", result)
    print("You are fully connected to Azure Redis!")
except Exception as e:
    print("❌ FAILED:", type(e).__name__, "-", str(e))