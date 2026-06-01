import { config } from "./config";
import { fetchJson } from "./http";
import type {
  SearchParams,
  SourceSearchResponse,
  Thesis,
  ThesisType,
} from "./types";

/*
  Adapter da CAPES sobre a DataStore API do CKAN (portal de dados abertos):
    GET /datastore_search?resource_id=R&q=...&limit=...&offset=...

  Particularidades:
  - Os dados são fatiados por período; cada período é um resource_id próprio.
    A busca faz fan-out em paralelo sobre config.capesResourceIds e mescla.
  - CAPES traz só metadados/estatística: SEM resumo e SEM link full-text.
  - O `q` do CKAN é match básico (full-text simples), relevância fraca.
  - O DataStore não devolve facets; ficam por conta da BDTD.

  ATENÇÃO: os nomes de coluna variam por resource/ano. O mapeamento abaixo
  testa vários candidatos e usa o primeiro presente — VALIDAR contra um
  resource real (datastore_search com limit=1 mostra os fields).
*/

interface CkanRecord {
  _id?: number | string;
  [col: string]: unknown;
}

interface CkanSearchResponse {
  success?: boolean;
  result?: {
    total?: number;
    records?: CkanRecord[];
    fields?: Array<{ id: string; type: string }>;
  };
}

// Candidatos de coluna por campo canônico (primeiro presente vence).
const COLS = {
  title: ["NM_PRODUCAO", "DS_TITULO_TESE", "NM_TITULO", "TITULO"],
  author: ["NM_DISCENTE", "NM_AUTOR", "AUTOR"],
  year: ["AN_BASE", "NR_ANO", "ANO_BASE"],
  institution: ["NM_ENTIDADE_ENSINO", "SG_ENTIDADE_ENSINO", "NM_IES"],
  program: ["NM_PROGRAMA", "NM_PROGRAMA_IES"],
  knowledgeArea: ["NM_GRANDE_AREA_CONHECIMENTO", "NM_AREA_CONHECIMENTO"],
  evaluationArea: ["NM_AREA_AVALIACAO"],
  region: ["NM_REGIAO"],
  pages: ["NR_PAGINAS", "NR_VOLUME"],
  grau: ["NM_GRAU_ACADEMICO", "DS_GRAU_ACADEMICO", "NM_GRAU"],
} as const;

function pick(rec: CkanRecord, candidates: readonly string[]): string | undefined {
  for (const c of candidates) {
    const v = rec[c];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

function detectType(grau?: string): ThesisType | undefined {
  if (!grau) return undefined;
  const g = grau.toLowerCase();
  if (g.includes("doutor")) return "tese";
  if (g.includes("mestr")) return "dissertacao";
  return "outro";
}

function mapRecord(rec: CkanRecord, resourceId: string): Thesis {
  const id = String(rec._id ?? Math.random().toString(36).slice(2));
  const yearStr = pick(rec, COLS.year);
  const pagesStr = pick(rec, COLS.pages);
  const author = pick(rec, COLS.author);

  return {
    id: `capes:${resourceId}:${id}`,
    title: pick(rec, COLS.title) ?? "(sem título)",
    authors: author ? [author] : [],
    year: yearStr ? parseInt(yearStr, 10) || undefined : undefined,
    institution: pick(rec, COLS.institution),
    program: pick(rec, COLS.program),
    knowledgeArea: pick(rec, COLS.knowledgeArea),
    evaluationArea: pick(rec, COLS.evaluationArea),
    region: pick(rec, COLS.region),
    pages: pagesStr ? parseInt(pagesStr, 10) || undefined : undefined,
    type: detectType(pick(rec, COLS.grau)),
    sources: ["capes"],
    sourceIds: { capes: `${resourceId}:${id}` },
  };
}

async function searchResource(
  resourceId: string,
  p: SearchParams,
): Promise<{ total: number; hits: Thesis[] }> {
  const qs = new URLSearchParams();
  qs.set("resource_id", resourceId);
  qs.set("q", p.q);
  qs.set("limit", String(p.limit));
  qs.set("offset", String((p.page - 1) * p.limit));

  const url = `${config.capesBase}/datastore_search?${qs.toString()}`;
  const data = await fetchJson<CkanSearchResponse>(url);
  const records = data.result?.records ?? [];
  return {
    total: data.result?.total ?? 0,
    hits: records.map((r) => mapRecord(r, resourceId)),
  };
}

export async function searchCapes(
  p: SearchParams,
): Promise<SourceSearchResponse> {
  if (config.capesResourceIds.length === 0) {
    // Sem resource_ids configurados, CAPES fica fora da federação.
    return { source: "capes", total: 0, hits: [], facets: {} };
  }

  const results = await Promise.allSettled(
    config.capesResourceIds.map((rid) => searchResource(rid, p)),
  );

  let total = 0;
  const hits: Thesis[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      total += r.value.total;
      hits.push(...r.value.hits);
    }
  }

  return { source: "capes", total, hits, facets: {} };
}
