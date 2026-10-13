import "server-only";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { adminAuditEvents, assets, brands } from "@/db/schema";
import { roleAllows, type AdminRole } from "@/features/admin/auth/rules";
import { readBrandSettingsRecord } from "@/features/content/brand-settings";
import { AdminCatalogError } from "./service";
import { storeOwnerImage } from "./media-storage";

export async function uploadBrandLogo(actor: { id: number; role: AdminRole }, brandId: number, file: File) {
  if (!roleAllows(actor.role, "OWNER")) throw new AdminCatalogError("FORBIDDEN", 403);
  const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.id, brandId)).limit(1);
  if (!brand) throw new AdminCatalogError("BRAND_NOT_FOUND", 404);
  const stored = await storeOwnerImage(file);
  const assetId = await db.transaction(async (transaction) => {
    const [current] = await transaction.select({ settings: brands.settings }).from(brands).where(eq(brands.id, brandId)).limit(1).for("update");
    if (!current) throw new AdminCatalogError("BRAND_NOT_FOUND", 404);
    const inserted = await transaction.insert(assets).values({ pathOrUrl: stored.url, mime: stored.mime, sha256: stored.hash, width: stored.width, height: stored.height, sourceUrl: null, license: "Owner confirmed original brand logo publication rights; original retained privately", provenance: "OWNER_BRAND_LOGO", verificationStatus: "VERIFIED" });
    const id = inserted[0].insertId;
    await transaction.update(brands).set({ settings: { ...readBrandSettingsRecord(current.settings), logoAssetId: id } }).where(eq(brands.id, brandId));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "OWNER_BRAND_LOGO_UPLOAD", entityType: "BRAND", entityId: String(brandId), details: { assetId: id, sha256: stored.hash, originalSha256: stored.originalHash, rightsConfirmed: true } });
    return id;
  });
  revalidatePath("/", "layout");
  return { assetId, url: stored.url };
}
