/** Configuração lida do ambiente, com defaults seguros para dev. */
export const config = {
  bdtdBase: process.env.BDTD_API_BASE ?? "https://bdtd.ibict.br/vufind/api/v1",
  capesBase:
    process.env.CAPES_CKAN_BASE ??
    "https://dadosabertos.capes.gov.br/api/3/action",
  /** resource_ids do Catálogo de Teses no CKAN da CAPES (CSV no env). */
  capesResourceIds: (process.env.CAPES_RESOURCE_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  redisUrl: process.env.REDIS_URL,
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 900),
  sourceTimeoutMs: Number(process.env.SOURCE_TIMEOUT_MS ?? 4000),
};
