import type { Metadata } from "next";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getTopLycees } from "@/lib/api";
import { EtablissementsList } from "./EtablissementsList";

export const metadata: Metadata = {
  title: "Établissements — Bac Guinée",
  description: "Parcourez les établissements guinéens et leurs résultats au Baccalauréat.",
};

export default async function EtablissementsPage() {
  let lycees: { nom: string; count: number }[] = [];
  try {
    lycees = await getTopLycees(200);
  } catch {
    lycees = [];
  }

  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[1216px] mx-auto px-4">
        <ScrollReveal className="text-center max-w-[640px] mx-auto mb-[60px]">
          <h1 className="text-[clamp(30px,4.4vw,48px)] font-semibold leading-[1.1] tracking-[-0.02em]">
            Établissements
          </h1>
          <p className="mt-4 text-lg font-light text-text-secondary">
            {lycees.length} établissements référencés, classés par nombre d&apos;admis.
          </p>
        </ScrollReveal>

        {lycees.length === 0 ? (
          <p className="text-center text-text-tertiary">Liste momentanément indisponible.</p>
        ) : (
          <EtablissementsList lycees={lycees} />
        )}
      </div>
    </section>
  );
}
