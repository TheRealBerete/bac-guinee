import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionHead } from "@/components/SectionHead";
import { Illustration } from "@/components/Illustration";
import { HeroMarquee } from "@/components/HeroMarquee";
import { Resultat2026Form } from "@/components/Resultat2026Form";
import Link from "next/link";
import { StatsGlobal, getStats } from "@/lib/api";
import { EXAMEN_LABELS, EXAMEN_DISPONIBLE } from "@/lib/examens";

const MARQUEE_IMAGES = [
  { src: "/illustrations/lyceens-en-examens.webp", alt: "Lycéens en salle d'examen" },
  { src: "/illustrations/cover-lycens-en-exams.webp", alt: "Lycéens en salle d'examen" },
  { src: "/illustrations/cours-de-recree-joyeux.webp", alt: "Élèves pendant la récréation" },
  { src: "/illustrations/montee-des-couleurs.webp", alt: "Cérémonie de montée des couleurs au lycée" },
  { src: "/illustrations/professeurs-et-eleves.webp", alt: "Professeurs et élèves dans la cour" },
  { src: "/illustrations/joyeux-en-famille-resultats.webp", alt: "Famille consultant un résultat sur téléphone" },
];

const STEPS = [
  {
    title: "Recherchez",
    text: "Entrez un nom, un numéro de PV ou un établissement d'origine.",
    image: "/illustrations/step-1.webp",
  },
  {
    title: "Consultez",
    text: "Accédez à la fiche complète : mention, rang, session, établissement.",
    image: "/illustrations/step-2.webp",
  },
  {
    title: "Partagez",
    text: "Envoyez le résultat par WhatsApp en un clic depuis la fiche.",
    image: "/illustrations/step-3.webp",
  },
];

async function StatsSection() {
  let stats: StatsGlobal | null = null;
  try {
    stats = await getStats();
  } catch {
    return null;
  }

  const sessions = [...stats.sessions].sort((a, b) => b.session - a.session);
  const session2026 = sessions.find((s) => s.session === 2026);
  const otherSessions = sessions.filter((s) => s.session !== 2026);

  return (
    <section id="stats" className="py-[92px] bg-white">
      <div className="max-w-[1216px] mx-auto px-4">
        <SectionHead
          title={`${stats.total_candidats.toLocaleString()} candidats référencés`}
          subtitle="Résultats du Baccalauréat unique, sessions 2020–2026"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {session2026 && (
            <ScrollReveal>
              <div className="bg-primary-dark rounded-[20px] p-7 text-center text-white shadow-[0_18px_40px_rgba(140,113,246,0.25)]">
                <div className="text-[40px] font-semibold tracking-[-0.02em]">{session2026.count.toLocaleString()}</div>
                <div className="text-white/80 text-[15px] mt-1">Session 2026 — la plus récente</div>
              </div>
            </ScrollReveal>
          )}
          {otherSessions.map((s) => (
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
      <section className="relative pt-[170px] pb-[100px] overflow-hidden">
        <HeroMarquee images={MARQUEE_IMAGES} />

        <div className="relative z-10 max-w-[1216px] mx-auto px-4">
          <div className="text-center max-w-[720px] mx-auto">
            <ScrollReveal>
              <h1 className="text-[clamp(36px,5vw,56px)] font-semibold leading-[1.08] tracking-[-0.96px] mb-5">
                Résultats 2026<br />disponibles maintenant
              </h1>
              <p className="text-lg text-text-secondary font-light max-w-[560px] mx-auto mb-8">
                Retrouvez votre résultat avec votre numéro de PV ou votre école d&apos;origine.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Resultat2026Form />
              <Link
                href="/archives"
                className="inline-block mt-4 text-sm text-text-secondary hover:text-text-primary underline transition-colors"
              >
                Résultat plus ancien ? Consultez les archives 2020–2025
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="py-[92px] bg-bg-secondary">
        <div className="max-w-[1216px] mx-auto px-4">
          <SectionHead title="Comment ça marche" subtitle="Trois étapes pour retrouver un résultat" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 80}>
                <div className="card p-6">
                  <Illustration src={step.image} alt={step.title} className="aspect-video mb-5" />
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-text-secondary text-sm">{step.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-[92px] bg-white">
        <div className="max-w-[800px] mx-auto px-4 text-center">
          <SectionHead
            title="Un examen aujourd'hui, bientôt plus"
            subtitle="La plateforme est conçue pour couvrir plusieurs examens guinéens"
          />
          <ScrollReveal>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.entries(EXAMEN_LABELS).map(([code, label]) => (
                <div
                  key={code}
                  className={`px-6 py-4 rounded-[16px] border ${
                    EXAMEN_DISPONIBLE[code]
                      ? "border-primary-dark bg-primary-dark/5"
                      : "border-border-soft bg-bg-secondary text-text-tertiary"
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs mt-1">
                    {EXAMEN_DISPONIBLE[code] ? "Disponible" : "Bientôt disponible"}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <StatsSection />

      <section className="py-[92px] bg-bg-secondary">
        <div className="max-w-[640px] mx-auto px-4 text-center">
          <ScrollReveal>
            <h2 className="text-[clamp(26px,3.6vw,36px)] font-semibold tracking-[-0.02em] mb-4">
              Consultez les archives 2020–2025
            </h2>
            <p className="text-text-secondary mb-8">
              Retrouvez les résultats des sessions précédentes du Baccalauréat.
            </p>
            <Link
              href="/archives"
              className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-primary-dark text-white font-medium hover:brightness-110 transition-all duration-200"
            >
              Voir les archives
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
