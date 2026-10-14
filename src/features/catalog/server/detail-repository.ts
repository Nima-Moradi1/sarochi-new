import "server-only";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/db/client";
import { assets, careGuides, categories, colors, productCategories, productMedia, products, productVariants, sizeGuides, sizeMeasurements, sizes } from "@/db/schema";

export async function selectProductDetail(slug: string) {
  const [product] = await db.select({
    id: products.id,
    slug: products.slug,
    nameFa: products.nameFa,
    description: products.description,
    garmentClass: products.garmentClass,
    sourceType: products.sourceType,
  }).from(products).where(and(eq(products.slug, slug), eq(products.status, "PUBLISHED"))).limit(1);
  if (!product) return null;

  const categoryRows = await db.select({ id: categories.id, slug: categories.slug, nameFa: categories.nameFa })
    .from(productCategories).innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(eq(productCategories.productId, product.id));
  const categoryIds = categoryRows.map((row) => row.id);
  const variantRows = await db.select({
    id: productVariants.id,
    sku: productVariants.sku,
    regularPriceToman: productVariants.regularPriceToman,
    salePriceToman: productVariants.salePriceToman,
    stockQty: productVariants.stockQty,
    colorSlug: colors.slug,
    colorNameFa: colors.nameFa,
    colorHex: colors.hex,
    sizeLabel: sizes.label,
    sizeSortOrder: sizes.sortOrder,
  }).from(productVariants)
    .leftJoin(colors, eq(productVariants.colorId, colors.id))
    .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
    .where(eq(productVariants.productId, product.id))
    .orderBy(sizes.sortOrder, productVariants.id);
  const mediaRows = await db.select({
    id: productMedia.id,
    url: assets.pathOrUrl,
    angle: productMedia.viewAngle,
    isPrimary: productMedia.isPrimary,
    confidence: productMedia.confidence,
    provenance: assets.provenance,
  }).from(productMedia).innerJoin(assets, eq(productMedia.assetId, assets.id))
    .where(eq(productMedia.productId, product.id)).orderBy(productMedia.sortOrder, productMedia.id);
  const careRows = await db.select({ titleFa: careGuides.titleFa, instructionsFa: careGuides.instructionsFa })
    .from(careGuides)
    .where(or(eq(careGuides.productId, product.id), categoryIds.length ? inArray(careGuides.categoryId, categoryIds) : undefined));
  let [guide] = await db.select({ id: sizeGuides.id, titleFa: sizeGuides.titleFa, toleranceCm: sizeGuides.toleranceCm })
    .from(sizeGuides).where(eq(sizeGuides.productId, product.id)).limit(1);
  if (!guide && categoryIds.length) {
    [guide] = await db.select({ id: sizeGuides.id, titleFa: sizeGuides.titleFa, toleranceCm: sizeGuides.toleranceCm })
      .from(sizeGuides).where(inArray(sizeGuides.categoryId, categoryIds)).limit(1);
  }
  const measurementRows = guide ? await db.select({
    size: sizes.label,
    metric: sizeMeasurements.metric,
    valueCm: sizeMeasurements.valueCm,
  }).from(sizeMeasurements).innerJoin(sizes, eq(sizeMeasurements.sizeId, sizes.id))
    .where(eq(sizeMeasurements.guideId, guide.id)).orderBy(sizes.sortOrder) : [];
  const relatedRows = categoryIds.length ? await db.selectDistinct({ id: products.id, slug: products.slug, nameFa: products.nameFa })
    .from(productCategories).innerJoin(products, eq(productCategories.productId, products.id))
    .where(and(inArray(productCategories.categoryId, categoryIds), ne(products.id, product.id), eq(products.status, "PUBLISHED")))
    .limit(4) : [];

  return { product, categoryRows, variantRows, mediaRows, careRows, guide, measurementRows, relatedRows };
}
