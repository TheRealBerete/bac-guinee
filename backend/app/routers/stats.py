from fastapi import APIRouter, HTTPException

from app.database import get_db

router = APIRouter(tags=["stats"])


@router.get("/stats")
def global_stats():
    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM candidats").fetchone()[0]

    sessions = db.execute(
        "SELECT session, COUNT(*) as cnt FROM candidats GROUP BY session ORDER BY session"
    ).fetchall()

    profils = db.execute(
        "SELECT profil, profil_nom, COUNT(*) as cnt FROM candidats GROUP BY profil ORDER BY cnt DESC"
    ).fetchall()

    top_lycees = db.execute(
        """
        SELECT origine, COUNT(*) as cnt
        FROM candidats
        WHERE origine != '' AND origine IS NOT NULL
        GROUP BY origine
        ORDER BY cnt DESC
        LIMIT 10
        """
    ).fetchall()

    return {
        "total_candidats": total,
        "sessions": [
            {"session": r["session"], "count": r["cnt"]} for r in sessions
        ],
        "profils": [
            {"code": r["profil"], "nom": r["profil_nom"], "count": r["cnt"]}
            for r in profils
        ],
        "top_lycees": [
            {"nom": r["origine"], "count": r["cnt"]} for r in top_lycees
        ],
    }


@router.get("/stats/lycees")
def top_lycees(limit: int = 50):
    db = get_db()
    rows = db.execute(
        """
        SELECT origine, COUNT(*) as cnt
        FROM candidats
        WHERE origine != '' AND origine IS NOT NULL
        GROUP BY origine
        ORDER BY cnt DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return {"lycees": [{"nom": r["origine"], "count": r["cnt"]} for r in rows]}


@router.get("/lycee/{nom}")
def lycee_stats(nom: str, page: int = 1, limit: int = 20):
    db = get_db()

    total = db.execute(
        "SELECT COUNT(*) FROM candidats WHERE origine = ?", (nom,)
    ).fetchone()[0]

    if total == 0:
        raise HTTPException(status_code=404, detail="Lycée non trouvé")

    by_session = db.execute(
        """
        SELECT session, COUNT(*) as cnt
        FROM candidats
        WHERE origine = ?
        GROUP BY session
        ORDER BY session
        """,
        (nom,),
    ).fetchall()

    by_mention = db.execute(
        """
        SELECT mention, COUNT(*) as cnt
        FROM candidats
        WHERE origine = ? AND mention != ''
        GROUP BY mention
        ORDER BY cnt DESC
        """,
        (nom,),
    ).fetchall()

    offset = (page - 1) * limit
    candidats = db.execute(
        """
        SELECT id, nom_complet, pv, rang, mention, session, profil, profil_nom, source
        FROM candidats
        WHERE origine = ?
        ORDER BY session DESC, rang ASC
        LIMIT ? OFFSET ?
        """,
        (nom, limit, offset),
    ).fetchall()

    return {
        "lycee": nom,
        "total_admis": total,
        "page": page,
        "limit": limit,
        "par_session": [
            {"session": r["session"], "count": r["cnt"]} for r in by_session
        ],
        "par_mention": [
            {"mention": r["mention"], "count": r["cnt"]} for r in by_mention
        ],
        "candidats": [dict(r) for r in candidats],
    }


@router.get("/sessions")
def sessions():
    db = get_db()
    rows = db.execute(
        "SELECT session, COUNT(*) as cnt FROM candidats GROUP BY session ORDER BY session"
    ).fetchall()
    return {"sessions": [{"session": r["session"], "count": r["cnt"]} for r in rows]}


@router.get("/profils")
def profils():
    db = get_db()
    rows = db.execute(
        "SELECT profil, profil_nom, COUNT(*) as cnt FROM candidats GROUP BY profil ORDER BY cnt DESC"
    ).fetchall()
    return {
        "profils": [
            {"code": r["profil"], "nom": r["profil_nom"], "count": r["cnt"]}
            for r in rows
        ]
    }
