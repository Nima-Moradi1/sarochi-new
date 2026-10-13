import { z } from "zod";

export const brandPresentationSchema = z.object({
  heroEyebrowFa: z.string().trim().min(2).max(100),
  heroHeadingFa: z.string().trim().min(4).max(240),
  heroAccentFa: z.string().trim().min(2).max(120),
  heroDescriptionFa: z.string().trim().min(8).max(600),
  heroCtaFa: z.string().trim().min(2).max(80),
});

export type BrandPresentation = z.infer<typeof brandPresentationSchema>;

export const stylingPresetSchema = z.object({
  id: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
  labelFa: z.string().trim().min(2).max(80),
  shoulder: z.number().finite().min(0.38).max(0.65),
  bodyScale: z.number().finite().min(0.85).max(1.2),
});

export const stylingPresetsSchema = z.array(stylingPresetSchema).max(8).refine(
  (presets) => new Set(presets.map((preset) => preset.id)).size === presets.length,
  { message: "شناسه فرم‌ها باید یکتا باشد." },
);

// Retain unrelated JSON settings when a bounded, known setting is edited.
export const brandIdentitySchema = z.object({
  logoAssetId: z.number().int().positive().max(2147483647).nullable().optional(),
  typography: z.enum(["VAZIRMATN", "SYSTEM"]).optional(),
  theme: z.enum(["PORCELAIN", "CHALK"]).optional(),
  footerTextFa: z.string().trim().max(600).optional(),
  contact: z.object({
    email: z.string().trim().email().max(254).nullable().optional(),
    phone: z.string().trim().min(3).max(40).regex(/^[+0-9 ()-]+$/).nullable().optional(),
    addressFa: z.string().trim().max(500).optional(),
  }).optional(),
  socialLinks: z.array(z.object({
    labelFa: z.string().trim().min(2).max(60),
    url: z.string().trim().url().max(2048).refine((value) => {
      try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
    }, { message: "نشانی شبکه اجتماعی باید HTTPS باشد." }),
  })).max(6).optional(),
});

export const brandSettingsSchema = brandPresentationSchema.extend({
  ...brandIdentitySchema.shape,
  stylingPresets: stylingPresetsSchema.optional(),
}).passthrough();

export type StylingPreset = z.infer<typeof stylingPresetSchema>;
export type BrandSettings = z.infer<typeof brandSettingsSchema>;
export type BrandIdentity = z.infer<typeof brandIdentitySchema>;

export function readBrandSettingsRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
