import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLycee } from "@/lib/api";
import { MENTION_FALLBACK, MENTION_STYLES, PROFIL_FALLBACK, PROFIL_STYLES } from "@/lib/badges";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nom: string }>;
}): Promise<Metadata> {
  const { nom } = await params;

  try {
    const stats = await getLycee(decodeURIComponent(nom));
    const title = `Résultats Bac — Lycée ${stats.lycee} — ${stats.total_admis} admis`;
    const description = `Statistiques du Baccalauréat pour ${stats.lycee} : ${stats.total_admis} candidats admis, résultats par session et par mention.`;

    return {
      title,
      description,
      openGraph: { title, description },
    };
  } catch {
    return {};
  }
}

export default async function LyceePage({
  params,
}: {
  params: Promise<{ nom: string }>;
}) {
  const { nom } = await params;

  let stats;
  try {
    stats = await getLycee(decodeURIComponent(nom));
  } catch {
    notFound();
  }

  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[800px] mx-auto px-4">
        <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour
        </Link>

        <div className="card p-8 mb-8">
          <h1 className="text-2xl font-semibold mb-2">{stats.lycee}</h1>
          <p className="text-text-secondary">{stats.total_admis} candidat{stats.total_admis > 1 ? "s" : ""} admis</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Par session</h2>
              {stats.par_session.map((s) => (
                <div key={s.session} className="flex items-center justify-between py-2 border-b border-border-soft last:border-0">
                  <span className="text-text-secondary">{s.session}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Par mention</h2>
              {stats.par_mention.length === 0 ? (
                <p className="text-text-tertiary text-sm">Aucune mention enregistrée</p>
              ) : (
                stats.par_mention.map((m) => (
                  <div key={m.mention} className="flex items-center justify-between py-2 border-b border-border-soft last:border-0">
                    <span className="text-text-secondary">{m.mention || "Sans mention"}</span>
                    <span className="font-semibold">{m.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {stats.candidats.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Admis</h2>
            <div className="grid gap-3">
              {stats.candidats.map((c) => (
                <Link
                  key={c.id}
                  href={`/candidat/${c.id}`}
                  className="flex items-center justify-between bg-white border border-border-soft rounded-[16px] p-4 hover:shadow-[0_8px_24px_rgba(16,24,40,0.06)] hover:border-primary-base transition-all"
                >
                  <div className="min-w-0">
                    <span className="font-medium truncate block">{c.nom_complet}</span>
                    <span className="text-text-tertiary text-sm">PV {c.pv} · Session {c.session}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {c.mention && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MENTION_STYLES[c.mention] || MENTION_FALLBACK}`}>
                        {c.mention}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROFIL_STYLES[c.profil] || PROFIL_FALLBACK}`}>{c.profil}</span>
                    {c.rang && c.rang > 0 && (
                      <span className="text-text-tertiary text-xs">{c.rang}<sup>e</sup></span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
