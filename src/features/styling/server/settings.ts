import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brands } from "@/db/schema";
import { readBrandSettingsRecord, stylingPresetsSchema } from "@/features/content/brand-settings";

export async function getStylingPresets() {
  const [brand] = await db.select({ settings: brands.settings }).from(brands).where(eq(brands.code, "SAROCHI")).limit(1);
  const parsed = stylingPresetsSchema.safeParse(readBrandSettingsRecord(brand?.settings).stylingPresets);
  return parsed.success ? parsed.data : [];
}
