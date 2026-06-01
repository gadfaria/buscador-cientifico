import { NextRequest, NextResponse } from "next/server";
import { parseSearchParams, search } from "@/lib/federation";

// Federação ao vivo: render dinâmico, nunca estático.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const params = parseSearchParams(req.nextUrl.searchParams);
  const result = await search(params);
  return NextResponse.json(result, {
    headers: {
      // Edge/CDN pode segurar a resposta por pouco tempo; o cache forte é o Redis.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
