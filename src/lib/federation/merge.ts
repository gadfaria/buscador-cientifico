import type {
  FacetBucket,
  SourceName,
  SourceSearchResponse,
  Thesis,
} from "./types";

/*
  Merge + dedup em memória (query-time). É aqui que mora o custo da
  federação pura: sem ID comum entre BDTD e CAPES, casamos por
  (título normalizado + primeiro autor + ano). Heurístico e imperfeito
  por natureza — um índice próprio resolveria isso no ETL.

  Política: BDTD é master (tem resumo + link). CAPES enriquece campos
  ausentes (área de avaliação, região, nº de páginas, programa).
*/

const SOURCE_PRIORITY: Record<SourceName, number> = { bdtd: 0, capes: 1 };

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (diacríticos combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupKey(t: Thesis): string {
  const title = normalize(t.title).slice(0, 80);
  const author = t.authors[0] ? normalize(t.authors[0]).split(" ")[0] : "";
  const year = t.year ?? "";
  return `${title}|${author}|${year}`;
}

/** Preenche em `master` os campos vazios usando `extra`. */
function enrich(master: Thesis, extra: Thesis): Thesis {
  return {
    ...master,
    abstract: master.abstract ?? extra.abstract,
    advisors: master.advisors ?? extra.advisors,
    institution: master.institution ?? extra.institution,
    program: master.program ?? extra.program,
    knowledgeArea: master.knowledgeArea ?? extra.knowledgeArea,
    evaluationArea: master.evaluationArea ?? extra.evaluationArea,
    region: master.region ?? extra.region,
    pages: master.pages ?? extra.pages,
    type: master.type ?? extra.type,
    language: master.language ?? extra.language,
    documentUrl: master.documentUrl ?? extra.documentUrl,
    year: master.year ?? extra.year,
    sources: Array.from(new Set([...master.sources, ...extra.sources])),
    sourceIds: { ...extra.sourceIds, ...master.sourceIds },
  };
}

interface Ranked {
  thesis: Thesis;
  rank: number; // posição na lista de origem
  priority: number; // 0 = BDTD (master), 1 = CAPES
}

function mergeFacets(
  sources: SourceSearchResponse[],
): Record<string, FacetBucket[]> {
  const acc: Record<string, Map<string, FacetBucket>> = {};
  for (const s of sources) {
    for (const [key, buckets] of Object.entries(s.facets)) {
      acc[key] ??= new Map();
      for (const b of buckets) {
        const cur = acc[key].get(b.value);
        if (cur) cur.count += b.count;
        else acc[key].set(b.value, { ...b });
      }
    }
  }
  const out: Record<string, FacetBucket[]> = {};
  for (const [key, map] of Object.entries(acc)) {
    out[key] = [...map.values()].sort((a, b) => b.count - a.count);
  }
  return out;
}

export interface MergeOutput {
  hits: Thesis[];
  facets: Record<string, FacetBucket[]>;
  /**
   * Total agregado é APROXIMADO (upper bound): soma os totais por fonte,
   * então conta em duplicidade teses presentes nas duas. Os totais reais
   * por fonte ficam em SearchResult.sources[].
   */
  total: number;
}

export function mergeResults(sources: SourceSearchResponse[]): MergeOutput {
  // Ordena fontes por prioridade pra BDTD ser sempre o master no merge.
  const ordered = [...sources].sort(
    (a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source],
  );

  const byKey = new Map<string, Ranked>();
  for (const src of ordered) {
    src.hits.forEach((thesis, i) => {
      const key = dedupKey(thesis);
      const existing = byKey.get(key);
      if (existing) {
        existing.thesis = enrich(existing.thesis, thesis);
      } else {
        byKey.set(key, {
          thesis,
          rank: i,
          priority: SOURCE_PRIORITY[src.source],
        });
      }
    });
  }

  // Ordena: master primeiro, depois pelo rank de origem.
  const hits = [...byKey.values()]
    .sort((a, b) => a.priority - b.priority || a.rank - b.rank)
    .map((r) => r.thesis);

  return {
    hits,
    facets: mergeFacets(sources),
    total: sources.reduce((sum, s) => sum + s.total, 0),
  };
}
