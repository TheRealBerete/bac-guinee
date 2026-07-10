import Link from "next/link";
import { MENTION_FALLBACK, MENTION_STYLES, PROFIL_FALLBACK, PROFIL_STYLES } from "@/lib/badges";

interface Candidate {
  id: number;
  nom: string;
  prenom: string | null;
  nom_complet: string;
  pv: string;
  rang: number | null;
  mention: string | null;
  session: number;
  profil: string;
  profil_nom: string | null;
  origine: string | null;
  centre: string | null;
  source: string;
}

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link
      href={`/candidat/${candidate.id}`}
      className="block bg-white border border-border-soft rounded-[20px] p-6 transition-all duration-300 hover:shadow-[0_18px_40px_rgba(16,24,40,0.1)] hover:-translate-y-1 hover:border-primary-base"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate">{candidate.nom_complet}</h3>
          <p className="text-text-tertiary text-sm mt-0.5">
            PV {candidate.pv} · Session {candidate.session}
          </p>
          {candidate.origine && (
            <p className="text-text-secondary text-sm mt-1 truncate">{candidate.origine}</p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {candidate.mention && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${MENTION_STYLES[candidate.mention] || MENTION_FALLBACK}`}>
              {candidate.mention}
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PROFIL_STYLES[candidate.profil] || PROFIL_FALLBACK}`}>
            {candidate.profil}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-soft text-sm">
        {candidate.rang !== null && candidate.rang > 0 && (
          <span className="text-text-secondary">
            Rang <span className="font-semibold text-text-primary">{candidate.rang}<sup>e</sup></span>
          </span>
        )}
        <span className="text-text-tertiary text-xs ml-auto">
          Source: {candidate.source === "guineematin" ? "guineematin.com" : "gtsco-kag.org"}
        </span>
      </div>
    </Link>
  );
}
