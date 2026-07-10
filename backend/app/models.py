from pydantic import BaseModel
from typing import Optional


class CandidateOut(BaseModel):
    id: int
    nom: str
    prenom: Optional[str] = None
    nom_complet: str
    pv: str
    rang: Optional[int] = None
    ex: bool = False
    centre: Optional[str] = None
    origine: Optional[str] = None
    mention: Optional[str] = None
    session: int
    profil: str
    profil_nom: Optional[str] = None
    examen: str = "BAC"
    source: str = "guineematin"

    model_config = {"from_attributes": True}


class SearchResponse(BaseModel):
    query: str
    total: int
    page: int
    limit: int
    results: list[CandidateOut]


class StatsGlobal(BaseModel):
    total_candidats: int
    sessions: list[int]
    profils: list[dict]
    top_lycees: list[dict]


class SessionInfo(BaseModel):
    session: int
    count: int


class ProfilInfo(BaseModel):
    code: str
    nom: str
    count: int
