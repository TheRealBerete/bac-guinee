import Link from "next/link";
import { getStats } from "@/lib/api";

export default async function StatsPage() {
  let stats;
  try {
    stats = await getStats();
  } catch {
    return (
      <section className="pt-[150px] pb-[80px]">
        <div className="max-w-[1216px] mx-auto px-4 text-center">
          <p className="text-text-secondary text-lg">Statistiques momentanément indisponibles.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[1216px] mx-auto px-4">
        <div className="text-center mb-[60px]">
          <h1 className="text-[clamp(34px,4.4vw,48px)] font-semibold tracking-[-0.02em]">Statistiques</h1>
          <p className="text-text-secondary mt-4">{stats.total_candidats.toLocaleString()} candidats référencés</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {stats.sessions.map((s) => (
            <Link
              key={s.session}
              href={`/recherche?q=&session=${s.session}`}
              className="bg-white border border-border-soft rounded-[20px] p-7 text-center hover:shadow-[0_18px_40px_rgba(16,24,40,0.1)] hover:-translate-y-1 hover:border-primary-base transition-all"
            >
              <div className="text-[40px] font-semibold tracking-[-0.02em]">{s.count.toLocaleString()}</div>
              <div className="text-text-tertiary text-[15px] mt-1">Session {s.session}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border border-border-soft rounded-[20px] p-7">
            <h2 className="text-lg font-semibold mb-4">Par profil</h2>
            {stats.profils.map((p) => (
              <Link
                key={p.code}
                href={`/recherche?q=&profil=${p.code}`}
                className="flex items-center justify-between py-2.5 border-b border-border-soft last:border-0 hover:text-primary-dark transition-colors"
              >
                <span className="text-text-secondary">{p.nom || p.code}</span>
                <span className="font-semibold">{p.count}</span>
              </Link>
            ))}
          </div>

          <div className="bg-white border border-border-soft rounded-[20px] p-7">
            <h2 className="text-lg font-semibold mb-4">Top établissements</h2>
            {stats.top_lycees.map((l) => (
              <Link
                key={l.nom}
                href={`/lycee/${encodeURIComponent(l.nom)}`}
                className="flex items-center justify-between py-2.5 border-b border-border-soft last:border-0 hover:text-primary-dark transition-colors"
              >
                <span className="text-text-secondary text-sm truncate max-w-[70%]">{l.nom}</span>
                <span className="font-semibold text-sm shrink-0">{l.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
