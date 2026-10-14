import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { assets, categories, productMedia, products, railItems, rails } from "@/db/schema";
import type { RailQuery } from "../schemas";

export async function selectPublishedRails(query: RailQuery) {
  const railRows = await db.select({
    id: rails.id,
    slug: rails.slug,
    titleFa: rails.titleFa,
    themeId: rails.themeId,
    editorialCopy: rails.editorialCopy,
    categoryId: rails.categoryId,
  }).from(rails)
    .leftJoin(categories, eq(rails.categoryId, categories.id))
    .where(and(eq(rails.isPublished, true), query.category ? eq(categories.slug, query.category) : undefined))
    .orderBy(rails.sortOrder, rails.id)
    .limit(query.limit);

  if (railRows.length === 0) return { railRows, categoryRows: [], itemRows: [], mediaRows: [] };

  const categoryRows = await db.select({ id: categories.id, parentId: categories.parentId, slug: categories.slug, nameFa: categories.nameFa })
    .from(categories).where(eq(categories.isPublished, true));

  const itemRows = await db.select({
    railId: railItems.railId,
    id: products.id,
    slug: products.slug,
    nameFa: products.nameFa,
    garmentClass: products.garmentClass,
    sourceType: products.sourceType,
    position: railItems.position,
    cutoutUrl: assets.pathOrUrl,
  }).from(railItems)
    .innerJoin(products, eq(railItems.productId, products.id))
    .leftJoin(assets, eq(railItems.overrideAssetId, assets.id))
    .where(and(inArray(railItems.railId, railRows.map((rail) => rail.id)), eq(products.status, "PUBLISHED")))
    .orderBy(railItems.railId, railItems.position);

  const mediaRows = itemRows.length === 0 ? [] : await db.select({
    productId: productMedia.productId,
    url: assets.pathOrUrl,
    angle: productMedia.viewAngle,
    confidence: productMedia.confidence,
  }).from(productMedia)
    .innerJoin(assets, eq(productMedia.assetId, assets.id))
    .where(inArray(productMedia.productId, itemRows.map((item) => item.id)))
    .orderBy(productMedia.productId, productMedia.sortOrder);

  return { railRows, categoryRows, itemRows, mediaRows };
}
