import { SearchBar } from "@/components/SearchBar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StatsGlobal, getStats } from "@/lib/api";

async function StatsSection() {
  let stats: StatsGlobal | null = null;
  try {
    stats = await getStats();
  } catch {
    return null;
  }

  return (
    <section id="stats" className="py-[92px] bg-white">
      <div className="max-w-[1216px] mx-auto px-4">
        <ScrollReveal className="text-center max-w-[640px] mx-auto mb-[60px]">
          <h2 className="text-[clamp(30px,4.4vw,48px)] font-semibold leading-[1.1] tracking-[-0.02em]">
            {stats.total_candidats.toLocaleString()} candidats référencés
          </h2>
          <p className="mt-4 text-lg font-light text-text-secondary">
            Résultats du Baccalauréat unique, sessions 2020–2026
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.sessions.map((s) => (
            <ScrollReveal key={s.session} delay={80}>
              <div className="bg-bg-secondary border border-border-soft rounded-[20px] p-7 text-center">
                <div className="text-[40px] font-semibold tracking-[-0.02em]">{s.count.toLocaleString()}</div>
                <div className="text-text-tertiary text-[15px] mt-1">Session {s.session}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <ScrollReveal delay={100}>
            <div className="bg-bg-secondary border border-border-soft rounded-[20px] p-7">
              <h3 className="text-lg font-semibold mb-4">Par profil</h3>
              {stats.profils.map((p) => (
                <div key={p.code} className="flex items-center justify-between py-2 border-b border-border-soft last:border-0">
                  <span className="text-text-secondary">{p.nom || p.code}</span>
                  <span className="font-semibold">{p.count}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={140}>
            <div className="bg-bg-secondary border border-border-soft rounded-[20px] p-7">
              <h3 className="text-lg font-semibold mb-4">Top établissements</h3>
              {stats.top_lycees.slice(0, 8).map((l) => (
                <div key={l.nom} className="flex items-center justify-between py-2 border-b border-border-soft last:border-0">
                  <span className="text-text-secondary text-sm truncate max-w-[70%]">{l.nom}</span>
                  <span className="font-semibold text-sm shrink-0">{l.count}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative pt-[170px] pb-[80px] bg-[url(/images/bg-gradient.svg)] bg-cover bg-top overflow-hidden">
        <div className="max-w-[1216px] mx-auto px-4 text-center">
          <ScrollReveal>
            <h1 className="text-[clamp(36px,5vw,56px)] font-semibold leading-[1.08] tracking-[-0.96px] mb-5">
              Résultats du Bac<br />Guinée
            </h1>
            <p className="text-lg text-text-secondary font-light max-w-[560px] mx-auto mb-8">
              Consultez les résultats du Baccalauréat unique par nom, numéro de PV ou établissement d&apos;origine.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <SearchBar />
          </ScrollReveal>
        </div>
      </section>

      <StatsSection />
    </>
  );
}
