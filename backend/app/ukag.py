import asyncio

import httpx

from app.database import ukag_check_exists, save_ukag_check, insert_ukag_candidate

UKAG_URL = "https://mon-portail.gtsco-kag.org/public/verificationResultatBac"

CODE_TO_API_PROFIL = {
    "SS": "Sciences Sociales",
    "SM": "Math\u00e9matiques",
    "SE": "Exp\u00e9rimentales",
}

API_PROFIL_TO_CODE = {v: k for k, v in CODE_TO_API_PROFIL.items()}

ALL_PROFILES = ["SS", "SM", "SE"]


async def check_one(client: httpx.AsyncClient, pv: str, session: int, profil: str, timeout: float = 15.0) -> dict:
    """
    Call the ukag API for a single (pv, session, profil) combo.
    Returns: {status, nom, prenom, lycee, lycee_id, error_msg}
    """
    profil_api = CODE_TO_API_PROFIL[profil]
    data = {"pv": pv, "profil": profil_api, "session": str(session)}

    try:
        resp = await client.post(UKAG_URL, data=data, timeout=timeout)
        resp.raise_for_status()
        body = resp.json()
    except Exception as e:
        return {"status": "error", "error_msg": str(e)}

    if body.get("error") is False:
        r = body.get("resultat", {})
        return {
            "status": "success",
            "nom": r.get("nom", ""),
            "prenom": r.get("prenom", ""),
            "lycee": r.get("lycee", ""),
            "lycee_id": r.get("lyceeId"),
        }
    else:
        return {"status": "not_admitted", "error_msg": body.get("msg", "")}


def _cache_hit(pv: str, session: int, profil: str) -> dict:
    cached = ukag_check_exists(pv, session, profil)
    return {
        "pv": pv,
        "session": session,
        "profil": profil,
        "profil_nom": CODE_TO_API_PROFIL[profil],
        "nom": cached["nom"],
        "prenom": cached["prenom"],
        "lycee": cached["lycee"],
        "found_in_cache": True,
    }


def _live_hit(pv: str, session: int, profil: str, result: dict) -> dict:
    return {
        "pv": pv,
        "session": session,
        "profil": profil,
        "profil_nom": CODE_TO_API_PROFIL[profil],
        "nom": result["nom"],
        "prenom": result["prenom"],
        "lycee": result["lycee"],
        "found_in_cache": False,
    }


async def check_pv_session(
    client: httpx.AsyncClient, pv: str, session: int, force: bool = False, concurrent: bool = False
) -> dict | None:
    """
    Test a PV against all 3 profiles for a given session.
    Uses cache unless force=True.

    concurrent=False (default): profiles are tried one at a time, stopping at the
    first success. Used by crossref.py's backfill, which deliberately throttles
    its own request rate (--delay) to avoid hammering the external API — keep it
    sequential here.

    concurrent=True: cache is still checked first (cheap, local), but any
    profiles left to query live are fired in parallel with a short per-call
    timeout. Used by the interactive /api/search endpoint, where a real visitor
    is waiting and we can't afford up to 3 sequential 15s timeouts.

    Returns candidate dict if found, None if not admitted in all profiles.
    """
    to_query = []
    for profil in ALL_PROFILES:
        if not force:
            cached = ukag_check_exists(pv, session, profil)
            if cached:
                if cached["status"] == "success":
                    return _cache_hit(pv, session, profil)
                continue  # not_admitted or error cached → skip, no need to re-query
        to_query.append(profil)

    if not to_query:
        return None

    if not concurrent:
        for profil in to_query:
            result = await check_one(client, pv, session, profil)
            save_ukag_check(
                pv=pv,
                session=session,
                profil=profil,
                profil_api=CODE_TO_API_PROFIL[profil],
                status=result["status"],
                nom=result.get("nom"),
                prenom=result.get("prenom"),
                lycee=result.get("lycee"),
                lycee_id=result.get("lycee_id"),
                error_msg=result.get("error_msg"),
            )
            if result["status"] == "success":
                return _live_hit(pv, session, profil, result)
        return None

    results = await asyncio.gather(
        *(check_one(client, pv, session, profil, timeout=6.0) for profil in to_query)
    )
    for profil, result in zip(to_query, results):
        save_ukag_check(
            pv=pv,
            session=session,
            profil=profil,
            profil_api=CODE_TO_API_PROFIL[profil],
            status=result["status"],
            nom=result.get("nom"),
            prenom=result.get("prenom"),
            lycee=result.get("lycee"),
            lycee_id=result.get("lycee_id"),
            error_msg=result.get("error_msg"),
        )
    for profil, result in zip(to_query, results):
        if result["status"] == "success":
            return _live_hit(pv, session, profil, result)
    return None


async def cross_reference_pvs(
    pvs: list[str],
    sessions: list[int] | None = None,
    delay: float = 0.5,
    batch_size: int = 50,
) -> dict:
    """
    Cross-reference a list of PVs against the ukag API.
    For each PV, tests sessions 2023-2026 (or specified).
    Returns stats: {checked, found, not_found, new_candidates, errors}
    """
    if sessions is None:
        sessions = [2023, 2024, 2025, 2026]

    stats = {"checked": 0, "found": 0, "not_found": 0, "new_candidates": 0, "errors": 0}

    async with httpx.AsyncClient(timeout=15.0) as client:
        for i, pv in enumerate(pvs):
            for session in sessions:
                result = await check_pv_session(client, pv, session)
                stats["checked"] += 1

                if result:
                    stats["found"] += 1
                    inserted = insert_ukag_candidate(
                        pv=result["pv"],
                        session=result["session"],
                        profil=result["profil"],
                        profil_nom=result["profil_nom"],
                        nom=result["nom"],
                        prenom=result["prenom"],
                        lycee=result["lycee"],
                    )
                    if inserted:
                        stats["new_candidates"] += 1
                else:
                    stats["not_found"] += 1

            if i > 0 and i % batch_size == 0:
                print(f"[crossref] {i}/{len(pvs)} PVs tested, {stats['found']} found, {stats['new_candidates']} new")
                await asyncio.sleep(delay * 2)  # extra pause between batches

    return stats
