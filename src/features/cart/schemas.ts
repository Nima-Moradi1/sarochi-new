import { z } from "zod";

export const cartItemsSchema = z.array(z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
})).min(1).max(20).superRefine((items, context) => {
  const seen = new Set<number>();
  for (const [index, item] of items.entries()) {
    if (seen.has(item.variantId)) context.addIssue({ code: "custom", path: [index, "variantId"], message: "Duplicate variant" });
    seen.add(item.variantId);
  }
});

export type CartItemInput = z.infer<typeof cartItemsSchema>[number];
