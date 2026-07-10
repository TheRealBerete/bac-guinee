"""
Scraper entrypoint: discover, download, parse and ingest guineematin results
for BAC/BEPC/CEE, so the database becomes self-sufficient instead of relying
only on the ukag on-demand fallback (which stays untouched as a safety net).

Usage:
    python -m scraper.run                        # all exams, current year
    python -m scraper.run --examen BAC           # one exam
    python -m scraper.run --session 2025 2026    # specific session(s)
    python -m scraper.run --check-only           # just report what's published, don't ingest
"""

import argparse
import datetime

from app.database import init_db, row_count
from scraper.discover import find_results_file_url
from scraper.ingest import insert_candidates
from scraper.parse_bac import download_pdf, parse_bac_pdf
from scraper.parse_xlsx import download_xlsx, parse_results_xlsx

PROFIL_NOM_BY_CODE = {
    "SS": "Sciences Sociales",
    "SM": "Sciences Mathématiques",
    "SE": "Sciences Expérimentales",
    "SS-FA": "Sciences Sociales Franco-Arabe",
    "SE-FA": "Sciences Expérimentales Franco-Arabe",
}


def check_one(examen: str, session: int) -> bool:
    """Report whether guineematin has published results for this exam/session,
    without downloading or ingesting anything — useful to poll for BAC/BEPC 2026
    (not out yet at the time of writing) without running a full scrape attempt."""
    url = find_results_file_url(examen, session)
    if url:
        print(f"[{examen} {session}] Disponible : {url}")
    else:
        print(f"[{examen} {session}] Pas encore disponible.")
    return url is not None


def run_one(examen: str, session: int) -> dict:
    stats = {"examen": examen, "session": session, "inserted": 0, "skipped": 0}

    url = find_results_file_url(examen, session)
    if not url:
        print(f"[{examen} {session}] Aucun fichier de résultats trouvé.")
        return stats

    print(f"[{examen} {session}] Fichier trouvé : {url}")

    if url.lower().endswith(".pdf"):
        rows = parse_bac_pdf(download_pdf(url))
    else:
        rows = parse_results_xlsx(download_xlsx(url), examen=examen)

    if examen == "BAC":
        profil_nom_for = lambda row: PROFIL_NOM_BY_CODE.get(row["profil"], row["profil"])
    else:
        profil_nom_for = lambda row: "Tronc commun"

    inserted, skipped = insert_candidates(rows, session=session, examen=examen, profil_nom_for=profil_nom_for)
    stats["inserted"], stats["skipped"] = inserted, skipped

    print(f"[{examen} {session}] {stats['inserted']} inséré(s), {stats['skipped']} déjà en base")
    return stats


def main():
    parser = argparse.ArgumentParser(description="Scraper guineematin (BAC/BEPC/CEE)")
    parser.add_argument("--examen", choices=["BAC", "BEPC", "CEE"], nargs="+", default=["BAC", "BEPC", "CEE"])
    parser.add_argument("--session", type=int, nargs="+", default=[datetime.date.today().year])
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Only report whether results are published (discovery step only) — no download/ingestion, no DB touched.",
    )
    args = parser.parse_args()

    if args.check_only:
        for examen in args.examen:
            for session in args.session:
                check_one(examen, session)
        return

    init_db()
    print(f"Candidats en base avant : {row_count()}")

    for examen in args.examen:
        for session in args.session:
            run_one(examen, session)

    print(f"Candidats en base après : {row_count()}")


if __name__ == "__main__":
    main()
