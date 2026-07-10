import Link from "next/link";

export default function NotFound() {
  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[640px] mx-auto px-4 text-center">
        <div className="card p-10">
          <h1 className="text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em]">
            Page introuvable
          </h1>
          <p className="mt-4 text-text-secondary">
            Le résultat, le lycée ou la page que vous cherchez n&apos;existe pas ou a été déplacé.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center mt-8 px-6 py-3 rounded-[10px] bg-primary-dark text-white font-medium hover:brightness-110 transition-all duration-200"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
