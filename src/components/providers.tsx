"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/*
  Provider do TanStack Query. Hoje o fluxo principal é SSR/URL-driven
  (melhor SEO), então o front busca no servidor. Este provider deixa
  pronto o caminho client-side para features interativas — ex.: toggle
  de facet sem reload, instant-search — sem refazer a base.
*/
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
