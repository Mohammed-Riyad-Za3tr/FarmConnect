from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .api.ai import router as ai_router
from .api.health import router as health_router
from .utils.logger import logger

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info(
        "ai-service.startup",
        env=settings.app_env,
        host=settings.host,
        port=settings.port,
    )
    yield

app = FastAPI(
    title="FarmConnect AI Service",
    description="AI/ML microservice: pricing suggestions, demand forecasting, chatbot support",
    version="0.0.1",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],  # Only the API can call this service
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Internal-Key"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
