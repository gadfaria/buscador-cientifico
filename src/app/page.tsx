import { Suspense } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import { search, parseSearchParams } from "@/lib/federation";
import type { SearchParams, SourceName } from "@/lib/federation/types";
import { SearchBox } from "@/components/search-box";
import { AddToCollectionButton } from "@/components/add-to-collection-button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const SOURCE_LABEL: Record<SourceName, string> = {
  bdtd: "BDTD (IBICT)",
  capes: "Catálogo CAPES",
};

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
        <div className="flex items-center justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href="/colecao">
              <Library className="h-4 w-4" /> Minha coleção
            </Link>
          </Button>
        </div>
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
        <Suspense key={query} fallback={<CountsSkeleton />}>
          <Counts params={params} query={query} />
        </Suspense>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

async function Counts({
  params,
  query,
}: {
  params: SearchParams;
  query: string;
}) {
  // Só as contagens por fonte — barato (limit=1). O lote vem no botão.
  const result = await search({ ...params, limit: 1 });
  const totalOk = result.sources.some((s) => s.ok && s.total > 0);

  return (
    <section className="mx-auto mt-10 max-w-3xl">
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Resultados para{" "}
        <span className="font-medium text-foreground">“{result.query}”</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {result.sources.map((s) => (
          <Card key={s.name}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                {SOURCE_LABEL[s.name]}
              </p>
              {s.ok ? (
                <p className="mt-1 font-serif text-3xl font-semibold text-primary">
                  {s.total.toLocaleString("pt-BR")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-rose-600">indisponível</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {s.ok ? `respondeu em ${s.tookMs}ms` : s.error}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        {totalOk ? (
          <AddToCollectionButton query={query} cap={100} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum resultado encontrado.
          </p>
        )}
        {totalOk && (
          <p className="text-xs text-muted-foreground">
            Traz os 100 resultados mais relevantes para a sua coleção.
          </p>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center text-muted-foreground">
      <p className="text-sm">
        Pesquise entre centenas de milhares de teses e dissertações brasileiras.
        A busca é feita ao vivo nas fontes oficiais; os resultados que interessam
        você guarda e gerencia na sua coleção.
      </p>
    </div>
  );
}

function CountsSkeleton() {
  return (
    <section className="mx-auto mt-10 max-w-3xl">
      <Skeleton className="mx-auto mb-4 h-4 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="mx-auto mt-6 h-11 w-72" />
    </section>
  );
}
