import { NextRequest, NextResponse } from "next/server";
import { getRecord } from "@/lib/federation";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await getRecord(decodeURIComponent(id));
  if (!record) {
    return NextResponse.json({ error: "não encontrado" }, { status: 404 });
  }
  return NextResponse.json(record);
}
