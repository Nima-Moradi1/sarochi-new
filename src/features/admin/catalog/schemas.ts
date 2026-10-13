import { z } from "zod";
import { brandSettingsSchema } from "@/features/content/brand-settings";

const slug = z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/);
const id = z.number().int().positive();

export const categoryWriteSchema = z.object({
  slug,
  nameFa: z.string().trim().min(2).max(160),
  parentId: id.nullable(),
  sortOrder: z.number().int().min(0).max(100000),
  isPublished: z.boolean(),
});

export const railWriteSchema = z.object({
  slug,
  titleFa: z.string().trim().min(2).max(160),
  categoryId: id.nullable(),
  sortOrder: z.number().int().min(0).max(100000),
  isPublished: z.boolean(),
  editorialCopy: z.string().trim().max(1000).nullable().optional(),
  themeId: z.enum(["PORCELAIN", "CHALK"]).nullable().optional(),
});

export const productWriteSchema = z.object({
  slug,
  nameFa: z.string().trim().min(2).max(240),
  description: z.string().max(20000).nullable(),
  garmentClass: z.enum(["TSHIRT", "SHIRT", "KNIT", "JACKET", "PANTS", "OTHER"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  categoryIds: z.array(id).max(12),
  brandId: id.nullable(),
  familyId: id.nullable(),
});

export const brandWriteSchema = z.object({ code: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9-]+$/), nameFa: z.string().trim().min(2).max(160), nameEn: z.string().trim().max(160).nullable(), settings: brandSettingsSchema.nullable().optional() });
export const familyWriteSchema = z.object({ code: slug, titleFa: z.string().trim().min(2).max(200), reviewStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]) });
export const cmsPageWriteSchema = z.object({ slug, locale: z.literal("fa-IR"), title: z.string().trim().min(2).max(240), body: z.string().trim().min(1).max(50000), visibility: z.enum(["DRAFT", "PUBLISHED"]) });

export const catalogIdSchema = z.coerce.number().int().positive();

export const colorWriteSchema = z.object({
  slug,
  nameFa: z.string().trim().min(2).max(80),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
});

export const sizeWriteSchema = z.object({
  label: z.string().trim().min(1).max(24),
  sortOrder: z.number().int().min(0).max(10000),
});

export const variantWriteSchema = z.object({
  sku: z.string().trim().min(1).max(120).nullable(),
  colorId: id.nullable(),
  sizeId: id.nullable(),
  regularPriceToman: z.number().int().nonnegative().nullable(),
  salePriceToman: z.number().int().nonnegative().nullable(),
  stockQty: z.number().int().nonnegative().nullable(),
}).superRefine((value, context) => {
  if (value.salePriceToman !== null && (value.regularPriceToman === null || value.salePriceToman > value.regularPriceToman)) {
    context.addIssue({ code: "custom", path: ["salePriceToman"], message: "Sale price needs a valid regular price" });
  }
});

const sarochiHttpsUrl = z.url().max(2048).refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password && !url.port && (url.hostname === "sarochi.ir" || url.hostname.endsWith(".sarochi.ir"));
}, "Use an HTTPS Sarochi source URL");

export const mediaWriteSchema = z.object({
  url: z.union([sarochiHttpsUrl, z.string().regex(/^\/api\/v1\/media\/[a-f0-9]{64}$/)]),
  sourceUrl: sarochiHttpsUrl.nullable(),
  viewAngle: z.enum(["UNKNOWN", "FRONT", "BACK", "DETAIL"]),
  confidence: z.enum(["UNVERIFIED", "VERIFIED"]),
  variantId: id.nullable(),
  sortOrder: z.number().int().min(0).max(10000),
  isPrimary: z.boolean(),
}).superRefine((value, context) => {
  if (value.confidence === "VERIFIED" && value.viewAngle === "UNKNOWN") context.addIssue({ code: "custom", path: ["viewAngle"], message: "A verified image needs an inspected angle" });
  if (!value.url.startsWith("/api/v1/media/")) {
    if (!value.sourceUrl) context.addIssue({ code: "custom", path: ["sourceUrl"], message: "Source media requires provenance" });
    if (!URL.canParse(value.url) || !/\.(?:jpe?g|png|webp)$/i.test(new URL(value.url).pathname)) context.addIssue({ code: "custom", path: ["url"], message: "Supported source images are JPEG, PNG or WebP" });
  }
});

export const ownerUploadSchema = z.object({
  rightsConfirmed: z.literal(true),
  viewAngle: z.enum(["UNKNOWN", "FRONT", "BACK", "DETAIL"]),
  confidence: z.enum(["UNVERIFIED", "VERIFIED"]),
  variantId: id.nullable(),
  sortOrder: z.number().int().min(0).max(10000),
  isPrimary: z.boolean(),
}).refine((value) => value.confidence !== "VERIFIED" || value.viewAngle !== "UNKNOWN", { path: ["viewAngle"], message: "Verify an actual angle before publishing" });
