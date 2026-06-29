import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.database import init_db, seed_database, table_exists, row_count
from app.routers import search, candidate, stats


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
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
