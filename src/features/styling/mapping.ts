import { z } from "zod";

export const stylingGarmentSchema = z.enum(["TSHIRT", "SHIRT", "KNIT", "JACKET", "PANTS", "OTHER"]);
export const stylingMappingWriteSchema = z.object({
  garmentClass: stylingGarmentSchema,
  presetId: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  fidelity: z.literal("CONCEPTUAL"),
}).strict();

export const stylingMappingSchema = stylingMappingWriteSchema.extend({ variantId: z.number().int().positive() });
export type StylingMappingWrite = z.infer<typeof stylingMappingWriteSchema>;
export type StylingMappingDTO = z.infer<typeof stylingMappingSchema>;
