import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { productVariants, variantStylingMappings } from "@/db/schema";
import { stylingMappingSchema, type StylingMappingDTO } from "../mapping";

export async function getProductStylingMappings(productId: number): Promise<StylingMappingDTO[]> {
  const rows = await db.select({
    variantId: variantStylingMappings.variantId,
    garmentClass: variantStylingMappings.garmentClass,
    presetId: variantStylingMappings.presetId,
    colorHex: variantStylingMappings.colorHex,
    fidelity: variantStylingMappings.fidelity,
  }).from(variantStylingMappings)
    .innerJoin(productVariants, eq(variantStylingMappings.variantId, productVariants.id))
    .where(eq(productVariants.productId, productId)).orderBy(variantStylingMappings.variantId);
  return rows.flatMap((row) => {
    const parsed = stylingMappingSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}
