import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.database import init_db, seed_database, table_exists, row_count
from app.rate_limit import limiter
from app.routers import search, candidate, stats

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("bac_api")


class CacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method == "GET" and response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=86400"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if not table_exists() or row_count() == 0:
        seed_database()
    yield


app = FastAPI(
    title="Bac Guinée API",
    description="API de consultation des résultats du Baccalauréat guinéen",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"error": "Erreur interne du serveur"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CacheMiddleware)

app.include_router(search.router, prefix="/api")
app.include_router(candidate.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "candidats": row_count()}
