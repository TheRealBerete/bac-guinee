"use client";

import { useEffect, useRef, useState } from "react";
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
  currentCentre,
  currentRegion,
}: {
  query: string;
  currentSession?: number;
  currentProfil?: string;
  currentExamen?: string;
  currentOrigine?: string;
  currentCentre?: string;
  currentRegion?: string;
}) {
  const router = useRouter();
  const [centre, setCentre] = useState(currentCentre || "");
  const [region, setRegion] = useState(currentRegion || "");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Local state (needed for the debounced text inputs) can drift from the
  // URL whenever navigation happens without a full remount of this component
  // — the Reset button, browser back/forward, or another select changing the
  // URL directly. Re-sync it from props whenever the URL-derived values change.
  useEffect(() => {
    setCentre(currentCentre || "");
  }, [currentCentre]);

  useEffect(() => {
    setRegion(currentRegion || "");
  }, [currentRegion]);

  const navigate = (overrides: {
    examen?: string;
    session?: string;
    profil?: string;
    centre?: string;
    region?: string;
  }) => {
    // Cancel any pending debounced text-input navigation so it can't fire
    // after this one and silently override it with stale values.
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const params = new URLSearchParams({ q: query });
    const examen = overrides.examen ?? currentExamen ?? "";
    const session = overrides.session ?? currentSession?.toString() ?? "";
    // Le profil (filière) n'existe que pour le Bac — BEPC/CEE sont toujours
    // GENERAL. Comme pour région/Bac plus bas, on le retire dès qu'on bascule
    // sur un examen qui n'en a pas, plutôt que de le laisser traîner invisible.
    const profil = examen === "BEPC" || examen === "CEE" ? "" : overrides.profil ?? currentProfil ?? "";
    const centreVal = overrides.centre ?? centre;
    // Région n'a pas de sens pour le Bac (pas de champ region en base) — on la
    // retire dès qu'on bascule sur cet examen plutôt que de la laisser
    // traîner invisible et ressurgir au prochain changement de filtre.
    const regionVal = examen === "BAC" ? "" : overrides.region ?? region;

    if (examen) params.set("examen", examen);
    if (session) params.set("session", session);
    if (profil) params.set("profil", profil);
    if (currentOrigine) params.set("origine", currentOrigine);
    if (centreVal) params.set("centre", centreVal);
    if (regionVal) params.set("region", regionVal);
    router.push(`/recherche?${params.toString()}`);
  };

  const handleTextChange = (field: "centre" | "region", value: string) => {
    if (field === "centre") setCentre(value);
    else setRegion(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate(field === "centre" ? { centre: value } : { region: value });
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasActiveFilters =
    currentSession || currentProfil || currentExamen || currentOrigine || currentCentre || currentRegion;

  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <select
          value={currentExamen || ""}
          onChange={(e) => navigate({ examen: e.target.value })}
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
          onChange={(e) => navigate({ session: e.target.value })}
          className="bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm text-text-secondary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
        >
          {SESSIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {currentExamen !== "BEPC" && currentExamen !== "CEE" && (
          <select
            value={currentProfil || ""}
            onChange={(e) => navigate({ profil: e.target.value })}
            className="bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm text-text-secondary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
          >
            {PROFILS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              router.push(`/recherche?q=${encodeURIComponent(query)}`);
            }}
            className="text-sm text-text-tertiary hover:text-text-primary transition-colors underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <input
          type="text"
          value={centre}
          onChange={(e) => handleTextChange("centre", e.target.value)}
          placeholder="Centre d'examen"
          className="bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm text-text-secondary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
        />
        {currentExamen !== "BAC" && (
          <input
            type="text"
            value={region}
            onChange={(e) => handleTextChange("region", e.target.value)}
            placeholder="Commune / région (BEPC, CEE)"
            className="bg-white border border-border-soft rounded-xl px-4 py-2.5 text-sm text-text-secondary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
          />
        )}
      </div>

      <p className="text-xs text-text-tertiary text-center max-w-[480px]">
        Aucun champ n&apos;est obligatoire, mais plus vous en renseignez, plus le résultat est précis.
      </p>
    </div>
  );
}
