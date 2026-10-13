import { z } from "zod";

export const adminProductQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["", "DRAFT", "PUBLISHED", "ARCHIVED"]).default(""),
});
export type AdminProductQuery = z.infer<typeof adminProductQuerySchema>;
