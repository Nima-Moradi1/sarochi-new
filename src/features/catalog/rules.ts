import { z } from "zod";

export const variantPriceSchema = z.object({
  regularPriceToman: z.number().int().nonnegative().nullable(),
  salePriceToman: z.number().int().nonnegative().nullable(),
}).superRefine((value, context) => {
  if (value.salePriceToman !== null && value.regularPriceToman === null) {
    context.addIssue({ code: "custom", path: ["regularPriceToman"], message: "Regular price is required when sale price exists" });
  }
  if (value.salePriceToman !== null && value.regularPriceToman !== null && value.salePriceToman > value.regularPriceToman) {
    context.addIssue({ code: "custom", path: ["salePriceToman"], message: "Sale price cannot exceed regular price" });
  }
});

export function effectivePriceToman(regular: number | null, sale: number | null): number | null {
  const parsed = variantPriceSchema.parse({ regularPriceToman: regular, salePriceToman: sale });
  return parsed.salePriceToman ?? parsed.regularPriceToman;
}

export type StockState = "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";

export function stockState(quantities: Array<number | null>): StockState {
  if (quantities.length === 0) return "UNKNOWN";
  if (quantities.some((quantity) => quantity !== null && quantity > 0)) return "IN_STOCK";
  if (quantities.some((quantity) => quantity === null)) return "UNKNOWN";
  return "OUT_OF_STOCK";
}
