import asyncio

import httpx

from fastapi import APIRouter, HTTPException, Query, Request

from app.database import get_db
from app.models import CandidateOut, SearchResponse
from app.rate_limit import limiter
from app.search import autodetect_search, is_pv_query
from app.ukag import check_pv_session, insert_ukag_candidate, CODE_TO_API_PROFIL

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponse)
@limiter.limit("30/minute")
async def search(
    request: Request,
    q: str = Query("", max_length=100, description="Search query (name, school, or PV number). Leave empty to browse by filters only (requires at least one filter)."),
    session: int | None = Query(None, ge=2020, le=2026),
    profil: str | None = Query(None, pattern=r"^(SS|SM|SE|SS-FA|SE-FA|GENERAL)$"),
    examen: str | None = Query(None, pattern=r"^(BAC|BEPC|CEE)$"),
    mention: str | None = Query(None, pattern=r"^(BIEN|ABIEN|PASSABLE|TB|EXCELLENT|TBIEN)$"),
    origine: str | None = Query(None, max_length=100, description="École/établissement d'origine (recherche partielle)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    if not q.strip() and not any([session, profil, examen, mention, origine]):
        raise HTTPException(status_code=400, detail="Fournissez une recherche (q) ou au moins un filtre (session, profil, examen, mention, origine).")

    results, total = autodetect_search(q, session=session, profil=profil, examen=examen, mention=mention, origine=origine, page=page, limit=limit)

    if total == 0 and is_pv_query(q):
        pv = q.strip()
        sessions_to_try = [session] if session else [2023, 2024, 2025, 2026]

        # Sessions and profiles are all tried in parallel (concurrent=True) so a
        # miss costs one round-trip (~6s worst case) instead of piling up to
        # 12 sequential 15s timeouts if the ukag API is slow or down.
        async with httpx.AsyncClient(timeout=6.0) as client:
            checks = await asyncio.gather(
                *(check_pv_session(client, pv, sess, concurrent=True) for sess in sessions_to_try)
            )
        found = next((c for c in checks if c), None)

        if found:
            insert_ukag_candidate(
                pv=found["pv"],
                session=found["session"],
                profil=found["profil"],
                profil_nom=found["profil_nom"],
                nom=found["nom"],
                prenom=found["prenom"],
                lycee=found["lycee"],
            )
            db = get_db()
            row = db.execute(
                "SELECT * FROM candidats WHERE pv = ? AND session = ? AND profil = ?",
                (found["pv"], found["session"], found["profil"]),
            ).fetchone()
            if row:
                results = [dict(row)]
                total = 1

    return SearchResponse(
        query=q,
        total=total,
        page=page,
        limit=limit,
        results=[CandidateOut.model_validate(r) for r in results],
    )
