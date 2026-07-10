import logging
import sqlite3
import json
import os
import re
from contextlib import contextmanager

logger = logging.getLogger("bac_api")


def ensure_db_path():
    """Ensure the directory for the database file exists (for Docker volume)."""
    db_dir = os.path.dirname(DATABASE_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

DATABASE_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "..", "bac.db"))
SEED_DATA_PATH = os.environ.get(
    "SEED_DATA_PATH",
    os.path.join(os.path.dirname(__file__), "..", "data", "bac_results.json"),
)

_connection: sqlite3.Connection | None = None

PROFIL_NAME_TO_CODE = {
    "Sciences Sociales": "SS",
    "Sciences Sociales Franco-Arabe": "SS-FA",
    "Mathématiques": "SM",
    "Sciences Mathématiques": "SM",
    "Expérimentales": "SE",
    "Sciences Expérimentales": "SE",
    "Expérimentales Franco-Arabe": "SE-FA",
}


def get_db() -> sqlite3.Connection:
    global _connection
    if _connection is None:
        ensure_db_path()
        _connection = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        _connection.row_factory = sqlite3.Row
        _connection.execute("PRAGMA journal_mode=WAL")
        _connection.execute("PRAGMA foreign_keys=ON")
        _connection.execute("PRAGMA busy_timeout=5000")
    return _connection


@contextmanager
def get_cursor():
    db = get_db()
    cur = db.cursor()
    try:
        yield cur
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()


