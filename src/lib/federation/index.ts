import { searchBdtd, recordBdtd } from "./bdtd";
import { searchCapes } from "./capes";
import { getOrSet } from "./cache";
import { config } from "./config";
import { mergeResults } from "./merge";
import type {
  SearchParams,
  SearchResult,
  SourceName,
  SourceSearchResponse,
  SourceStatus,
  Thesis,
} from "./types";

export type { SearchParams, SearchResult, Thesis } from "./types";

const DEFAULT_LIMIT = 20;

/** Normaliza/saneia parâmetros vindos da query string. */
export function parseSearchParams(sp: URLSearchParams): SearchParams {
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT));
  return {
    q: (sp.get("q") ?? "").trim(),
    page,
    limit,
    sort: sp.get("sort") ?? undefined,
    filters: {
      institution: sp.getAll("institution"),
      year: sp.getAll("year"),
      type: sp.getAll("type"),
    },
  };
}

function cacheKey(p: SearchParams): string {
  return `search:${JSON.stringify(p)}`;
}

type Searcher = (p: SearchParams) => Promise<SourceSearchResponse>;

const SEARCHERS: Record<SourceName, Searcher> = {
  bdtd: searchBdtd,
  capes: searchCapes,
};

/**
 * Busca federada: scatter-gather nas fontes com timeout por fonte,
 * merge/dedup em memória, cache Redis. Uma fonte lenta ou fora do ar
 * não derruba a busca (Promise.allSettled + status por fonte).
 */
export async function search(p: SearchParams): Promise<SearchResult> {
  if (!p.q) {
    return {
      query: "",
      total: 0,
      page: p.page,
      limit: p.limit,
      hits: [],
      facets: {},
      sources: [],
      partial: false,
    };
  }

  return getOrSet(cacheKey(p), config.cacheTtlSeconds, async () => {
    const names = Object.keys(SEARCHERS) as SourceName[];
    const settled = await Promise.allSettled(
      names.map(async (name): Promise<{ status: SourceStatus; data: SourceSearchResponse }> => {
        const started = Date.now();
        try {
          const data = await SEARCHERS[name](p);
          return {
            status: { name, ok: true, total: data.total, tookMs: Date.now() - started },
            data,
          };
        } catch (err) {
          return {
            status: {
              name,
              ok: false,
              total: 0,
              tookMs: Date.now() - started,
              error: err instanceof Error ? err.message : String(err),
            },
            data: { source: name, total: 0, hits: [], facets: {} },
          };
        }
      }),
    );

    const statuses: SourceStatus[] = [];
    const responses: SourceSearchResponse[] = [];
    for (const r of settled) {
      if (r.status === "fulfilled") {
        statuses.push(r.value.status);
        responses.push(r.value.data);
      }
    }

    const merged = mergeResults(responses);
    return {
      query: p.q,
      total: merged.total,
      page: p.page,
      limit: p.limit,
      hits: merged.hits,
      facets: merged.facets,
      sources: statuses,
      partial: statuses.some((s) => !s.ok),
    };
  });
}

/** Detalhe de um registro. Roteia pela fonte embutida no id canônico. */
export async function getRecord(canonicalId: string): Promise<Thesis | null> {
  const [source, ...rest] = canonicalId.split(":");
  const rawId = rest.join(":");
  if (source === "bdtd") {
    return getOrSet(`record:${canonicalId}`, config.cacheTtlSeconds, () =>
      recordBdtd(rawId),
    );
  }
  // CAPES: o DataStore não tem endpoint de registro único trivial;
  // numa v1 o detalhe da CAPES pode ser reconstruído da própria busca.
  return null;
}
