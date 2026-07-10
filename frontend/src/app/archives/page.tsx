import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getStats } from "@/lib/api";

export const metadata: Metadata = {
  title: "Archives — Résultats Bac 2020–2025 — Bac Guinée",
  description: "Consultez les archives des résultats du Baccalauréat guinéen, sessions 2020 à 2025.",
};

export default async function ArchivesPage() {
  let sessions: { session: number; count: number }[] = [];
  try {
    const stats = await getStats();
    sessions = stats.sessions.filter((s) => s.session < 2026).sort((a, b) => b.session - a.session);
  } catch {
    sessions = [];
  }

  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[1216px] mx-auto px-4">
        <ScrollReveal className="text-center max-w-[640px] mx-auto mb-[60px]">
          <h1 className="text-[clamp(30px,4.4vw,48px)] font-semibold leading-[1.1] tracking-[-0.02em]">
            Archives 2020–2025
          </h1>
          <p className="mt-4 text-lg font-light text-text-secondary">
            Retrouvez les résultats des sessions précédentes du Baccalauréat.
          </p>
        </ScrollReveal>

        {sessions.length === 0 ? (
          <p className="text-center text-text-tertiary">Archives momentanément indisponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((s, i) => (
              <ScrollReveal key={s.session} delay={i * 60}>
                <Link
                  href={`/recherche?session=${s.session}`}
                  className="block card p-7 text-center hover:shadow-[0_18px_40px_rgba(16,24,40,0.1)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="text-[40px] font-semibold tracking-[-0.02em]">{s.session}</div>
                  <div className="text-text-tertiary text-[15px] mt-1">
                    {s.count.toLocaleString()} candidat{s.count > 1 ? "s" : ""}
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
