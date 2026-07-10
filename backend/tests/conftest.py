import json
import os
import tempfile

# Must run before any `app.*` module is imported: app/database.py reads
# DATABASE_PATH / SEED_DATA_PATH into module-level constants at import time,
# so the env vars have to exist first. pytest imports conftest.py before it
# collects any test module in this directory, which guarantees the ordering.
_tmp_dir = tempfile.mkdtemp(prefix="bac_test_")
DB_PATH = os.path.join(_tmp_dir, "test_bac.db")
SEED_PATH = os.path.join(_tmp_dir, "test_seed.json")

os.environ["DATABASE_PATH"] = DB_PATH
os.environ["SEED_DATA_PATH"] = SEED_PATH
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

SEED_DATA = {
    "2020_SS": [
        {
            "rang": "1",
            "ex": "",
            "nom": "MOHAMED SYLLA",
            "centre": "MORIFINDJAN DIABATE",
            "pv": "24 841",
            "origine": "GSP_EMMANUEL",
            "mention": "BIEN",
            "profil": "Sciences Sociales",
        },
        {
            "rang": "2",
            "ex": "",
            "nom": "FATOUMATA CAMARA",
            "centre": "MORIFINDJAN DIABATE",
            "pv": "24842",
            "origine": "LYCEE DONKA",
            "mention": "PASSABLE",
            "profil": "Sciences Sociales",
        },
    ],
}

with open(SEED_PATH, "w", encoding="utf-8") as f:
    json.dump(SEED_DATA, f)

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
