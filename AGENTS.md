# AGENTS.md

## Project status

Backend + Frontend implemented. Ready for deployment. The `backend/` directory contains a working FastAPI app with SQLite (2207+ candidates). The `frontend/` directory contains a Next.js 16 app with Tailwind v4.

## Key documents

- `scraping/PRD_ROADMAP.md` — full product spec, schema, API documentation, and roadmap (NOTE: the stack section is outdated; see below for the actual stack)
- `scraping/bac_results.json` — 2207+ candidates scraped from guineematin.com PDFs (2020–2022)

## Stack

- **Frontend:** Next.js 16 (App Router), hosted on **Vercel** at `bac.afrovizion.com`
- **Styling:** Tailwind CSS v4 (CSS-based config, no tailwind.config.ts)
- **Backend API:** **FastAPI** (Python), self-hosted on **Coolify** at `bac.afrovizion.com/api` (same domain, behind reverse proxy)
- **DB:** **SQLite** (file-based, co-located with the FastAPI backend)
- **Scraper:** Python (pdfplumber)
- **Deployment:** Docker via Coolify (Dockerfile)

## Deployment

### Backend (Coolify)

1. Point `bac.afrovizion.com` DNS to Coolify server
2. Deploy the `backend/` directory as a Docker service
3. Volume mount `/app/data` to persist `bac.db` across redeploys
4. Environment variables:
   - `CORS_ORIGINS=https://bac.afrovizion.com` (or `*` if same-domain)
   - `DATABASE_PATH=/app/data/bac.db`
5. Coolify reverse proxy: route `/api/*` → backend container:8000, route `/*` → Vercel

### Frontend (Vercel)

1. Connect the repo, set root directory to `frontend/`
2. Environment variable: `NEXT_PUBLIC_API_URL=/api` (relative, since same domain)
3. Deploy

### Local dev

```bash
# Backend
cd backend && python -m uvicorn app.main:app --port 8000

# Frontend  
cd frontend && npm run dev
```

The frontend defaults to `http://localhost:8000/api` when `NEXT_PUBLIC_API_URL` is not set.

## Backend directory

```
backend/
├── app/
│   ├── main.py          # FastAPI entrypoint, CORS, auto-seed on startup
│   ├── database.py       # SQLite connection, schema (candidats + ukag_checks), seed
│   ├── models.py         # Pydantic response schemas
│   ├── search.py         # difflib fuzzy search, auto-detect PV vs name
│   ├── ukag.py           # ukag API client (multipart/form-data), cache, cross-reference
│   └── routers/
│       ├── search.py     # GET /api/search?q=...
│       ├── candidate.py  # GET /api/candidat/{id}
│       └── stats.py      # GET /api/stats, /lycee/{nom}, /sessions, /profils
├── crossref.py           # Standalone script: test PVs against ukag API for 2023-2026
├── data/bac_results.json # Copy of seed data (used by Docker build)
├── bac.db                # SQLite database (gitignored)
├── requirements.txt
└── Dockerfile
```

## Frontend directory

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (Header + Footer)
│   │   ├── page.tsx              # Home (search bar + stats SSR)
│   │   ├── globals.css           # Tailwind v4 + Stack Sans Text font + design tokens
│   │   ├── recherche/
│   │   │   ├── page.tsx          # Search results (?q=, ?session=, ?profil=)
│   │   │   └── Filters.tsx       # Session + profil filter selects
│   │   ├── candidat/[id]/page.tsx # Candidate detail + ShareButton
│   │   ├── lycee/[nom]/page.tsx  # School stats + admitted list
│   │   ├── stats/page.tsx        # Global stats dashboard
│   │   └── contact/page.tsx      # About / sources
│   ├── components/
│   │   ├── Header.tsx            # Floating pill navbar
│   │   ├── Footer.tsx
│   │   ├── SearchBar.tsx         # Debounced 300ms, auto-submit
│   │   ├── CandidateCard.tsx     # Result card with mention/profil badges
│   │   ├── ScrollReveal.tsx      # IntersectionObserver fade-in
│   │   └── ShareButton.tsx       # WhatsApp sharing
│   └── lib/
│       └── api.ts                # Fetch client → FastAPI backend
├── public/                       # Fonts, images, SVGs from Finorio template
├── package.json
├── tsconfig.json
└── next.config.ts
```

## API endpoints

| Method | Route | Query params |
|---|---|---|
| GET | `/api/search` | `q` (required), `session`, `profil`, `examen`, `mention`, `page`, `limit` |
| GET | `/api/candidat/{id}` | |
| GET | `/api/stats` | |
| GET | `/api/stats/lycees` | `limit` |
| GET | `/api/lycee/{nom}` | `page`, `limit` |
| GET | `/api/sessions` | |
| GET | `/api/profils` | |
| GET | `/api/health` | |

All GET 200 responses include `Cache-Control: public, max-age=86400`.

### Search fallback

When a PV search returns 0 results in the local DB, the endpoint automatically queries the ukag API (mon-portail.gtsco-kag.org), tests all 3 profiles, caches the result in `ukag_checks`, and inserts any found candidate. This means 2023-2026 candidates are discovered on-demand as users search for them.

### Cross-reference script

```bash
# Test all 2166 PVs against 2023-2026 (very slow - ~26000 API calls)
python crossref.py

