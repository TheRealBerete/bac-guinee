import { ScrollReveal } from "./ScrollReveal";

export function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <ScrollReveal className="text-center max-w-[640px] mx-auto mb-[60px]">
      <h2 className="text-[clamp(30px,4.4vw,48px)] font-semibold leading-[1.1] tracking-[-0.02em]">{title}</h2>
      {subtitle && <p className="mt-4 text-lg font-light text-text-secondary">{subtitle}</p>}
    </ScrollReveal>
  );
}
