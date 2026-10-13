import { z } from "zod";

export const railQuerySchema = z.object({
  category: z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/).optional(),
  limit: z.coerce.number().int().min(1).max(12).default(8),
});

export type RailQuery = z.infer<typeof railQuerySchema>;

const slug = z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/);
const flag = z.union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .transform((value) => value === true || value === "true" || value === "1");
const cursor = z.union([
  z.number().int().positive().max(2_147_483_647),
  z.string().max(80).regex(/^(?:[1-9]\d*|price_(?:asc|desc):(?:\d+|unknown):[1-9]\d*)$/),
]).transform((value) => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value)
  .refine((value) => typeof value === "number" ? value <= 2_147_483_647
    : value.split(":").slice(1).every((part) => part === "unknown" || Number(part) <= 2_147_483_647), "Invalid cursor bounds");

export const productQueryKeys = ["q", "category", "color", "size", "minPrice", "maxPrice", "inStock", "onSale", "sort", "cursor", "limit"] as const;

export const productQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  category: slug.optional(),
  color: slug.optional(),
  size: z.string().trim().min(1).max(24).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: flag.optional(),
  onSale: flag.optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  cursor: cursor.optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12),
}).refine((query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
  path: ["maxPrice"], message: "Maximum price must be at least minimum price",
}).superRefine((query, context) => {
  if (query.cursor === undefined) return;
  const cursorSort = typeof query.cursor === "number" ? "newest" : query.cursor.split(":")[0];
  if (cursorSort !== query.sort) context.addIssue({ code: "custom", path: ["cursor"], message: "Cursor must match selected sort" });
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
