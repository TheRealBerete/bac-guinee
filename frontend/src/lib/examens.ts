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

// Quels examens ont des données pour la session en cours (2026) spécifiquement —
// distinct de EXAMEN_DISPONIBLE (qui reflète "a des données, toutes années
// confondues"). Piloté par le formulaire "Résultats 2026" du hero : seuls les
// examens listés ici y apparaissent comme sélectionnables. À mettre à jour à la
// main après chaque scraping réussi d'une session 2026 (même geste que
// EXAMEN_DISPONIBLE — pas de détection automatique pour l'instant).
export const EXAMEN_2026_DISPONIBLE: Record<string, boolean> = {
  BAC: false,
  BEPC: false,
  CEE: true,
};
