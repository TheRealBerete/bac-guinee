export const EXAMEN_LABELS: Record<string, string> = {
  BAC: "Baccalauréat",
  BEPC: "BEPC",
  CEE: "CEE",
};

// Seul le Bac a des données réelles pour l'instant (aucun scraper/API pour BEPC/CEE).
// Cette map est la seule source de vérité côté frontend pour savoir quels examens
// afficher comme "disponibles" plutôt que "bientôt disponible".
export const EXAMEN_DISPONIBLE: Record<string, boolean> = {
  BAC: true,
  BEPC: false,
  CEE: false,
};
