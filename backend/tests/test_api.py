def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_search_by_name_returns_seeded_candidate(client):
    resp = client.get("/api/search", params={"q": "sylla"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 1
    assert any(r["nom"] == "SYLLA" for r in body["results"])


def test_search_response_has_cache_header(client):
    resp = client.get("/api/search", params={"q": "sylla"})
    assert resp.headers["cache-control"] == "public, max-age=86400"


def test_search_by_pv_normalizes_spaces_from_seed(client):
    # Seed data has pv="24 841" with a space; it must be stored/searchable as "24841".
    resp = client.get("/api/search", params={"q": "24841"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["results"][0]["pv"] == "24841"


def test_candidate_detail_by_id(client):
    search_resp = client.get("/api/search", params={"q": "24841"})
    candidate_id = search_resp.json()["results"][0]["id"]

    resp = client.get(f"/api/candidat/{candidate_id}")
    assert resp.status_code == 200
    assert resp.json()["nom_complet"] == "MOHAMED SYLLA"


def test_candidate_not_found_returns_404(client):
    resp = client.get("/api/candidat/999999")
    assert resp.status_code == 404


def test_stats_endpoint_counts_seeded_candidates(client):
    resp = client.get("/api/stats")
    assert resp.status_code == 200
    assert resp.json()["total_candidats"] == 2
