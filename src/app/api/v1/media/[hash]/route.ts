import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { assets, productMedia, products } from "@/db/schema";
import { readStoredImage } from "@/features/admin/catalog/server/media-storage";
import { getCurrentAdmin } from "@/features/admin/auth/server/service";
import { getPublicBrandLogo } from "@/features/content/server/repository";

export const runtime = "nodejs";

type Context = { params: Promise<{ hash: string }> };

export async function GET(_request: Request, { params }: Context) {
  const hash = (await params).hash;
  if (!/^[a-f0-9]{64}$/.test(hash)) return NextResponse.json({ error: "INVALID_MEDIA_ID" }, { status: 400 });
  try {
    const [publishedAsset] = await db.select({ id: assets.id }).from(assets)
      .innerJoin(productMedia, eq(productMedia.assetId, assets.id))
      .innerJoin(products, eq(products.id, productMedia.productId))
      .where(and(eq(assets.sha256, hash), inArray(assets.provenance, ["OWNER_UPLOAD", "SAROCHI_SOURCE"]), eq(products.status, "PUBLISHED"))).limit(1);
    const brandLogo = !publishedAsset ? await getPublicBrandLogo(hash) : null;
    if (!publishedAsset && !brandLogo) {
      if (!await getCurrentAdmin()) return new NextResponse(null, { status: 404 });
      const [privateAsset] = await db.select({ id: assets.id }).from(assets).innerJoin(productMedia, eq(productMedia.assetId, assets.id)).where(and(eq(assets.sha256, hash), inArray(assets.provenance, ["OWNER_UPLOAD", "SAROCHI_SOURCE"]))).limit(1);
      if (!privateAsset) return new NextResponse(null, { status: 404 });
    }
    const bytes = await readStoredImage(hash);
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": "image/webp", "Cache-Control": publishedAsset || brandLogo ? "public, max-age=0, must-revalidate" : "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return new NextResponse(null, { status: 404 });
    return NextResponse.json({ error: "MEDIA_UNAVAILABLE" }, { status: 503 });
  }
}
