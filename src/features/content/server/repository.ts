import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { assets, brands, cmsPages } from "@/db/schema";
import { brandIdentitySchema, brandPresentationSchema, readBrandSettingsRecord, type BrandIdentity } from "../brand-settings";

const getSarochiBrand = cache(async () => {
  const [brand] = await db.select({ settings: brands.settings }).from(brands).where(eq(brands.code, "SAROCHI")).limit(1);
  return brand;
});

export async function getBrandTheme() {
  const brand = await getSarochiBrand();
  return readBrandSettingsRecord(brand?.settings).theme === "CHALK" ? "CHALK" : "PORCELAIN";
}

export async function getBrandPresentation() {
  const brand = await getSarochiBrand();
  const parsed = brandPresentationSchema.safeParse(brand?.settings);
  return parsed.success ? parsed.data : null;
}

export async function getBrandIdentity(): Promise<BrandIdentity> {
  const brand = await getSarochiBrand();
  const parsed = brandIdentitySchema.safeParse(readBrandSettingsRecord(brand?.settings));
  return parsed.success ? parsed.data : {};
}

export async function getPublicBrandLogo(hash?: string): Promise<{ id: number; url: string; width: number | null; height: number | null } | null> {
  const [logo] = await db.select({ id: assets.id, url: assets.pathOrUrl, width: assets.width, height: assets.height }).from(assets)
    .innerJoin(brands, sql`${assets.id} = CAST(JSON_UNQUOTE(JSON_EXTRACT(${brands.settings}, '$.logoAssetId')) AS UNSIGNED)`)
    .where(and(eq(brands.code, "SAROCHI"), eq(assets.provenance, "OWNER_BRAND_LOGO"), eq(assets.verificationStatus, "VERIFIED"), hash ? eq(assets.sha256, hash) : undefined)).limit(1);
  return logo ?? null;
}

export async function getPublishedPage(slug: string) {
  const [page] = await db.select({ slug: cmsPages.slug, title: cmsPages.title, body: cmsPages.body, updatedAt: cmsPages.updatedAt })
    .from(cmsPages).where(and(eq(cmsPages.slug, slug), eq(cmsPages.locale, "fa-IR"), eq(cmsPages.visibility, "PUBLISHED"))).limit(1);
  return page ?? null;
}

export async function getPublishedPageLinks() {
  return db.select({ slug: cmsPages.slug, title: cmsPages.title }).from(cmsPages)
    .where(and(eq(cmsPages.locale, "fa-IR"), eq(cmsPages.visibility, "PUBLISHED"))).orderBy(cmsPages.id).limit(20);
}
