"""
Discover the guineematin.com results announcement article for a given exam/session,
and extract the .pdf/.xlsx attachment URL from it.

guineematin has no stable/predictable URL pattern for these articles from one year
to the next, but it does expose its WordPress REST API publicly, which lets us
search for the announcement instead of hardcoding URLs.
"""

import re

import httpx

WP_API = "https://guineematin.com/wp-json/wp/v2/posts"

# guineematin blocks requests without a browser-like User-Agent (confirmed by testing).
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

SEARCH_TERMS = {
    "BAC": "baccalaureat liste des admis",
    "BEPC": "BEPC liste des admis",
    "CEE": "CEE liste des admis",
}

# guineematin sometimes links both a .xlsx and a .pdf version of the same
# results in one article. xlsx parses far faster and more reliably (openpyxl
# vs. table-extraction heuristics on hundreds of PDF pages), so it's tried first.
XLSX_LINK_PATTERN = re.compile(r'href="([^"]+\.xlsx?)"', re.IGNORECASE)
PDF_LINK_PATTERN = re.compile(r'href="([^"]+\.pdf)"', re.IGNORECASE)


def find_results_file_url(examen: str, session: int) -> str | None:
    """
    Search guineematin's WP REST API for the results announcement article for a
    given exam/session, and return the first .pdf/.xlsx attachment URL found in
    its content. Returns None if nothing matching is found.

    This is a best-effort heuristic (WordPress relevance search + "published the
    same year as the session" filter) rather than a guaranteed-correct lookup —
    it occasionally may need a manual double-check for a given year if guineematin
    changes its article naming/structure again.
    """
    query = f"{SEARCH_TERMS[examen]} {session}"
    resp = httpx.get(
        WP_API,
        params={"search": query, "per_page": 10},
        headers={"User-Agent": USER_AGENT},
        timeout=20.0,
    )
    resp.raise_for_status()
    posts = resp.json()

    for post in posts:
        # Results are announced the same calendar year as the session (June-September).
        if not post.get("date", "").startswith(str(session)):
            continue

        content = post.get("content", {}).get("rendered", "")
        match = XLSX_LINK_PATTERN.search(content) or PDF_LINK_PATTERN.search(content)
        if match:
            return match.group(1)

    return None
