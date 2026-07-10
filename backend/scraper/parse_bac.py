"""Download and parse the consolidated BAC results PDF from guineematin.

Fallback path only — guineematin has published an .xlsx version of the same
BAC results alongside the PDF for recent sessions, and discover.py prefers it
(faster, more reliable than PDF table-extraction). This stays in place in case
a future session only has a PDF."""

import io

import httpx
import pdfplumber

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


def download_pdf(url: str) -> bytes:
    resp = httpx.get(url, headers={"User-Agent": USER_AGENT}, timeout=120.0, follow_redirects=True)
    resp.raise_for_status()
    return resp.content


def parse_bac_pdf(pdf_bytes: bytes):
    """
    Yield normalized row dicts from the consolidated BAC results PDF.

    Every page repeats the same table header (Options, Rang, ex, Prénoms et Noms,
    Centre, PV, Origine, Mention) — rows without a numeric PV (the title row, the
    repeated header row) are skipped.
    """
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for row in table:
                    if row is None or len(row) < 8:
                        continue

                    profil, rang, ex, nom_complet, centre, pv, origine, mention = row[:8]

                    if not pv or not str(pv).strip().isdigit():
                        continue

                    yield {
                        "profil": (profil or "").strip(),
                        "rang": rang,
                        "ex": ex,
                        "nom_complet": nom_complet,
                        "centre": centre,
                        "pv": pv,
                        "origine": origine,
                        "mention": mention,
                    }
