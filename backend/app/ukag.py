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


async def check_one(client: httpx.AsyncClient, pv: str, session: int, profil: str) -> dict:
    """
    Call the ukag API for a single (pv, session, profil) combo.
    Returns: {status, nom, prenom, lycee, lycee_id, error_msg}
    """
    profil_api = CODE_TO_API_PROFIL[profil]
    data = {"pv": pv, "profil": profil_api, "session": str(session)}

    try:
        resp = await client.post(UKAG_URL, data=data, timeout=15.0)
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


async def check_pv_session(
    client: httpx.AsyncClient, pv: str, session: int, force: bool = False
) -> dict | None:
    """
    Test a PV against all 3 profiles for a given session.
    Uses cache unless force=True.
    Returns candidate dict if found, None if not admitted in all profiles.
    """
    for profil in ALL_PROFILES:
        # 1. Check cache
        if not force:
            cached = ukag_check_exists(pv, session, profil)
            if cached:
                if cached["status"] == "success":
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
                continue  # not_admitted or error → try next profile

        # 2. Call API
        result = await check_one(client, pv, session, profil)
        profil_api = CODE_TO_API_PROFIL[profil]

        # 3. Save to cache
        save_ukag_check(
            pv=pv,
            session=session,
            profil=profil,
            profil_api=profil_api,
            status=result["status"],
            nom=result.get("nom"),
            prenom=result.get("prenom"),
            lycee=result.get("lycee"),
            lycee_id=result.get("lycee_id"),
            error_msg=result.get("error_msg"),
        )

        if result["status"] == "success":
            return {
                "pv": pv,
                "session": session,
                "profil": profil,
                "profil_nom": profil_api,
                "nom": result["nom"],
                "prenom": result["prenom"],
                "lycee": result["lycee"],
                "found_in_cache": False,
            }

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
