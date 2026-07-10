from app.search import fuzzy_score, is_pv_query, normalize


def test_normalize_strips_accents_and_lowercases():
    assert normalize("SYLLA") == "sylla"
    assert normalize("Ndèye Fatou") == "ndeye fatou"


def test_is_pv_query_accepts_4_to_6_digits():
    assert is_pv_query("1234")
    assert is_pv_query("24841")
    assert is_pv_query("123456")


def test_is_pv_query_rejects_non_numeric_or_wrong_length():
    assert not is_pv_query("abcde")
    assert not is_pv_query("123")
    assert not is_pv_query("1234567")


def test_fuzzy_score_exact_match_is_100():
    assert fuzzy_score("SYLLA", "sylla") == 100.0


def test_fuzzy_score_typo_scores_lower_than_exact_match():
    exact = fuzzy_score("SYLLA", "sylla")
    typo = fuzzy_score("SYLLA", "silla")
    assert typo < exact
