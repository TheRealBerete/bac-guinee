"""Insert normalized scraped rows into the candidats table.

Reuses the dedup-by-(pv, session, profil) key and name/mention normalization
already established in app.database (seed_database, insert_ukag_candidate) so
re-running the scraper is idempotent and consistent with the rest of the data.
"""

from collections.abc import Callable, Iterable

from app.database import get_cursor, split_name


def normalize_mention(raw) -> str:
    mention = (raw or "").strip() if isinstance(raw, str) else (raw or "")
    if mention == "TBIEN":
        return "TB"
    return mention


def normalize_rang(raw) -> int | None:
    rang_str = str(raw or "").replace(" ", "").strip()
    return int(rang_str) if rang_str.isdigit() else None


def normalize_ex(raw) -> int:
    return 1 if str(raw or "").strip().upper() == "X" else 0


def insert_candidates(
    rows: Iterable[dict],
    session: int,
    examen: str,
    profil_nom_for: Callable[[dict], str | None],
) -> tuple[int, int]:
    """
    Insert many normalized candidate rows in a single transaction.

    Two things learned by actually testing against production-size fixtures
    rather than assuming:
    - One commit for the whole batch (not one per row, which insert_ukag_candidate
      does for one-off live lookups but is far too slow for 100k+ rows).
    - The existing (pv, profil, region) keys for the session are preloaded into
      a set once, so the per-row dedup check is an in-memory lookup instead of
      a SQL round-trip.
    - The dedup key includes `region`: PV numbers are only unique *within a
      region* for BEPC/CEE (confirmed by testing — e.g. PV 1242 exists in both
      Boké and Faranah for CEE 2026, two different candidates), unlike the Bac
      where PV is unique nationally. Without `region` in the key, ~85% of a
      CEE file's rows were wrongly discarded as "duplicates" of a same-PV
      candidate in a different region. `region` is None for the Bac (and for
      any row that doesn't carry one), which keeps existing Bac behavior
      unchanged.

    Returns (inserted, skipped) — skipped counts rows already present for the
    same (pv, session, profil, region).
    """
    inserted = 0
    skipped = 0

    with get_cursor() as cur:
        cur.execute("SELECT pv, profil, region FROM candidats WHERE session = ?", (session,))
        existing = {(r[0], r[1], r[2]) for r in cur.fetchall()}

        for row in rows:
            pv = str(row["pv"]).replace(" ", "").strip()
            profil = row["profil"]
            region = row.get("region")

            if (pv, profil, region) in existing:
                skipped += 1
                continue

            prenom, nom = split_name(row.get("nom_complet") or "")
            nom_complet = f"{prenom} {nom}".strip() if prenom else nom

            cur.execute(
                """
                INSERT INTO candidats
                    (nom, prenom, nom_complet, pv, rang, ex, centre, origine,
                     mention, session, profil, profil_nom, examen, region, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'guineematin')
                """,
                (
                    nom,
                    prenom,
                    nom_complet,
                    pv,
                    normalize_rang(row.get("rang")),
                    normalize_ex(row.get("ex")),
                    row.get("centre") or "",
                    row.get("origine") or "",
                    normalize_mention(row.get("mention")),
                    session,
                    profil,
                    profil_nom_for(row),
                    examen,
                    region,
                ),
            )
            existing.add((pv, profil, region))
            inserted += 1

    return inserted, skipped
