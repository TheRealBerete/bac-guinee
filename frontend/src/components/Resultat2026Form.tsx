"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Resultat2026Form() {
  const [pv, setPv] = useState("");
  const [ecole, setEcole] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pv.trim() && !ecole.trim()) return;

    const params = new URLSearchParams({ session: "2026" });
    if (pv.trim()) params.set("q", pv.trim());
    if (ecole.trim()) params.set("origine", ecole.trim());
    router.push(`/recherche?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[640px] mx-auto bg-white border-2 border-border-soft rounded-[20px] p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]"
    >
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
          value={ecole}
          onChange={(e) => setEcole(e.target.value)}
          placeholder="École d'origine"
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
        Renseignez le PV, l&apos;école, ou les deux
      </p>
    </form>
  );
}
