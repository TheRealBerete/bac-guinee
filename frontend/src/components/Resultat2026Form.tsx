"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXAMEN_2026_DISPONIBLE, EXAMEN_LABELS } from "@/lib/examens";

const EXAMENS_2026 = Object.entries(EXAMEN_2026_DISPONIBLE)
  .filter(([, disponible]) => disponible)
  .map(([code]) => code);

export function Resultat2026Form() {
  const [examen, setExamen] = useState(EXAMENS_2026[0] || "");
  const [pv, setPv] = useState("");
  // BEPC/CEE n'ont pas de filière, mais ont une région (IRE/DPE) qui sert de
  // repère équivalent à l'école pour le Bac — un seul champ texte dont le
  // sens change selon l'examen sélectionné, plutôt que deux champs séparés.
  const [secondField, setSecondField] = useState("");
  const router = useRouter();
  const isRegionExam = examen === "BEPC" || examen === "CEE";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pv.trim() && !secondField.trim()) return;

    const params = new URLSearchParams({ session: "2026" });
    if (examen) params.set("examen", examen);
    if (pv.trim()) params.set("q", pv.trim());
    if (secondField.trim()) params.set(isRegionExam ? "region" : "origine", secondField.trim());
    router.push(`/recherche?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[640px] mx-auto bg-white border-2 border-border-soft rounded-[20px] p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <select
        value={examen}
        onChange={(e) => {
          setExamen(e.target.value);
          setSecondField("");
        }}
        className="w-full mb-3 bg-bg-secondary border border-border-soft rounded-xl px-4 py-3 text-text-primary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
      >
        {EXAMENS_2026.map((code) => (
          <option key={code} value={code}>
            {EXAMEN_LABELS[code] || code}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={pv}
          onChange={(e) => setPv(e.target.value)}
          placeholder="Numéro de PV"
          className="bg-bg-secondary border border-border-soft rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
        />
        <input
          type="text"
          value={secondField}
          onChange={(e) => setSecondField(e.target.value)}
          placeholder={isRegionExam ? "Région" : "École d'origine"}
          className="bg-bg-secondary border border-border-soft rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-dark transition-colors font-[family-name:var(--font-sans)]"
        />
      </div>
      <button
        type="submit"
        className="w-full mt-3 px-6 py-3 rounded-[10px] bg-primary-dark text-white font-medium hover:brightness-110 transition-all duration-200"
      >
        Voir les résultats 2026
      </button>
      <p className="text-center text-text-tertiary text-sm mt-3">
        Le PV seul suffit, mais renseigner {isRegionExam ? "la région" : "l'école"} rend le résultat plus précis.
      </p>
    </form>
  );
}
