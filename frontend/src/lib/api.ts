const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface Candidate {
  id: number;
  nom: string;
  prenom: string | null;
  nom_complet: string;
  pv: string;
  rang: number | null;
  ex: boolean;
  centre: string | null;
  origine: string | null;
  mention: string | null;
  session: number;
  profil: string;
  profil_nom: string | null;
  examen: string;
  region: string | null;
  source: string;
}

export interface SearchResult {
  query: string;
  total: number;
  page: number;
  limit: number;
  results: Candidate[];
}

export interface StatsGlobal {
  total_candidats: number;
  sessions: { session: number; count: number }[];
  profils: { code: string; nom: string; count: number }[];
  top_lycees: { nom: string; count: number }[];
}

export interface LyceeStats {
  lycee: string;
  total_admis: number;
  page: number;
  limit: number;
  par_session: { session: number; count: number }[];
  par_mention: { mention: string; count: number }[];
  candidats: {
    id: number;
    nom_complet: string;
    pv: string;
    rang: number | null;
    mention: string | null;
    session: number;
    profil: string;
    profil_nom: string | null;
    source: string;
  }[];
}

export async function search(params: {
  q: string;
  session?: number;
  profil?: string;
  examen?: string;
  origine?: string;
  centre?: string;
  region?: string;
  page?: number;
  limit?: number;
}): Promise<SearchResult> {
  const sp = new URLSearchParams();
  sp.set("q", params.q);
  if (params.session) sp.set("session", String(params.session));
  if (params.profil) sp.set("profil", params.profil);
  if (params.examen) sp.set("examen", params.examen);
  if (params.origine) sp.set("origine", params.origine);
  if (params.centre) sp.set("centre", params.centre);
  if (params.region) sp.set("region", params.region);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE}/search?${sp.toString()}`);
  if (!res.ok) throw new Error("Erreur réseau");
  return res.json();
}

export async function getCandidate(id: number): Promise<Candidate> {
  const res = await fetch(`${API_BASE}/candidat/${id}`);
  if (!res.ok) throw new Error("Candidat non trouvé");
  return res.json();
}

export async function getStats(): Promise<StatsGlobal> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error("Stats indisponibles");
  return res.json();
}

export async function getLycee(nom: string): Promise<LyceeStats> {
  const res = await fetch(`${API_BASE}/lycee/${encodeURIComponent(nom)}`);
  if (!res.ok) throw new Error("Lycée non trouvé");
  return res.json();
}

export async function getTopLycees(limit: number = 200): Promise<{ nom: string; count: number }[]> {
  const res = await fetch(`${API_BASE}/stats/lycees?limit=${limit}`);
  if (!res.ok) throw new Error("Établissements indisponibles");
  const data = await res.json();
  return data.lycees;
}
