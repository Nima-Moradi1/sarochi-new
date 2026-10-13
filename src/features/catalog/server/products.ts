import "server-only";
import { and, asc, desc, eq, exists, gt, inArray, isNotNull, isNull, like, lt, gte, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { assets, categories, colors, productCategories, productMedia, products, productVariants, sizes } from "@/db/schema";
import { stockState } from "../rules";
import { safeAssetUrl } from "./media";
import type { ProductQuery } from "../schemas";
import type { CatalogFacetsDTO, ProductCardDTO, ProductPageDTO } from "../types";

const effectivePrice = sql<number>`coalesce(${productVariants.salePriceToman}, ${productVariants.regularPriceToman})`;

export async function getProductPage(query: ProductQuery): Promise<ProductPageDTO> {
  const categoryMatch = query.category ? exists(
    db.select({ id: productCategories.productId }).from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(and(eq(productCategories.productId, products.id), eq(categories.slug, query.category))),
  ) : undefined;
  const needsVariant = query.color || query.size || query.minPrice !== undefined || query.maxPrice !== undefined || query.inStock || query.onSale;
  // All variant constraints apply to the same variant. Unknown stock and missing
  // regular prices cannot qualify as available or discounted merchandise.
  const variantFilters = and(
    query.color ? eq(colors.slug, query.color) : undefined,
    query.size ? eq(sizes.label, query.size) : undefined,
    query.minPrice !== undefined ? gte(effectivePrice, query.minPrice) : undefined,
    query.maxPrice !== undefined ? lte(effectivePrice, query.maxPrice) : undefined,
    query.inStock ? gt(productVariants.stockQty, 0) : undefined,
    query.onSale ? lt(productVariants.salePriceToman, productVariants.regularPriceToman) : undefined,
  );
  const matchingVariants = db.select({
    productId: productVariants.productId,
    minPriceToman: sql<number | null>`min(${effectivePrice})`.as("min_price_toman"),
  }).from(productVariants)
    .leftJoin(colors, eq(productVariants.colorId, colors.id))
    .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
    .where(variantFilters).groupBy(productVariants.productId).as("matching_variants");
  const price = matchingVariants.minPriceToman;
  let cursorMatch;
  if (typeof query.cursor === "number") cursorMatch = lt(products.id, query.cursor);
  else if (query.cursor) {
    const [, cursorPrice, cursorId] = query.cursor.split(":");
    cursorMatch = cursorPrice === "unknown"
      ? and(isNull(price), lt(products.id, Number(cursorId)))
      : or(
        isNull(price),
        query.sort === "price_asc" ? gt(price, Number(cursorPrice)) : lt(price, Number(cursorPrice)),
        and(eq(price, Number(cursorPrice)), lt(products.id, Number(cursorId))),
      );
  }
  const ordering = query.sort === "newest" ? [desc(products.id)]
    : [asc(sql`${price} is null`), query.sort === "price_asc" ? asc(price) : desc(price), desc(products.id)];

  const rows = await db.select({
    id: products.id,
    slug: products.slug,
    nameFa: products.nameFa,
    garmentClass: products.garmentClass,
    sourceType: products.sourceType,
    minPriceToman: price,
  }).from(products)
    .leftJoin(matchingVariants, eq(products.id, matchingVariants.productId)).where(and(
    eq(products.status, "PUBLISHED"),
    cursorMatch,
    query.q ? like(products.nameFa, `%${query.q}%`) : undefined,
    categoryMatch,
    needsVariant ? isNotNull(matchingVariants.productId) : undefined,
  )).orderBy(...ordering).limit(query.limit + 1);

  const pageRows = rows.slice(0, query.limit);
  if (pageRows.length === 0) return { items: [], nextCursor: null };
  const variantRows = await db.select({
    productId: productVariants.productId,
    regularPriceToman: productVariants.regularPriceToman,
    salePriceToman: productVariants.salePriceToman,
    stockQty: productVariants.stockQty,
  }).from(productVariants)
    .leftJoin(colors, eq(productVariants.colorId, colors.id))
    .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
    .where(and(inArray(productVariants.productId, pageRows.map((row) => row.id)), variantFilters));
  const mediaRows = await db.select({
    productId: productMedia.productId,
    url: assets.pathOrUrl,
    angle: productMedia.viewAngle,
    confidence: productMedia.confidence,
  }).from(productMedia).innerJoin(assets, eq(productMedia.assetId, assets.id))
    .where(inArray(productMedia.productId, pageRows.map((row) => row.id)))
    .orderBy(productMedia.productId, desc(productMedia.isPrimary), productMedia.sortOrder);
  const mediaByProduct = new Map<number, { url: string; angle: string; confidence: string }>();
  for (const media of mediaRows) {
    const url = safeAssetUrl(media.url);
    if (!url || mediaByProduct.has(media.productId)) continue;
    mediaByProduct.set(media.productId, { url, angle: media.angle, confidence: media.confidence });
  }

  const variantsByProduct = new Map<number, typeof variantRows>();
  for (const variant of variantRows) {
    const current = variantsByProduct.get(variant.productId) ?? [];
    current.push(variant);
    variantsByProduct.set(variant.productId, current);
  }
  const items: ProductCardDTO[] = pageRows.map((row) => {
    const variants = variantsByProduct.get(row.id) ?? [];
    return {
      ...row,
      minPriceToman: row.minPriceToman === null ? null : Number(row.minPriceToman),
      stock: stockState(variants.map((variant) => variant.stockQty)),
      imageUrl: mediaByProduct.get(row.id)?.url ?? null,
      imageAngleVerified: mediaByProduct.get(row.id)?.angle === "FRONT" && mediaByProduct.get(row.id)?.confidence === "VERIFIED",
    };
  });
  const last = pageRows.at(-1)!;
  return { items, nextCursor: rows.length > query.limit
    ? query.sort === "newest" ? last.id : `${query.sort}:${last.minPriceToman === null ? "unknown" : Number(last.minPriceToman)}:${last.id}`
    : null };
}

export async function getCatalogFacets(): Promise<CatalogFacetsDTO> {
  const published = eq(products.status, "PUBLISHED");
  const categoryRows = await db.select({
    slug: categories.slug,
    label: categories.nameFa,
    count: sql<number>`count(distinct ${products.id})`,
  }).from(categories)
    .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .innerJoin(products, eq(productCategories.productId, products.id))
    .where(published).groupBy(categories.id, categories.slug, categories.nameFa);
  const colorRows = await db.select({
    slug: colors.slug,
    label: colors.nameFa,
    count: sql<number>`count(distinct ${products.id})`,
  }).from(colors)
    .innerJoin(productVariants, eq(colors.id, productVariants.colorId))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(published).groupBy(colors.id, colors.slug, colors.nameFa);
  const sizeRows = await db.select({
    label: sizes.label,
    count: sql<number>`count(distinct ${products.id})`,
  }).from(sizes)
    .innerJoin(productVariants, eq(sizes.id, productVariants.sizeId))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(published).groupBy(sizes.id, sizes.label);
  return { categories: categoryRows, colors: colorRows, sizes: sizeRows };
}
