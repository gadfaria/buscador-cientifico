/**
 * Tipos canônicos da federação.
 *
 * O contrato exposto ao front (SearchResult/Thesis) é estável de propósito:
 * a implementação por trás (proxy ao vivo hoje, índice próprio amanhã) pode
 * mudar sem o front perceber.
 */

export type SourceName = "bdtd" | "capes";

export type ThesisType = "tese" | "dissertacao" | "outro";

export interface Thesis {
  /** id canônico, prefixado pela fonte de origem (ex.: "bdtd:UFRN_123"). */
  id: string;
  title: string;
  authors: string[];
  advisors?: string[];
  /** Resumo — só a BDTD fornece. */
  abstract?: string;
  year?: number;
  institution?: string;
  /** Programa de pós-graduação. */
  program?: string;
  /** Grande área de conhecimento (CNPq). */
  knowledgeArea?: string;
  /** Área de avaliação CAPES. */
  evaluationArea?: string;
  /** Região da IES (CAPES). */
  region?: string;
  pages?: number;
  type?: ThesisType;
  language?: string;
  /** Link para o documento na instituição de defesa (BDTD). Nunca o arquivo. */
  documentUrl?: string;
  /** Fontes que contribuíram para este registro (após o merge). */
  sources: SourceName[];
  /** id original em cada fonte, para rastreio e deep-link. */
  sourceIds: Partial<Record<SourceName, string>>;
}

export interface SearchFilters {
  institution?: string[];
  year?: string[];
  type?: string[];
}

export interface SearchParams {
  q: string;
  page: number;
  limit: number;
  filters: SearchFilters;
  sort?: string;
}

export interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

export interface SourceStatus {
  name: SourceName;
  ok: boolean;
  total: number;
  tookMs: number;
  error?: string;
}

export interface SearchResult {
  query: string;
  /** Total agregado (best-effort: ver nota em mergeResults). */
  total: number;
  page: number;
  limit: number;
  hits: Thesis[];
  facets: Record<string, FacetBucket[]>;
  /** Diagnóstico por fonte — útil pra UI sinalizar fonte indisponível. */
  sources: SourceStatus[];
  /** True se ao menos uma fonte respondeu. */
  partial: boolean;
}

/** Resultado bruto de uma fonte, antes do merge. */
export interface SourceSearchResponse {
  source: SourceName;
  total: number;
  hits: Thesis[];
  facets: Record<string, FacetBucket[]>;
}
