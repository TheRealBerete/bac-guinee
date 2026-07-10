"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[640px] mx-auto px-4 text-center">
        <div className="card p-10">
          <h1 className="text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.02em]">
            Une erreur est survenue
          </h1>
          <p className="mt-4 text-text-secondary">
            Le service est momentanément indisponible. Réessayez dans quelques instants.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center mt-8 px-6 py-3 rounded-[10px] bg-primary-dark text-white font-medium hover:brightness-110 transition-all duration-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    </section>
  );
}
