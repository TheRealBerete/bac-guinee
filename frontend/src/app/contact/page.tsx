import { ScrollReveal } from "@/components/ScrollReveal";

export default function ContactPage() {
  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[640px] mx-auto px-4">
        <ScrollReveal>
          <h1 className="text-[clamp(34px,4.4vw,48px)] font-semibold tracking-[-0.02em] mb-8">À propos</h1>
        </ScrollReveal>

        <ScrollReveal delay={60} className="space-y-6">
          <div className="card p-8">
            <h2 className="text-lg font-semibold mb-3">Le projet</h2>
            <p className="text-text-secondary leading-relaxed">
              Bac Guinée est une plateforme de consultation des résultats du Baccalauréat unique guinéen,
              avec une couverture complète des sessions 2020 à 2026.
            </p>
          </div>

          <div className="card p-8">
            <h2 className="text-lg font-semibold mb-3">Les profils du Bac</h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary">
              <span>SS — Sciences Sociales</span>
              <span>SS-FA — Sciences Sociales Franco-Arabe</span>
              <span>SM — Sciences Mathématiques</span>
              <span>SE — Sciences Expérimentales</span>
              <span>SE-FA — Sciences Expérimentales Franco-Arabe</span>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-lg font-semibold mb-3">Questions fréquentes</h2>
            <div className="space-y-5 text-sm">
              <div>
                <h3 className="font-medium text-text-primary mb-1">Qu&apos;est-ce qu&apos;un PV ?</h3>
                <p className="text-text-secondary leading-relaxed">
                  Le PV (procès-verbal) est le numéro unique attribué à chaque candidat pour une session
                  donnée. C&apos;est le moyen le plus fiable de retrouver un résultat précis.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Qu&apos;est-ce qu&apos;un profil ?</h3>
                <p className="text-text-secondary leading-relaxed">
                  Le profil désigne la filière suivie par le candidat (SS, SM, SE, ou leurs variantes
                  Franco-Arabe). Il conditionne les épreuves passées et le calcul de la mention.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">Qu&apos;est-ce qu&apos;une mention ?</h3>
                <p className="text-text-secondary leading-relaxed">
                  La mention (Passable, Assez Bien, Bien, Très Bien) reflète le niveau de la moyenne
                  obtenue par le candidat admis.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">
                  Pourquoi le BEPC et le CEE ne sont-ils pas encore disponibles ?
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  La plateforme est conçue pour accueillir plusieurs examens guinéens. Le BEPC et le CEE
                  seront ajoutés dès que leurs résultats seront disponibles sur la plateforme.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
