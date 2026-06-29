import httpx

from fastapi import APIRouter, Query

from app.database import get_db
from app.models import CandidateOut, SearchResponse
from app.search import autodetect_search, is_pv_query
from app.ukag import check_pv_session, insert_ukag_candidate, CODE_TO_API_PROFIL

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=100, description="Search query (name, school, or PV number)"),
    session: int | None = Query(None, ge=2020, le=2026),
    profil: str | None = Query(None, pattern=r"^(SS|SM|SE|SS-FA|SE-FA)$"),
    examen: str | None = Query(None, pattern=r"^(Bac|CEE|Brevet)$"),
    mention: str | None = Query(None, pattern=r"^(BIEN|ABIEN|PASSABLE|TB|EXCELLENT|TBIEN)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    results, total = autodetect_search(q, session=session, profil=profil, examen=examen, mention=mention, page=page, limit=limit)

    if total == 0 and is_pv_query(q):
        pv = q.strip()
        sessions_to_try = [session] if session else [2023, 2024, 2025, 2026]

        async with httpx.AsyncClient(timeout=15.0) as client:
            for sess in sessions_to_try:
                found = await check_pv_session(client, pv, sess)
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
                    break

    return SearchResponse(
        query=q,
        total=total,
        page=page,
        limit=limit,
        results=[CandidateOut.model_validate(r) for r in results],
    )
