import { NextRequest, NextResponse } from "next/server";
import { productQueryKeys, productQuerySchema } from "@/features/catalog/schemas";
import { getProductPage } from "@/features/catalog/server/products";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsed = productQuerySchema.safeParse(Object.fromEntries(
    productQueryKeys
      .filter((key) => params.has(key)).map((key) => [key, params.get(key)]),
  ));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_QUERY", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    return NextResponse.json(await getProductPage(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CATALOG_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
