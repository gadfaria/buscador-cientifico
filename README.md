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
ioredis · TanStack Query (pronto para uso client-side) · localForage/IndexedDB
(coleção de trabalho).

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

## Fluxo de uso e curadoria

1. **Busca** — você pesquisa e a tela mostra apenas a **contagem por fonte**
   (BDTD, CAPES) + um botão.
2. **Coletar** — "Adicionar à coleção e gerenciar" materializa os **top 100**
   resultados mais relevantes (via `/api/collect`) e leva para a coleção.
3. **Gerenciar** (`/colecao`) — você **remove** o que não interessa, cria e
   atribui **labels** (nome + cor), **anota** cada item, **filtra por label** e
   **exporta/importa** para continuar depois.

A coleção é **acumulativa**: uma coleção única que cresce a cada busca (dedup por
id canônico), então a curadoria nunca se perde ao buscar de novo.

### Persistência (sem banco) e export/import

A coleção guarda os **registros de verdade** (resumos inclusos) de centenas de
itens — pesado e estruturado. Por isso usa **localForage (IndexedDB)** e não
`localStorage` (síncrono, ~5 MB, só string). O store (`src/lib/collection.tsx`)
hidrata após o mount (evita mismatch de SSR) e degrada para só-memória se o
IndexedDB estiver indisponível.

Como é dado do usuário sobre o corpus — não o corpus — isso não fere o
"zero-banco". Export/import:

- **JSON** — round-trip fiel (itens + labels + atribuições + notas); reimporta e
  continua de onde parou (merge: soma itens e funde labels por nome).
- **CSV** — saída para planilha (uma linha por item, labels como coluna).

Limite: é **por-navegador** (não sincroniza entre dispositivos). O JSON é o
"backup" portátil; para sync automático, trocar o store por um backend de contas
sem mexer na UI.

## Estrutura

```
src/
  app/
    page.tsx              # busca (SSR) → contagem por fonte + botão coletar
    colecao/page.tsx      # tela de gerência da coleção (noindex)
    tese/[id]/page.tsx    # detalhe do registro (indexável, generateMetadata)
    api/search/route.ts   # BFF: GET /api/search (busca paginada)
    api/collect/route.ts  # BFF: GET /api/collect (materializa top-N)
    api/record/[id]/route.ts
  components/
    search-box.tsx              # client
    add-to-collection-button.tsx # client: coleta top-N e vai pra /colecao
    collection-list.tsx         # client: toolbar (labels, filtro, export/import)
    collection-item.tsx         # client: card de item (labels, nota, remover)
    ui/                         # shadcn (button, input, card, badge, accordion, ...)
  lib/
    collection.tsx        # store da coleção (localForage) + provider
    federation/
      index.ts            # orquestração: scatter-gather + cache
      bdtd.ts             # adapter VuFind
      capes.ts            # adapter CKAN DataStore
      merge.ts            # dedup + enriquecimento
      cache.ts            # Redis (getOrSet) com fallback no-op
      http.ts             # fetch com timeout por fonte
      types.ts            # contrato canônico
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
- Circuit breaker por fonte; métricas de latência/erro.
- Coleta: "carregar mais" para ir além dos 100 (paginar as fontes na coleta).
- Coleção: múltiplas coleções nomeadas (projetos) e export BibTeX/RIS.
- Sync entre dispositivos via backend de contas (trocando o store, sem mexer na UI).
- Mobile: gerenciador de labels num `Sheet`.
