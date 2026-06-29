import { Suspense } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CandidateCard } from "@/components/CandidateCard";
import { Filters } from "./Filters";
import type { SearchResult } from "@/lib/api";
import { search } from "@/lib/api";

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 max-w-[800px] mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-border-soft rounded-[20px] p-6 animate-pulse">
          <div className="h-5 bg-bg-tertiary rounded w-1/3 mb-3" />
          <div className="h-4 bg-bg-tertiary rounded w-1/4 mb-2" />
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

async function Results({ query, session, profil }: { query: string; session?: number; profil?: string }) {
  let data: SearchResult | null = null;
  let error = false;

  try {
    data = await search({ q: query, session, profil, limit: 50 });
  } catch {
    error = true;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">Service momentanément indisponible.</p>
        <p className="text-text-tertiary mt-2">Veuillez réessayer dans quelques instants.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-[800px] mx-auto">
      <p className="text-text-secondary mb-6 text-center">
        {data.total} résultat{data.total !== 1 ? "s" : ""} pour &quot;{data.query}&quot;
      </p>
      {data.results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">Aucun résultat trouvé.</p>
          <p className="text-text-tertiary mt-2">Vérifiez l&apos;orthographe ou essayez un autre terme.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.results.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; session?: string; profil?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const session = params.session ? parseInt(params.session, 10) : undefined;
  const profil = params.profil || undefined;

  return (
    <section className="pt-[150px] pb-[80px]">
      <div className="max-w-[1216px] mx-auto px-4">
        <div className="mb-8">
          <SearchBar />
        </div>

        {query ? (
          <>
            <Filters query={query} currentSession={session} currentProfil={profil} />
            <Suspense fallback={<LoadingSkeleton />}>
              <Results query={query} session={session} profil={profil} />
            </Suspense>
          </>
        ) : (
          <p className="text-center text-text-tertiary mt-8">
            Entrez un nom, un PV ou un établissement pour lancer la recherche.
          </p>
        )}
      </div>
    </section>
  );
}
