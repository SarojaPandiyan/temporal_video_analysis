from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from backend.routers.auth import limiter, router
from backend.db import client, refresh_tokens_collection
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await refresh_tokens_collection.create_index("expires_at", expireAfterSeconds=0)  # TTL index
    yield
    # Shutdown
    client.close()

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(router)

@app.get("/")
def root():
    return {"message": "InsightSphere Backend Running"}