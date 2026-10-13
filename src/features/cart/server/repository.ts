import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { colors, products, productVariants, sizes } from "@/db/schema";

export async function selectCartVariants(variantIds: number[]) {
  return db.select({
    variantId: productVariants.id,
    productId: products.id,
    slug: products.slug,
    nameFa: products.nameFa,
    sku: productVariants.sku,
    colorNameFa: colors.nameFa,
    sizeLabel: sizes.label,
    regularPriceToman: productVariants.regularPriceToman,
    salePriceToman: productVariants.salePriceToman,
    stockQty: productVariants.stockQty,
  }).from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(colors, eq(productVariants.colorId, colors.id))
    .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
    .where(and(inArray(productVariants.id, variantIds), eq(products.status, "PUBLISHED")));
}
