"use client";

import { useRouter } from "next/navigation";
import { EXAMEN_LABELS } from "@/lib/examens";

const EXAMENS = [
  { value: "", label: "Tous les examens" },
  ...Object.entries(EXAMEN_LABELS).map(([value, label]) => ({ value, label })),
];

const SESSIONS = [
  { value: "", label: "Toutes les sessions" },
  { value: "2020", label: "2020" },
  { value: "2021", label: "2021" },
  { value: "2022", label: "2022" },
  { value: "2023", label: "2023" },
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
];

const PROFILS = [
  { value: "", label: "Tous les profils" },
  { value: "SS", label: "SS - Sciences Sociales" },
  { value: "SM", label: "SM - Mathématiques" },
  { value: "SE", label: "SE - Expérimentales" },
  { value: "SS-FA", label: "SS-FA - Franco-Arabe" },
  { value: "SE-FA", label: "SE-FA - Franco-Arabe" },
];

export function Filters({
  query,
  currentSession,
  currentProfil,
  currentExamen,
  currentOrigine,
}: {
  query: string;
  currentSession?: number;
  currentProfil?: string;
  currentExamen?: string;
  currentOrigine?: string;
}) {
  const router = useRouter();

  const navigate = (examen: string, session: string, profil: string) => {
    const params = new URLSearchParams({ q: query });
    if (examen) params.set("examen", examen);
    if (session) params.set("session", session);
    if (profil) params.set("profil", profil);
    if (currentOrigine) params.set("origine", currentOrigine);
    router.push(`/recherche?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
      <select
        value={currentExamen || ""}
        onChange={(e) => navigate(e.target.value, currentSession?.toString() || "", currentProfil || "")}
        className="bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm text-text-secondary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
      >
        {EXAMENS.map((ex) => (
          <option key={ex.value} value={ex.value}>
            {ex.label}
          </option>
        ))}
      </select>

      <select
        value={currentSession?.toString() || ""}
        onChange={(e) => navigate(currentExamen || "", e.target.value, currentProfil || "")}
        className="bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm text-text-secondary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
      >
        {SESSIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={currentProfil || ""}
        onChange={(e) => navigate(currentExamen || "", currentSession?.toString() || "", e.target.value)}
        className="bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm text-text-secondary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
      >
        {PROFILS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {(currentSession || currentProfil || currentExamen || currentOrigine) && (
        <button
          onClick={() => router.push(`/recherche?q=${encodeURIComponent(query)}`)}
          className="text-sm text-text-tertiary hover:text-text-primary transition-colors underline"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
