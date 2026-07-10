import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/api";
import { ShareButton } from "@/components/ShareButton";
import { MENTION_FALLBACK, MENTION_STYLES } from "@/lib/badges";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return {};

  try {
    const candidate = await getCandidate(numId);
    const title = `${candidate.nom_complet} — Résultat Bac ${candidate.session} ${candidate.profil}`;
    const description = `Résultat du Baccalauréat ${candidate.session} pour ${candidate.nom_complet} (PV ${candidate.pv}), profil ${
      candidate.profil_nom || candidate.profil
    }${candidate.mention ? `, mention ${candidate.mention}` : ""}.`;

    return {
      title,
      description,
      openGraph: { title, description },
    };
  } catch {
    return {};
  }
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) notFound();

  let candidate;
  try {
    candidate = await getCandidate(numId);
  } catch {
    notFound();
  }

  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[640px] mx-auto px-4">
        <Link href="/recherche?q=" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour à la recherche
        </Link>

        <div className="card p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold">{candidate.nom_complet}</h1>
              <p className="text-text-tertiary mt-1">PV {candidate.pv}</p>
            </div>
            {candidate.mention && (
              <span className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-full ${MENTION_STYLES[candidate.mention] || MENTION_FALLBACK}`}>
                {candidate.mention}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Info label="Session" value={candidate.session} />
            <Info label="Profil" value={`${candidate.profil} - ${candidate.profil_nom || ""}`} />
            {candidate.rang !== null && candidate.rang > 0 && (
              <Info label="Rang national" value={`${candidate.rang}e`} />
            )}
            {candidate.origine && (
              <div className="col-span-2">
                <div className="text-text-tertiary text-[13px]">Établissement d&apos;origine</div>
                <Link href={`/lycee/${encodeURIComponent(candidate.origine)}`} className="font-medium text-primary-dark hover:underline">
                  {candidate.origine}
                </Link>
              </div>
            )}
            {candidate.centre && <Info label="Centre d&apos;examen" value={candidate.centre} />}
            <Info label="Examen" value={candidate.examen} />
            <Info label="Source" value={candidate.source === "guineematin" ? "guineematin.com (PDF)" : "mon-portail.gtsco-kag.org (API)"} />
          </div>

          <div className="mt-6 pt-6 border-t border-border-soft flex justify-center">
            <ShareButton text={`Résultat Bac ${candidate.session} : ${candidate.nom_complet} (${candidate.profil})`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-text-tertiary text-[13px]">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}
