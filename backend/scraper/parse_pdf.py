"""Download and parse the consolidated results PDF from guineematin.

Fallback path only — guineematin has published an .xlsx version of the same
results alongside the PDF for recent sessions, and discover.py prefers it
(faster, more reliable than PDF table-extraction). This stays in place for
sessions that only have a PDF (older BAC sessions, and some BEPC/CEE sessions
before guineematin started publishing xlsx workbooks)."""

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


def _clean(value) -> str:
    return value.strip() if isinstance(value, str) else (value or "")


def parse_results_pdf(pdf_bytes: bytes, examen: str):
    """
    Yield normalized row dicts from a consolidated results PDF.

    Every page repeats the same table header (Rang, ex, Prénoms et Noms, Centre,
    PV, Origine, Mention) — rows without a numeric PV (the title row, the
    repeated header row) are skipped. The first column differs by exam, same
    as parse_xlsx.parse_results_xlsx: a real profil code for BAC (SS/SM/SE...),
    or a region (IRE for BEPC, DPE for CEE — no filiere) for BEPC/CEE, which
    all get the GENERAL profil sentinel instead.
    """
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                for row in table:
                    if row is None or len(row) < 8:
                        continue

                    first_col, rang, ex, nom_complet, centre, pv, origine, mention = row[:8]

                    if not pv or not str(pv).strip().isdigit():
                        continue

                    if examen == "BAC":
                        profil = _clean(first_col)
                        region = None
                    else:
                        profil = "GENERAL"
                        region = _clean(first_col)

                    yield {
                        "profil": profil,
                        "region": region,
                        "rang": rang,
                        "ex": ex,
                        "nom_complet": _clean(nom_complet),
                        "centre": _clean(centre),
                        "pv": pv,
                        "origine": _clean(origine),
                        "mention": _clean(mention),
                    }
