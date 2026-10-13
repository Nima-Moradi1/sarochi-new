import { NextRequest, NextResponse } from "next/server";
import { railQuerySchema } from "@/features/catalog/schemas";
import { getPublishedRails } from "@/features/catalog/server/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = railQuerySchema.safeParse({
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_QUERY", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  try {
    const rails = await getPublishedRails(parsed.data);
    return NextResponse.json({ rails }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CATALOG_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
