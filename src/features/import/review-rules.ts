import { z } from "zod";
import { normalizedProductSchema } from "./normalizers/sarochi-product";
import { variantPriceSchema } from "@/features/catalog/rules";

export const reviewCandidateSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  categoryIds: z.array(z.number().int().positive()).max(12),
  garmentClass: z.enum(["TSHIRT", "SHIRT", "KNIT", "JACKET", "PANTS", "OTHER"]),
  note: z.string().trim().min(3).max(1000),
}).superRefine((value, context) => {
  if (value.decision === "APPROVE" && value.categoryIds.length === 0) context.addIssue({ code: "custom", path: ["categoryIds"], message: "At least one reviewed category is required" });
});

export function importProductSlug(sourceUrlHash: string) { return `sarochi-${sourceUrlHash.slice(0, 20)}`; }

export function validateCandidatePayload(raw: unknown) {
  const product = normalizedProductSchema.parse(raw);
  if (!product.sourceUrl.startsWith("https://sarochi.ir/product/") || product.media.some((item) => !item.sourceUrl.startsWith("https://sarochi.ir/wp-content/uploads/") || !/\.(?:jpe?g|png|webp)$/i.test(new URL(item.sourceUrl).pathname))) throw new Error("SOURCE_HOST_UNAPPROVED");
  if (product.variants.length === 0) throw new Error("NO_VARIANTS");
  if (product.variants.some((item) => !variantPriceSchema.safeParse({ regularPriceToman: item.regularPriceToman, salePriceToman: item.salePriceToman }).success)) throw new Error("PRICE_CONFLICT");
  return product;
}