def init_db():
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS candidats (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                nom         TEXT NOT NULL,
                prenom      TEXT,
                nom_complet TEXT,
                pv          TEXT NOT NULL,
                rang        INTEGER,
                ex          INTEGER DEFAULT 0,
                centre      TEXT,
                origine     TEXT,
                mention     TEXT,
                session     INTEGER NOT NULL,
                profil      TEXT NOT NULL,
                profil_nom  TEXT,
                examen      TEXT DEFAULT 'BAC',
                region      TEXT,
                source      TEXT DEFAULT 'guineematin',
                created_at  TEXT DEFAULT (datetime('now')),
                updated_at  TEXT DEFAULT (datetime('now'))
            )
        """)

        # Migration idempotente : la colonne 'region' a ete ajoutee apres coup
        # (le PV n'est unique qu'au niveau regional pour BEPC/CEE, pas au niveau
        # national comme pour le BAC — voir AGENTS.md). CREATE TABLE IF NOT EXISTS
        # ne touche pas une table deja existante, donc on l'ajoute a la main.
        cur.execute("PRAGMA table_info(candidats)")
        existing_columns = {row[1] for row in cur.fetchall()}
        if "region" not in existing_columns:
            cur.execute("ALTER TABLE candidats ADD COLUMN region TEXT")

        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_pv ON candidats (pv)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_nom ON candidats (nom)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_origine ON candidats (origine)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_session ON candidats (session)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_profil ON candidats (profil)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_session_profil ON candidats (session, profil)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_origine_session ON candidats (origine, session)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_mention ON candidats (mention)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_candidats_examen ON candidats (examen)")

        # Migration idempotente : anciennes valeurs 'Bac'/'Brevet' -> codes standardisés
        # BAC/BEPC/CEE (cohérent avec les codes de profil SS/SM/SE). No-op une fois fait.
        cur.execute("UPDATE candidats SET examen = 'BAC' WHERE examen = 'Bac'")
        cur.execute("UPDATE candidats SET examen = 'BEPC' WHERE examen = 'Brevet'")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS ukag_checks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                pv          TEXT NOT NULL,
                session     INTEGER NOT NULL,
                profil      TEXT NOT NULL,
                profil_api  TEXT NOT NULL,
                status      TEXT NOT NULL,
                nom         TEXT,
                prenom      TEXT,
                lycee       TEXT,
                lycee_id    INTEGER,
                error_msg   TEXT,
                checked_at  TEXT DEFAULT (datetime('now'))
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ukag_checks_pv ON ukag_checks (pv)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ukag_checks_key ON ukag_checks (pv, session, profil)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ukag_checks_status ON ukag_checks (status)")


def split_name(full_name: str) -> tuple[str | None, str]:
    """Split 'MOHAMED SYLLA' into prenom='MOHAMED', nom='SYLLA'."""
    parts = full_name.strip().split(None, 1)
    if len(parts) == 1:
        return None, parts[0]
    return parts[0], parts[1]


def seed_database(json_path: str | None = None):
    path = json_path or SEED_DATA_PATH
    if not os.path.exists(path):
        logger.warning("Seed data file not found: %s, skipping seed", path)
        return

    logger.info("Loading seed data from %s", path)
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    profile_map = {}
    for raw_name, code in PROFIL_NAME_TO_CODE.items():
        profile_map[raw_name] = code

    inserted = 0
    skipped = 0

    with get_cursor() as cur:
        for key, candidates in data.items():
            session_str, profil_code = key.rsplit("_", 1)
            session = int(session_str)

            for c in candidates:
                pv = str(c.get("pv", "")).replace(" ", "")
                if not pv:
                    skipped += 1
                    continue

                # Check if PV already exists for this session+profil
                cur.execute(
                    "SELECT id FROM candidats WHERE pv = ? AND session = ? AND profil = ?",
                    (pv, session, profil_code),
                )
                if cur.fetchone():
                    skipped += 1
                    continue

                full_name = c.get("nom", "")
                prenom, nom = split_name(full_name)
                nom_complet = f"{prenom} {nom}".strip() if prenom else nom

                raw_profil = c.get("profil", "")
                profil_nom = raw_profil

                # Normalize rang: handle "1 015" -> 1015
                rang_str = str(c.get("rang", "")).replace(" ", "")
                rang = int(rang_str) if rang_str.isdigit() else None

                ex_val = 1 if c.get("ex", "").strip().upper() == "X" else 0

                mention = c.get("mention", "")
                if mention == "TBIEN":
                    mention = "TB"

                cur.execute(
                    """
                    INSERT INTO candidats
                        (nom, prenom, nom_complet, pv, rang, ex, centre, origine,
                         mention, session, profil, profil_nom, examen, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BAC', 'guineematin')
                    """,
                    (
                        nom,
                        prenom,
                        nom_complet,
                        pv,
                        rang,
                        ex_val,
                        c.get("centre", ""),
                        c.get("origine", ""),
                        mention,
                        session,
                        profil_code,
                        profil_nom,
                    ),
                )
                inserted += 1

    logger.info("Seed done: %d inserted, %d skipped (duplicates or no PV)", inserted, skipped)


def table_exists() -> bool:
    db = get_db()
    cur = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='candidats'")
    return cur.fetchone() is not None


def row_count() -> int:
    db = get_db()
    cur = db.execute("SELECT COUNT(*) FROM candidats")
    return cur.fetchone()[0]


def distinct_pvs() -> list[str]:
    """Return all unique PV numbers from the candidats table."""
    db = get_db()
    rows = db.execute("SELECT DISTINCT pv FROM candidats ORDER BY pv").fetchall()
    return [r["pv"] for r in rows]


def ukag_check_exists(pv: str, session: int, profil: str) -> dict | None:
    """Return cached check if it exists, None otherwise."""
    db = get_db()
    row = db.execute(
        "SELECT * FROM ukag_checks WHERE pv = ? AND session = ? AND profil = ?",
        (pv, session, profil),
    ).fetchone()
    return dict(row) if row else None


def save_ukag_check(pv: str, session: int, profil: str, profil_api: str,
                    status: str, nom: str | None = None, prenom: str | None = None,
                    lycee: str | None = None, lycee_id: int | None = None,
                    error_msg: str | None = None):
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT OR REPLACE INTO ukag_checks
                (pv, session, profil, profil_api, status, nom, prenom, lycee, lycee_id, error_msg, checked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """,
            (pv, session, profil, profil_api, status, nom, prenom, lycee, lycee_id, error_msg),
        )


def insert_ukag_candidate(pv: str, session: int, profil: str, profil_nom: str,
                          nom: str, prenom: str, lycee: str) -> bool:
    """Insert a candidate found via ukag API. Returns True if new, False if duplicate."""
    with get_cursor() as cur:
        cur.execute(
            "SELECT id FROM candidats WHERE pv = ? AND session = ? AND profil = ?",
            (pv, session, profil),
        )
        if cur.fetchone():
            return False

        nom_complet = f"{prenom} {nom}".strip()
        cur.execute(
            """
            INSERT INTO candidats
                (nom, prenom, nom_complet, pv, origine, session, profil, profil_nom, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ukag')
            """,
            (nom, prenom, nom_complet, pv, lycee, session, profil, profil_nom),
        )
        return True
