import { NextResponse } from "next/server";
import { getCatalogFacets } from "@/features/catalog/server/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getCatalogFacets(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CATALOG_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
