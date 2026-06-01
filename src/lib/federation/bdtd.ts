import { config } from "./config";
import { fetchJson, toArray } from "./http";
import type {
  FacetBucket,
  SearchParams,
  SourceSearchResponse,
  Thesis,
  ThesisType,
} from "./types";

/*
  Adapter da BDTD (IBICT) sobre a API do VuFind 7.x:
    GET /search  -> busca + facets
    GET /record  -> registro individual

  Validado: /search?lookfor=...&type=AllFields retorna
  { resultCount, records, facets, status }. O shape exato de cada campo
  de `records` depende dos field[] pedidos; o parsing abaixo é defensivo.
*/

const SEARCH_FIELDS = [
  "id",
  "title",
  "authors",
  "summary",
  "publishDates",
  "institutions",
  "languages",
  "formats",
  "urls",
];

interface VuFindUrl {
  url?: string;
  desc?: string;
}

interface VuFindRecord {
  id?: string;
  title?: string;
  authors?: {
    primary?: Record<string, unknown>;
    secondary?: Record<string, unknown>;
    corporate?: Record<string, unknown>;
  };
  summary?: string | string[];
  publishDates?: string | string[];
  institutions?: Array<string | { value?: string; translated?: string }> | string;
  languages?: string | string[];
  formats?: Array<string | { value?: string; translated?: string }> | string;
  urls?: VuFindUrl[];
}

interface VuFindFacet {
  value: string;
  translated?: string;
  count: number;
}

interface VuFindSearchResponse {
  resultCount?: number;
  records?: VuFindRecord[];
  facets?: Record<string, VuFindFacet[]>;
  status?: string;
}

function pickLabel(
  v: string | { value?: string; translated?: string },
): string | undefined {
  return typeof v === "string" ? v : (v.translated ?? v.value);
}

function detectType(formats: string[]): ThesisType | undefined {
  const joined = formats.join(" ").toLowerCase();
  if (/tese|doctoral|doutor/.test(joined)) return "tese";
  if (/disserta|master|mestr/.test(joined)) return "dissertacao";
  return formats.length ? "outro" : undefined;
}

function mapRecord(r: VuFindRecord): Thesis {
  const id = r.id ?? cryptoRandom();
  const authors = [
    ...Object.keys(r.authors?.primary ?? {}),
    ...Object.keys(r.authors?.secondary ?? {}),
  ];
  const institutions = toArray(r.institutions)
    .map(pickLabel)
    .filter(Boolean) as string[];
  const formats = toArray(r.formats).map(pickLabel).filter(Boolean) as string[];
  const summary = toArray(r.summary).filter(Boolean) as string[];
  const dates = toArray(r.publishDates).filter(Boolean) as string[];
  const year = dates.length ? parseInt(dates[0], 10) || undefined : undefined;
  const documentUrl = r.urls?.find((u) => u.url)?.url;

  return {
    id: `bdtd:${id}`,
    title: r.title?.trim() ?? "(sem título)",
    authors,
    abstract: summary[0],
    year,
    institution: institutions[0],
    knowledgeArea: undefined,
    type: detectType(formats),
    language: toArray(r.languages).filter(Boolean)[0] as string | undefined,
    documentUrl,
    sources: ["bdtd"],
    sourceIds: { bdtd: id },
  };
}

function mapFacets(
  facets: Record<string, VuFindFacet[]> | undefined,
): Record<string, FacetBucket[]> {
  if (!facets) return {};
  const out: Record<string, FacetBucket[]> = {};
  const keyMap: Record<string, string> = {
    institution: "institution",
    publishDate: "year",
    format: "type",
  };
  for (const [vfKey, buckets] of Object.entries(facets)) {
    const key = keyMap[vfKey] ?? vfKey;
    out[key] = buckets.map((b) => ({
      value: b.value,
      label: b.translated ?? b.value,
      count: b.count,
    }));
  }
  return out;
}

function buildFilters(p: SearchParams): string[] {
  const f: string[] = [];
  for (const v of p.filters.institution ?? []) f.push(`institution:"${v}"`);
  for (const v of p.filters.year ?? []) f.push(`publishDate:"${v}"`);
  for (const v of p.filters.type ?? []) f.push(`format:"${v}"`);
  return f;
}

export async function searchBdtd(
  p: SearchParams,
): Promise<SourceSearchResponse> {
  const qs = new URLSearchParams();
  qs.set("lookfor", p.q);
  qs.set("type", "AllFields");
  qs.set("page", String(p.page));
  qs.set("limit", String(p.limit));
  if (p.sort) qs.set("sort", p.sort);
  for (const f of SEARCH_FIELDS) qs.append("field[]", f);
  for (const facet of ["institution", "publishDate", "format"])
    qs.append("facet[]", facet);
  for (const filter of buildFilters(p)) qs.append("filter[]", filter);

  const url = `${config.bdtdBase}/search?${qs.toString()}`;
  const data = await fetchJson<VuFindSearchResponse>(url);

  return {
    source: "bdtd",
    total: data.resultCount ?? 0,
    hits: (data.records ?? []).map(mapRecord),
    facets: mapFacets(data.facets),
  };
}

export async function recordBdtd(id: string): Promise<Thesis | null> {
  const qs = new URLSearchParams();
  qs.set("id", id);
  for (const f of [...SEARCH_FIELDS, "subjects"]) qs.append("field[]", f);
  const url = `${config.bdtdBase}/record?${qs.toString()}`;
  const data = await fetchJson<{ records?: VuFindRecord[] }>(url);
  const rec = data.records?.[0];
  return rec ? mapRecord(rec) : null;
}

function cryptoRandom(): string {
  return Math.random().toString(36).slice(2, 10);
}
