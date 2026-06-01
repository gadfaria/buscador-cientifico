import { Suspense } from "react";
import Link from "next/link";
import { search, parseSearchParams } from "@/lib/federation";
import type { SearchParams } from "@/lib/federation/types";
import { SearchBox } from "@/components/search-box";
import { Facets } from "@/components/facets";
import { ResultsList } from "@/components/results-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function buildQuery(sp: SP): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
    else if (v != null) params.set(k, v);
  }
  return params.toString();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const query = buildQuery(sp);
  const params = parseSearchParams(new URLSearchParams(query));
  const hasQuery = params.q.length > 0;

  return (
    <div className="container py-8">
      <header className="mx-auto max-w-3xl text-center">
        <Link href="/" className="inline-block">
          <h1 className="font-serif text-3xl font-semibold text-primary">
            Buscador Científico
          </h1>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Teses e dissertações do Brasil — BDTD (IBICT) + Catálogo da CAPES
        </p>
        <div className="mt-5">
          <SearchBox initialQ={params.q} query={query} />
        </div>
      </header>

      {hasQuery ? (
        <Suspense key={query} fallback={<ResultsSkeleton />}>
          <Results params={params} query={query} />
        </Suspense>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

async function Results({
  params,
  query,
}: {
  params: SearchParams;
  query: string;
}) {
  const result = await search(params);

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
      <div className="hidden md:block">
        <Facets facets={result.facets} selected={params.filters} query={query} />
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <p className="text-sm text-muted-foreground">
            ~{result.total.toLocaleString("pt-BR")} resultados para{" "}
            <span className="font-medium text-foreground">“{result.query}”</span>
          </p>
          <div className="flex items-center gap-1.5">
            {result.sources.map((s) => (
              <Badge
                key={s.name}
                variant={s.ok ? "outline" : "default"}
                title={s.error ?? `${s.total} resultados · ${s.tookMs}ms`}
              >
                {s.name.toUpperCase()} {s.ok ? `· ${s.tookMs}ms` : "· indisponível"}
              </Badge>
            ))}
          </div>
        </div>

        {result.partial && (
          <p className="mb-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Uma das fontes não respondeu a tempo — resultados podem estar
            incompletos.
          </p>
        )}

        {result.hits.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Nenhum resultado encontrado.
          </p>
        ) : (
          <ResultsList hits={result.hits} />
        )}

        <Pagination
          page={params.page}
          hasMore={result.hits.length >= params.limit}
          query={query}
        />
      </section>
    </div>
  );
}

function Pagination({
  page,
  hasMore,
  query,
}: {
  page: number;
  hasMore: boolean;
  query: string;
}) {
  function href(p: number) {
    const params = new URLSearchParams(query);
    params.set("page", String(p));
    return `/?${params.toString()}`;
  }
  if (page <= 1 && !hasMore) return null;
  return (
    <nav className="mt-8 flex items-center justify-between" aria-label="Paginação">
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page - 1)}>← Anterior</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          ← Anterior
        </Button>
      )}
      <span className="text-sm text-muted-foreground">Página {page}</span>
      {hasMore ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page + 1)}>Próxima →</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Próxima →
        </Button>
      )}
    </nav>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center text-muted-foreground">
      <p className="text-sm">
        Pesquise entre centenas de milhares de teses e dissertações brasileiras.
        A busca é feita ao vivo nas fontes oficiais.
      </p>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
      <div className="hidden md:block">
        <Skeleton className="h-6 w-24" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
