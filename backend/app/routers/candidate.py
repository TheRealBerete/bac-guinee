from fastapi import APIRouter, HTTPException

from app.database import get_db
from app.models import CandidateOut

router = APIRouter(tags=["candidate"])


@router.get("/candidat/{candidat_id}", response_model=CandidateOut)
def get_candidate(candidat_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM candidats WHERE id = ?", (candidat_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    return CandidateOut.model_validate(dict(row))
