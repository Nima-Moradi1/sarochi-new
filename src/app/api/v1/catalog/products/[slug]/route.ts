import { NextResponse } from "next/server";
import { getProductDetail } from "@/features/catalog/server/detail";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return NextResponse.json({ error: "INVALID_SLUG" }, { status: 400 });
  try {
    const product = await getProductDetail(slug);
    if (!product) return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
    return NextResponse.json(product, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CATALOG_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
