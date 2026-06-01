# Buscador Científico

Busca federada de teses e dissertações do Brasil. Agrega
**BDTD (IBICT)** e o **Catálogo de Teses e Dissertações da CAPES** — consultando
as fontes **ao vivo a cada busca**, sem banco de dados próprio.

## Arquitetura

Federação pura (zero storage): a cada query o backend faz *scatter-gather* nas
duas APIs, mescla e deduplica em memória, e cacheia a resposta no Redis (TTL
curto) para proteger as fontes upstream.

```
React (Next.js, SSR) → BFF (route handlers) → lib/federation ─┬─→ BDTD  (VuFind API)
                                                              └─→ CAPES (CKAN DataStore)
                                              merge/dedup + cache Redis
```

Fontes:

- **BDTD** — API VuFind: `GET /vufind/api/v1/search` e `/record`. Rica: resumo,
  link para o PDF na instituição, facets prontas, relevância do Solr.
- **CAPES** — DataStore API do CKAN (`/api/3/action/datastore_search`), por
  `resource_id` (dados fatiados por período). Só metadados/estatística — sem
  resumo nem full-text. Sem facets.

A política de merge usa **BDTD como master** (tem resumo + link); a CAPES
enriquece campos ausentes (área de avaliação, região, páginas, programa). O
dedup é heurístico: título normalizado + primeiro autor + ano.

> O contrato `lib/federation` → front é estável. Se um dia precisar de relevância
> própria, SEO pesado ou tirar a dependência do upstream, dá para trocar a
> implementação por um índice próprio (Meilisearch) sem o front perceber.

## Stack

Next.js (App Router, SSR) · TypeScript · Tailwind + shadcn/ui (tema acadêmico) ·
ioredis · TanStack Query (pronto para uso client-side).

## Setup

```bash
npm install
cp .env.example .env      # ajuste as variáveis
npm run dev               # http://localhost:3000
```

Redis é **opcional em dev**: sem `REDIS_URL`, o cache vira no-op (passa direto).
Para produção, suba um Redis e configure `REDIS_URL`.

### Configurar a CAPES

A CAPES só entra na federação se você listar os `resource_id` do Catálogo de
Teses em `CAPES_RESOURCE_IDS` (CSV). Para descobri-los, consulte o CKAN:

```
https://dadosabertos.capes.gov.br/api/3/action/package_search?q=catalogo de teses
```

Cada período (2017-2020, 2021-2024, …) é um resource separado. **Valide os nomes
das colunas** de um resource real (`datastore_search?resource_id=...&limit=1`)
contra o mapa em `src/lib/federation/capes.ts` (`COLS`) — eles variam por ano.

## Estrutura

```
src/
  app/
    page.tsx              # busca (SSR, URL-driven) + facets + paginação
    tese/[id]/page.tsx    # detalhe do registro (indexável, generateMetadata)
    api/search/route.ts   # BFF: GET /api/search
    api/record/[id]/route.ts
  components/
    search-box.tsx        # client
    facets.tsx            # client (accordion + checkbox)
    result-card.tsx       # server
    ui/                   # shadcn (button, input, card, badge, accordion, ...)
  lib/federation/
    index.ts              # orquestração: scatter-gather + cache
    bdtd.ts               # adapter VuFind
    capes.ts              # adapter CKAN DataStore
    merge.ts              # dedup + enriquecimento
    cache.ts              # Redis (getOrSet) com fallback no-op
    http.ts               # fetch com timeout por fonte
    types.ts              # contrato canônico
```

## Caveats conhecidos (assumidos pela federação pura)

- **Latência e disponibilidade** dependem das fontes. Há timeout por fonte
  (`SOURCE_TIMEOUT_MS`) e `Promise.allSettled`: uma fonte fora do ar não derruba
  a busca (a UI sinaliza resultado parcial).
- **Total agregado é aproximado** (soma os totais por fonte → conta duplicatas
  cross-source). Os totais reais por fonte vêm em `result.sources[]`.
- **Relevância não é unificada** entre Solr (BDTD) e match do CKAN (CAPES).
- **Dedup é heurístico** e imperfeito sem ID comum entre as bases.

## Próximos passos sugeridos

- Validar o mapa de colunas da CAPES contra resources reais.
- Instant-search: debounce no `SearchBox` + `router.replace` (cuidado com rate
  limit do upstream).
- Circuit breaker por fonte; métricas de latência/erro.
- Mobile: filtros num `Sheet`.
