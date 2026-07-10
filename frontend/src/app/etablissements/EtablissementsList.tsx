"use client";

import { useState } from "react";
import Link from "next/link";

export function EtablissementsList({ lycees }: { lycees: { nom: string; count: number }[] }) {
  const [filter, setFilter] = useState("");

  const filtered = filter.trim()
    ? lycees.filter((l) => l.nom.toLowerCase().includes(filter.trim().toLowerCase()))
    : lycees;

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrer par nom d'établissement..."
        className="w-full max-w-[480px] mx-auto block bg-white border border-border-soft rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-dark transition-colors mb-8"
      />

      {filtered.length === 0 ? (
        <p className="text-center text-text-tertiary">Aucun établissement ne correspond à ce filtre.</p>
      ) : (
        <div className="max-w-[800px] mx-auto grid gap-3">
          {filtered.map((l) => (
            <Link
              key={l.nom}
              href={`/lycee/${encodeURIComponent(l.nom)}`}
              className="flex items-center justify-between bg-white border border-border-soft rounded-[16px] p-4 hover:shadow-[0_8px_24px_rgba(16,24,40,0.06)] hover:border-primary-base transition-all"
            >
              <span className="font-medium truncate">{l.nom}</span>
              <span className="text-text-tertiary text-sm shrink-0 ml-4">
                {l.count.toLocaleString()} admis
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
