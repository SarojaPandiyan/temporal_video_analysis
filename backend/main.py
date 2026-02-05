from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from backend.routers.auth import limiter, router
from backend.db import client, refresh_tokens_collection

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

@asynccontextmanager
async def lifespan(app: FastAPI):
    await refresh_tokens_collection.create_index(
        "expires_at", expireAfterSeconds=0
    )
    yield
    client.close()

app = FastAPI(lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# API routers
app.include_router(router, prefix="/api")

# ---------------- Frontend ----------------

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

# Serve Vite assets
app.mount(
    "/assets",
    StaticFiles(directory=FRONTEND_DIST / "assets"),
    name="assets",
)

# Health check
@app.get("/api")
def root():
    return {"message": "InsightSphere Backend Running"}

# React entry point (catch-all EXCEPT /api)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api"):
        return {"detail": "Not Found"}
    return FileResponse(FRONTEND_DIST / "index.html")
