import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/federation";
import type { SearchParams } from "@/lib/federation/types";

// Materializa um lote (top-N) dos resultados para alimentar a coleção local.
export const dynamic = "force-dynamic";

const MAX_CAP = 200;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const cap = Math.min(MAX_CAP, Math.max(1, Number(sp.get("cap") ?? 100) || 100));

  if (!q) {
    return NextResponse.json({ hits: [], sources: [] });
  }

  const params: SearchParams = {
    q,
    page: 1,
    limit: cap, // ignora o teto de 50 da busca paginada: aqui queremos o lote.
    sort: sp.get("sort") ?? undefined,
    filters: {
      institution: sp.getAll("institution"),
      year: sp.getAll("year"),
      type: sp.getAll("type"),
    },
  };

  const result = await search(params);
  return NextResponse.json({
    hits: result.hits.slice(0, cap),
    sources: result.sources,
  });
}
