import { config } from "./config";

/** fetch com timeout por fonte (AbortController). Lança em timeout/erro HTTP. */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? config.sourceTimeoutMs;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        // Algumas APIs públicas rejeitam requisições sem User-Agent.
        "User-Agent": "buscador-cientifico/0.1 (+federacao)",
        ...(init?.headers ?? {}),
      },
      // Federação ao vivo: nunca usar o cache de fetch do Next aqui;
      // o cache é nosso (Redis) e controlado em cache.ts.
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} em ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Coage valor a array (APIs variam entre string e string[]). */
export function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}
