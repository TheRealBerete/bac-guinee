// Single source of truth for mention/profil badge styling — previously
// duplicated (and drifting) across CandidateCard, candidat/[id] and
// lycee/[nom]. Tones reuse the site's existing color tokens (globals.css)
// instead of Tailwind's default palette, so badges read as part of the same
// product rather than a leftover SaaS-template accent.

export const MENTION_STYLES: Record<string, string> = {
  TB: "bg-[rgba(250,204,21,0.12)] text-[#92720c]",
  BIEN: "bg-green-bg text-green-text",
  ABIEN: "bg-[rgba(140,113,246,0.1)] text-primary-dark",
  PASSABLE: "bg-bg-tertiary text-text-secondary",
};

export const MENTION_FALLBACK = "bg-bg-tertiary text-text-secondary";

export const PROFIL_STYLES: Record<string, string> = {
  SS: "bg-bg-tertiary text-text-secondary",
  SM: "bg-bg-tertiary text-text-secondary",
  SE: "bg-bg-tertiary text-text-secondary",
  "SS-FA": "bg-bg-tertiary text-text-secondary",
  "SE-FA": "bg-bg-tertiary text-text-secondary",
};

export const PROFIL_FALLBACK = "bg-bg-tertiary text-text-secondary";
