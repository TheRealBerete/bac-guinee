import difflib
import unicodedata

from app.database import get_db


def normalize(text: str) -> str:
    """Remove accents and lowercase for fuzzy comparison."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ASCII", "ignore").decode("ASCII")
    return text.lower().strip()


def is_pv_query(q: str) -> bool:
    """A PV is a string of 4 to 6 digits."""
    return q.isdigit() and 4 <= len(q) <= 6


def fuzzy_score(candidate_text: str, query_norm: str) -> float:
    """Score a candidate string against a normalized query (0-100)."""
    return difflib.SequenceMatcher(None, normalize(candidate_text), query_norm).ratio() * 100


def search_by_pv(query: str, session: int | None = None, profil: str | None = None,
                 examen: str | None = None, mention: str | None = None) -> list[dict]:
    db = get_db()
    params: list = [query]
    sql = "SELECT * FROM candidats WHERE pv = ?"
    if session is not None:
        sql += " AND session = ?"
        params.append(session)
    if profil:
        sql += " AND profil = ?"
        params.append(profil)
    if examen:
        sql += " AND examen = ?"
        params.append(examen)
    if mention:
        sql += " AND mention = ?"
        params.append(mention)
    sql += " LIMIT 100"
    rows = db.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def search_by_name(
    query: str,
    session: int | None = None,
    profil: str | None = None,
    examen: str | None = None,
    mention: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    Two-phase search:
    1. Pre-filter with SQL LIKE (narrows candidates)
    2. Score with difflib on the narrowed set
    """
    db = get_db()
    q_norm = normalize(query)
    like_pattern = f"%{query}%"

    params: list = [like_pattern, like_pattern]
    where_clauses = "(nom LIKE ? COLLATE NOCASE OR origine LIKE ? COLLATE NOCASE)"
    if session is not None:
        where_clauses += " AND session = ?"
        params.append(session)
    if profil:
        where_clauses += " AND profil = ?"
        params.append(profil)
    if examen:
        where_clauses += " AND examen = ?"
        params.append(examen)
    if mention:
        where_clauses += " AND mention = ?"
        params.append(mention)

    rows = db.execute(
        f"SELECT * FROM candidats WHERE {where_clauses} LIMIT 500",
        params,
    ).fetchall()

    candidates = [dict(r) for r in rows]

    if not candidates:
        return [], 0

    # Phase 2: Fuzzy scoring
    scored = []
    for c in candidates:
        name_score = fuzzy_score(c["nom_complet"] or c["nom"], q_norm)
        origin_score = fuzzy_score(c["origine"] or "", q_norm)
        score = max(name_score, origin_score)
        if score >= 50:
            scored.append((c, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    total = len(scored)
    results = [match[0] for match in scored[offset : offset + limit]]
    return results, total


def autodetect_search(
    query: str,
    session: int | None = None,
    profil: str | None = None,
    examen: str | None = None,
    mention: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[dict], int]:
    """Auto-detect query type: PV if numeric, otherwise name/school."""
    q = query.strip()

    if is_pv_query(q):
        results = search_by_pv(q, session, profil, examen, mention)
        return results, len(results)

    offset = (page - 1) * limit
    return search_by_name(q, session, profil, examen, mention, limit=limit, offset=offset)
