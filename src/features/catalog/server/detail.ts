import "server-only";
import { cache } from "react";
import { selectProductDetail } from "./detail-repository";
import { safeAssetUrl } from "./media";
import { variantPriceSchema } from "../rules";
import type { ProductDetailDTO } from "../types";

export const getProductDetail = cache(async (slug: string): Promise<ProductDetailDTO | null> => {
  const rows = await selectProductDetail(slug);
  if (!rows) return null;
  return {
    ...rows.product,
    categories: rows.categoryRows.map(({ slug: categorySlug, nameFa }) => ({ slug: categorySlug, nameFa })),
    variants: rows.variantRows.map((row) => {
      const priceValid = variantPriceSchema.safeParse({ regularPriceToman: row.regularPriceToman, salePriceToman: row.salePriceToman }).success;
      return {
        id: row.id,
        sku: row.sku,
        color: row.colorSlug && row.colorNameFa ? { slug: row.colorSlug, nameFa: row.colorNameFa, hex: row.colorHex } : null,
        size: row.sizeLabel && row.sizeSortOrder !== null ? { label: row.sizeLabel, sortOrder: row.sizeSortOrder } : null,
        regularPriceToman: priceValid ? row.regularPriceToman : null,
        salePriceToman: priceValid ? row.salePriceToman : null,
        stockQty: row.stockQty,
      };
    }),
    media: rows.mediaRows.flatMap((row) => {
      const url = safeAssetUrl(row.url);
      return url ? [{ ...row, url }] : [];
    }),
    care: rows.careRows,
    sizeGuide: rows.guide ? { titleFa: rows.guide.titleFa, toleranceCm: rows.guide.toleranceCm, measurements: rows.measurementRows } : null,
    related: rows.relatedRows,
  };
});
