import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate } from "@/lib/api";
import { ShareActions } from "@/components/ShareActions";
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
    const imageUrl = `/candidat/${numId}/image`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
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
          <div className="flex flex-col items-center text-center mb-8 pb-8 border-b border-border-soft">
            <div className="w-14 h-14 rounded-2xl bg-primary-dark flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="text-text-tertiary text-sm font-semibold tracking-wide uppercase mb-2">
              Résultat officiel confirmé
            </p>
            <h1 className="text-3xl font-semibold">{candidate.nom_complet}</h1>
            <p className="text-text-tertiary mt-1">PV {candidate.pv} · Session {candidate.session}</p>
            {candidate.mention && (
              <span className={`mt-4 text-base font-semibold px-4 py-2 rounded-full ${MENTION_STYLES[candidate.mention] || MENTION_FALLBACK}`}>
                Mention {candidate.mention}
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

          <div className="mt-6 pt-6 border-t border-border-soft">
            <ShareActions
              text={`J'ai décroché mon Bac ${candidate.session} ! Résultat de ${candidate.nom_complet} :`}
              imageUrl={`/candidat/${candidate.id}/image`}
              fileName={`resultat-bac-${candidate.nom_complet.trim().toLowerCase().replace(/\s+/g, "-")}.png`}
            />
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
