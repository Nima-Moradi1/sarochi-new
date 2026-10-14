import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assets, productMedia, products } from "@/db/schema";
import { safeAssetUrl } from "@/features/catalog/server/media";

export async function getPhotographedWardrobe() {
  const rows = await db.select({ slug: products.slug, nameFa: products.nameFa, imageUrl: assets.pathOrUrl }).from(products)
    .innerJoin(productMedia, eq(productMedia.productId, products.id)).innerJoin(assets, eq(productMedia.assetId, assets.id))
    .where(and(eq(products.status, "PUBLISHED"), eq(productMedia.viewAngle, "LIFESTYLE"), eq(productMedia.confidence, "VERIFIED")))
    .orderBy(products.id, desc(productMedia.isPrimary), productMedia.sortOrder).limit(100);
  const firstByProduct = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const imageUrl = safeAssetUrl(row.imageUrl);
    if (imageUrl && !firstByProduct.has(row.slug)) firstByProduct.set(row.slug, { ...row, imageUrl });
  }
  return [...firstByProduct.values()].slice(0, 12);
}
