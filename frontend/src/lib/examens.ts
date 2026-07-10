export const EXAMEN_LABELS: Record<string, string> = {
  BAC: "Baccalauréat",
  BEPC: "BEPC",
  CEE: "CEE",
};

// Cette map est la seule source de vérité côté frontend pour savoir quels examens
// ont de vraies données scrapées (voir backend/scraper/) plutôt que d'afficher
// "bientôt disponible". Le BEPC 2026 n'est pas encore publié par guineematin au
// moment où ce commentaire est écrit — repasser à true dès qu'il est scrapé.
export const EXAMEN_DISPONIBLE: Record<string, boolean> = {
  BAC: true,
  BEPC: false,
  CEE: true,
};
