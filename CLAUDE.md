# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A search platform for Guinean Baccalauréat exam results ("Bac Guinée"). Data comes from two disjoint sources: PDFs scraped from guineematin.com (2020-2022, ~2207 candidates, complete national coverage) and the official ukag portal API (2023-2026, on-demand, no Franco-Arabe profiles). See `AGENTS.md` for full architecture, schema, and API documentation — it's kept current and detailed; don't duplicate its content, read it directly when you need specifics on the DB schema, endpoints, or the ukag API's quirks.

## Commands

```bash
# Backend (FastAPI) — from backend/
python -m uvicorn app.main:app --port 8000 --reload

# Frontend (Next.js) — from frontend/
npm run dev              # dev server, http://localhost:3000
npm run build            # production build (also type-checks)
npm run lint             # eslint

# Cross-reference script (tests known PVs against ukag API for 2023-2026)
cd backend && python crossref.py --limit 100 --session 2025 --delay 1.5
```

There is no backend test suite and no dedicated frontend test runner configured — `npm run build` is the closest thing to a correctness check on the frontend (TypeScript strict-checks during build).

The frontend defaults to `http://localhost:8000/api` when `NEXT_PUBLIC_API_URL` is unset, so both servers can run locally with zero config.

## Architecture

- **Backend** (`backend/app/`): FastAPI + raw `sqlite3` (no ORM). One module per concern: `database.py` (connection, schema, seeding), `search.py` (fuzzy search logic), `ukag.py` (external API client + caching), `models.py` (Pydantic response shapes), `routers/` (thin route handlers). `main.py` wires CORS, a cache-control middleware, and auto-seeds the DB from `data/bac_results.json` on first boot if the `candidats` table is empty.
- **Frontend** (`frontend/src/`): Next.js App Router, Server Components by default. `lib/api.ts` is the single fetch client to the backend — all API calls go through it, no direct `fetch` scattered in components. Pages under `app/` do SSR data fetching directly (no client-side data-fetching library).
- **Search auto-detection**: a query is routed to PV lookup (exact match) if it's 4-6 digits, otherwise to fuzzy name/school search (`difflib.SequenceMatcher`, prefiltered via SQL `LIKE`). This dual-path logic lives in `search.py::autodetect_search` and is the core of the product — most feature work touches this file.
- **Live data-discovery fallback**: when a PV search misses in SQLite, the search router transparently queries the ukag API (trying all 3 profiles, since "not admitted" is ambiguous — see `AGENTS.md` for why), caches the outcome in `ukag_checks`, and inserts any hit into `candidats` with `source='ukag'`. This means the DB grows lazily as users search for 2023+ candidates.
- **DB is a single SQLite file** (`backend/bac.db`, gitignored, WAL mode), volume-mounted in Docker so it survives redeploys. No migrations tool — schema changes go directly into `init_db()` in `database.py` as `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`.

## Things to know before touching data logic

- PV numbers must be normalized without spaces (`"24 841"` → `"24841"`) before any comparison or insert.
- Names are stored ALL CAPS as-sourced; searches must stay case- and accent-insensitive (`unicodedata.normalize` + SQL `COLLATE NOCASE`).
- The ukag API only accepts `multipart/form-data` and French profile names (`"Sciences Sociales"`, not `"SS"`) — see `ukag.py` and `PROFIL_NAME_TO_CODE` in `database.py` for the mapping both directions.
- Franco-Arabe profiles (`SS-FA`, `SE-FA`) only exist in the PDF-sourced data; the ukag API has no equivalent, so the live-fallback path never produces them.
