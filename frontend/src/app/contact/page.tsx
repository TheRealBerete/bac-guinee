import { ScrollReveal } from "@/components/ScrollReveal";

export default function ContactPage() {
  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[640px] mx-auto px-4">
        <ScrollReveal>
          <h1 className="text-[clamp(34px,4.4vw,48px)] font-semibold tracking-[-0.02em] mb-8">À propos</h1>
        </ScrollReveal>

        <ScrollReveal delay={60} className="space-y-6">
          <div className="bg-white border border-border-soft rounded-[20px] p-8 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]">
            <h2 className="text-lg font-semibold mb-3">Le projet</h2>
            <p className="text-text-secondary leading-relaxed">
              Bac Guinée est une plateforme de consultation des résultats du Baccalauréat unique guinéen.
              Elle agrège les données de deux sources publiques : les PDFs publiés par <strong>guineematin.com</strong> (2020–2022)
              et l&apos;API officielle de <strong>mon-portail.gtsco-kag.org</strong> (2023–2026).
            </p>
          </div>

          <div className="bg-white border border-border-soft rounded-[20px] p-8 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]">
            <h2 className="text-lg font-semibold mb-3">Sources</h2>
            <ul className="text-text-secondary space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-dark shrink-0" />
                PDFs guineematin.com — 15 fichiers parsés, 2207 candidats (2020–2022)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-dark shrink-0" />
                API mon-portail.gtsco-kag.org — vérification par PV (2023–2026)
              </li>
            </ul>
          </div>

          <div className="bg-white border border-border-soft rounded-[20px] p-8 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)]">
            <h2 className="text-lg font-semibold mb-3">Les profils du Bac</h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary">
              <span>SS — Sciences Sociales</span>
              <span>SS-FA — Sciences Sociales Franco-Arabe</span>
              <span>SM — Sciences Mathématiques</span>
              <span>SE — Sciences Expérimentales</span>
              <span>SE-FA — Sciences Expérimentales Franco-Arabe</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
