import { NextResponse } from "next/server";
import { cartItemsSchema } from "@/features/cart/schemas";
import { getCartQuote } from "@/features/cart/server/service";

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 16000) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }
  const parsed = cartItemsSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_CART", fields: parsed.error.flatten() }, { status: 400 });
  try {
    return NextResponse.json(await getCartQuote(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "CATALOG_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
