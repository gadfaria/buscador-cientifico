# Changelog

Histórico de alterações do Buscador Científico. Entradas mais recentes no topo.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/).

## [Não lançado] — 2026-06-01

### Alterado — Aplicação de labels por card
- No card da coleção, agora aparecem **apenas as labels já aplicadas naquele
  item**; um botão **"+ Label"** abre um seletor com as labels disponíveis para
  aplicar só naquele card. Antes toda label criada aparecia como chip (apagado)
  em todos os cards, dando a impressão de estar aplicada em todos.

### Adicionado — Curadoria de resultados
- **Marcação por cor** em cada resultado (5 cores; borda esquerda do card reflete
  a marca) e **ocultar/restaurar** resultados.
- **Toolbar** acima da lista: filtro por cor ("Todas" + swatches) e toggle
  "Ocultados (N)" com restaurar/limpar.
- Store de curadoria `src/lib/annotations.tsx` (provider de contexto) com
  persistência em **`localStorage`**, chaveada pelo id canônico da tese; hidrata
  após o mount para evitar mismatch de SSR e degrada para só-memória se
  indisponível.
- Novo componente client `src/components/results-list.tsx` (lista + toolbar).
- `AnnotationsProvider` adicionado em `src/components/providers.tsx`.

### Alterado
- `src/components/result-card.tsx` passou de server para **client component**
  (paleta de cores + botão ocultar/restaurar).
- `src/app/page.tsx` agora renderiza `<ResultsList>` em vez de mapear `ResultCard`
  diretamente.
- README atualizado (seção Curadoria, estrutura, stack, próximos passos).

### Reformulado — Coleção de trabalho (substitui a curadoria por cor na busca)
- **Novo fluxo:** a busca passou a mostrar só a **contagem por fonte** + botão;
  a curadoria saiu da lista de busca e virou uma **tela dedicada** (`/colecao`).
- **Coleção acumulativa** persistida em **IndexedDB via localForage** (no lugar
  do `localStorage`), guardando os registros de verdade (`src/lib/collection.tsx`).
  Cada busca soma o **top 100** (dedup por id); a curadoria não se perde.
- **Labels** (nome + cor) criáveis pelo usuário, atribuíveis por item, com
  **filtro por label**; **remoção** de itens; **nota** por item.
- **Export/import:** JSON (round-trip fiel: itens + labels + notas) e CSV (planilha).
- Novos: `GET /api/collect`, `app/colecao/page.tsx`, componentes
  `add-to-collection-button`, `collection-list`, `collection-item`,
  store `lib/collection.tsx`. Dependência `localforage`.

### Removido
- Curadoria baseada em `localStorage` na lista de busca: arquivos
  `lib/annotations.tsx`, `components/results-list.tsx`,
  `components/result-card.tsx` e `components/facets.tsx` (a busca ficou enxuta).

## [0.1.0] — 2026-06-01

### Adicionado — Esqueleto inicial (federação pura, zero-banco)
- Projeto **Next.js (App Router, SSR)** + TypeScript + Tailwind + shadcn/ui com
  **tema acadêmico** (serifa Source Serif 4 nos títulos, Inter no corpo, paleta
  papel + navy, flat/`rounded-md`).
- Camada `src/lib/federation/`:
  - `bdtd.ts` — adapter da API VuFind da BDTD (validado contra a API real).
  - `capes.ts` — adapter da DataStore API do CKAN da CAPES (fan-out por
    `resource_id`; mapa de colunas a validar).
  - `merge.ts` — dedup heurístico (título + autor + ano) com BDTD como master.
  - `index.ts` — orquestração scatter-gather com timeout por fonte + cache.
  - `cache.ts` — cache Redis (`getOrSet`) com fallback no-op sem `REDIS_URL`.
  - `http.ts` — `fetch` com timeout (AbortController) por fonte.
  - `types.ts` — contrato canônico (`Thesis`, `SearchResult`).
- BFF: route handlers `GET /api/search` e `GET /api/record/[id]`.
- Front SSR: página de busca URL-driven com facets, paginação e streaming via
  Suspense; página de detalhe `/tese/[id]` com `generateMetadata` (SEO).
- Componentes shadcn: button, input, card, badge, skeleton, label, accordion,
  checkbox.
- README, `.env.example`, config (tsconfig, next, tailwind, postcss, components.json).
- Verificação: `tsc --noEmit` limpo.