# Test first 100 PVs only, 2025 session, with 1.5s delay between calls
python crossref.py --limit 100 --session 2025 --delay 1.5

# Ignore cache, re-query everything
python crossref.py --force
```

The `ukag_checks` table serves as a request cache — each PV+session+profil combo is queried only once. The "not_admitted" response from the API is ambiguous, so the cross-referencer tests all 3 profiles (SS, SM, SE) for every PV before concluding the candidate is not found.

## External API gotchas (mon-portail.gtsco-kag.org)

The official results API (`POST /public/verificationResultatBac`) has several sharp edges:

- **multipart/form-data ONLY** — JSON requests silently fail with `"Veuillez saisir le PV BAC"`
- **Profile values are French full names** (`"Sciences Sociales"`, `"Mathématiques"`, `"Expérimentales"`), **not** codes (`"SS"`, `"SM"`, `"SE"`)
- **No CORS** — must proxy through backend, never call directly from browser
- **"Non admis" message is ambiguous** — can mean the candidate failed, OR the wrong profile was queried, OR data isn't available for that session. Always test all 3 profiles for a given PV before concluding.
- **Franco-Arabe profiles (SS-FA, SE-FA) are NOT supported** by the API — PDF is the only source for these.

## Data normalization rules

- **PV numbers** in PDFs contain spaces (e.g. `"24 841"`) — store without spaces (`"24841"`)
- **Names** in PDFs are ALL CAPS — store as-is but search must be case-insensitive
- **2022 PDF URLs** use **Unicode decomposed** `é` (`e%CC%81`), not composed (`%C3%A9`). The composed form returns 404. Use exact URLs from the PRD annex.
- Some fields contain literal `\n` from multi-line PDF cells (e.g. origine `"GS OUSMANE\nCAMARA"`)

## SQLite vs PostgreSQL trade-offs

The PRD originally specified PostgreSQL/Supabase. Using SQLite means:
- **No `pg_trgm` extension** — fuzzy search is implemented in Python using the stdlib `difflib` (no external dependency)
- **No `tsvector` / full-text search** — `search_vector` column is dropped; all search goes through the API backend
- **No generated columns** — `nom_complet` is computed at query time or stored as a regular column populated on insert/update
- **Simpler indexes** — plain B-tree indexes on `pv`, `session`, `profil`, `origine` (no GIN/GiST)
- **Single-file DB** — `bac.db` lives next to the FastAPI backend, no separate DB service needed

## Schema (SQLite — adapted from PRD section 7.1)

```sql
CREATE TABLE candidats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,
    prenom      TEXT,
    nom_complet TEXT,                     -- populated on INSERT (prenom || ' ' || nom) via application
    pv          TEXT NOT NULL,            -- PV sans espaces
    rang        INTEGER,
    ex          INTEGER DEFAULT 0,        -- bool stored as 0/1
    centre      TEXT,
    origine     TEXT,
    mention     TEXT,
    session     INTEGER NOT NULL,
    profil      TEXT NOT NULL,            -- "SS", "SM", "SE", "SS-FA", "SE-FA"
    profil_nom  TEXT,                     -- "Sciences Sociales", etc.
    examen      TEXT DEFAULT 'Bac',
    source      TEXT DEFAULT 'guineematin',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_candidats_pv ON candidats (pv);
CREATE INDEX idx_candidats_nom ON candidats (nom);
CREATE INDEX idx_candidats_origine ON candidats (origine);
CREATE INDEX idx_candidats_session ON candidats (session);
CREATE INDEX idx_candidats_profil ON candidats (profil);
CREATE INDEX idx_candidats_session_profil ON candidats (session, profil);
CREATE INDEX idx_candidats_origine_session ON candidats (origine, session);
```

## Search behavior

- Search input auto-detects: numeric (4-6 digits) → PV search, text → name/école search
- Insensitive to case and accents (SQL `COLLATE NOCASE` + Python `unicodedata.normalize`)
- Debounce 300ms on frontend
- Max 100 results per page
- Fuzzy matching via `difflib.SequenceMatcher` (no external dependency)
- Auto-fallback to ukag API when PV not found locally (discovers 2023-2026 candidates on demand)
