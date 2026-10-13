import "server-only";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { adminAuditEvents, assets, brands, categories, cmsPages, colors, productCategories, productFamilies, productMedia, products, productVariants, railItems, rails, sizes } from "@/db/schema";
import { roleAllows, type AdminRole } from "@/features/admin/auth/rules";
import type { z } from "zod";
import { brandWriteSchema, categoryWriteSchema, cmsPageWriteSchema, colorWriteSchema, familyWriteSchema, mediaWriteSchema, ownerUploadSchema, productWriteSchema, railWriteSchema, sizeWriteSchema, variantWriteSchema } from "../schemas";
import { storeOwnerImage } from "./media-storage";
import { adminProductQuerySchema } from "../product-query";
import { persistSarochiImage } from "@/features/import/server/media";
import { readBrandSettingsRecord } from "@/features/content/brand-settings";

export class AdminCatalogError extends Error { constructor(message: string, public status: number) { super(message); } }
type Actor = { id: number; role: AdminRole };
type CategoryWrite = z.infer<typeof categoryWriteSchema>;
type RailWrite = z.infer<typeof railWriteSchema>;
type ProductWrite = z.infer<typeof productWriteSchema>;
type ColorWrite = z.infer<typeof colorWriteSchema>;
type SizeWrite = z.infer<typeof sizeWriteSchema>;
type VariantWrite = z.infer<typeof variantWriteSchema>;
type MediaWrite = z.infer<typeof mediaWriteSchema>;
type OwnerUpload = z.infer<typeof ownerUploadSchema>;
type BrandWrite = z.infer<typeof brandWriteSchema>;
type FamilyWrite = z.infer<typeof familyWriteSchema>;
type CmsPageWrite = z.infer<typeof cmsPageWriteSchema>;

function assertEditor(actor: Actor) { if (!roleAllows(actor.role, "EDIT")) throw new AdminCatalogError("FORBIDDEN", 403); }
function refreshCatalog(slug?: string) {
  revalidatePath("/"); revalidatePath("/shop");
  if (slug) { revalidatePath(`/products/${slug}`); revalidatePath(`/style/${slug}`); }
}

export async function getAdminCatalogOverview(productPage = 1, rawFilter: unknown = {}) {
  if (!Number.isInteger(productPage) || productPage < 1 || productPage > 10000) throw new AdminCatalogError("INVALID_PAGE", 400);
  const productFilters = adminProductQuerySchema.parse(rawFilter);
  const pattern = `%${productFilters.q.replace(/[\\%_]/g, "\\$&")}%`;
  const [categoryRows, railRows, productRows, colorRows, sizeRows, brandRows, familyRows, pageRows] = await Promise.all([
    db.select({ id: categories.id, slug: categories.slug, nameFa: categories.nameFa, parentId: categories.parentId, sortOrder: categories.sortOrder, isPublished: categories.isPublished }).from(categories).orderBy(categories.sortOrder),
    db.select({ id: rails.id, slug: rails.slug, titleFa: rails.titleFa, categoryId: rails.categoryId, sortOrder: rails.sortOrder, isPublished: rails.isPublished, themeId: rails.themeId, editorialCopy: rails.editorialCopy }).from(rails).orderBy(rails.sortOrder),
    db.select({ id: products.id, slug: products.slug, nameFa: products.nameFa, description: products.description, garmentClass: products.garmentClass, status: products.status, sourceType: products.sourceType, brandId: products.brandId, familyId: products.familyId }).from(products).where(and(productFilters.status ? eq(products.status, productFilters.status) : undefined, productFilters.q ? or(like(products.nameFa, pattern), like(products.slug, pattern)) : undefined)).orderBy(products.id).limit(51).offset((productPage - 1) * 50),
    db.select({ id: colors.id, slug: colors.slug, nameFa: colors.nameFa, hex: colors.hex }).from(colors).orderBy(colors.id),
    db.select({ id: sizes.id, label: sizes.label, sortOrder: sizes.sortOrder }).from(sizes).orderBy(sizes.sortOrder),
    db.select({ id: brands.id, code: brands.code, nameFa: brands.nameFa, nameEn: brands.nameEn, settings: brands.settings }).from(brands).orderBy(brands.id),
    db.select({ id: productFamilies.id, code: productFamilies.code, titleFa: productFamilies.titleFa, reviewStatus: productFamilies.reviewStatus }).from(productFamilies).orderBy(productFamilies.id),
    db.select({ id: cmsPages.id, slug: cmsPages.slug, locale: cmsPages.locale, title: cmsPages.title, body: cmsPages.body, visibility: cmsPages.visibility }).from(cmsPages).orderBy(cmsPages.id),
  ]);
  const hasNextProducts = productRows.length > 50;
  const visibleProducts = productRows.slice(0, 50);
  const ids = visibleProducts.map((row) => row.id);
  const productCategoryRows = ids.length ? await db.select({ productId: productCategories.productId, categoryId: productCategories.categoryId }).from(productCategories).where(inArray(productCategories.productId, ids)) : [];
  const railItemRows = railRows.length ? await db.select({ railId: railItems.railId, productId: railItems.productId, position: railItems.position }).from(railItems).where(inArray(railItems.railId, railRows.map((row) => row.id))).orderBy(railItems.railId, railItems.position) : [];
  const variantRows = ids.length ? await db.select({ id: productVariants.id, productId: productVariants.productId, sku: productVariants.sku, colorId: productVariants.colorId, sizeId: productVariants.sizeId, regularPriceToman: productVariants.regularPriceToman, salePriceToman: productVariants.salePriceToman, stockQty: productVariants.stockQty }).from(productVariants).where(inArray(productVariants.productId, ids)).orderBy(productVariants.productId, productVariants.id) : [];
  const mediaRows = ids.length ? await db.select({ id: productMedia.id, productId: productMedia.productId, variantId: productMedia.variantId, url: assets.pathOrUrl, sourceUrl: assets.sourceUrl, viewAngle: productMedia.viewAngle, confidence: productMedia.confidence, sortOrder: productMedia.sortOrder, isPrimary: productMedia.isPrimary }).from(productMedia).innerJoin(assets, eq(productMedia.assetId, assets.id)).where(inArray(productMedia.productId, ids)).orderBy(productMedia.productId, productMedia.sortOrder, productMedia.id) : [];
  return {
    categories: categoryRows,
    rails: railRows.map((rail) => ({ ...rail, productIds: railItemRows.filter((item) => item.railId === rail.id).map((item) => item.productId) })),
    products: visibleProducts.map((product) => ({ ...product, categoryIds: productCategoryRows.filter((item) => item.productId === product.id).map((item) => item.categoryId) })),
    productPage,
    productFilters,
    hasNextProducts,
    colors: colorRows,
    sizes: sizeRows,
    brands: brandRows,
    families: familyRows,
    pages: pageRows,
    variants: variantRows,
    media: mediaRows,
  };
}

export async function getAdminProductMedia(productId: number) {
  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
  return db.select({ id: productMedia.id, productId: productMedia.productId, variantId: productMedia.variantId, url: assets.pathOrUrl, sourceUrl: assets.sourceUrl, viewAngle: productMedia.viewAngle, confidence: productMedia.confidence, sortOrder: productMedia.sortOrder, isPrimary: productMedia.isPrimary })
    .from(productMedia).innerJoin(assets, eq(productMedia.assetId, assets.id))
    .where(eq(productMedia.productId, productId)).orderBy(productMedia.sortOrder, productMedia.id);
}

export async function uploadOwnerMedia(actor: Actor, productId: number, input: OwnerUpload, file: File) {
  if (!roleAllows(actor.role, "OWNER")) throw new AdminCatalogError("FORBIDDEN", 403);
  const [product] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
  if (input.variantId !== null) {
    const [variant] = await db.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.id, input.variantId), eq(productVariants.productId, productId))).limit(1);
    if (!variant) throw new AdminCatalogError("VARIANT_NOT_FOUND", 404);
  }
  const stored = await storeOwnerImage(file);
  const mediaId = await db.transaction(async (transaction) => {
    const insertedAsset = await transaction.insert(assets).values({ pathOrUrl: stored.url, mime: stored.mime, sha256: stored.hash, width: stored.width, height: stored.height, sourceUrl: null, license: "Owner confirmed publication rights; original retained privately", provenance: "OWNER_UPLOAD", verificationStatus: input.confidence });
    const assetId = insertedAsset[0].insertId;
    if (input.isPrimary) await transaction.update(productMedia).set({ isPrimary: false }).where(eq(productMedia.productId, productId));
    const insertedMedia = await transaction.insert(productMedia).values({ productId, assetId, variantId: input.variantId, viewAngle: input.viewAngle, confidence: input.confidence, sortOrder: input.sortOrder, isPrimary: input.isPrimary });
    const id = insertedMedia[0].insertId;
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "OWNER_MEDIA_UPLOAD", entityType: "PRODUCT_MEDIA", entityId: String(id), details: { productId, assetId, sha256: stored.hash, originalSha256: stored.originalHash, rightsConfirmed: input.rightsConfirmed, viewAngle: input.viewAngle, confidence: input.confidence } });
    return id;
  });
  refreshCatalog(product.slug);
  return { id: mediaId, url: stored.url };
}

export async function saveMedia(actor: Actor, productId: number, input: MediaWrite, id?: number) {
  assertEditor(actor);
  const stored = input.url.startsWith("/api/v1/media/") ? null : await persistSarochiImage(input.url);
  const result = await db.transaction(async (transaction) => {
    const [product] = await transaction.select({ slug: products.slug }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
    if (input.variantId !== null) {
      const [variant] = await transaction.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.id, input.variantId), eq(productVariants.productId, productId))).limit(1);
      if (!variant) throw new AdminCatalogError("VARIANT_NOT_FOUND", 404);
    }
    const [existing] = id ? await transaction.select({ id: productMedia.id, assetId: assets.id, url: assets.pathOrUrl, provenance: assets.provenance }).from(productMedia).innerJoin(assets, eq(productMedia.assetId, assets.id)).where(and(eq(productMedia.id, id), eq(productMedia.productId, productId))).limit(1) : [];
    if (id && !existing) throw new AdminCatalogError("MEDIA_NOT_FOUND", 404);
    let assetId: number;
    if (input.url.startsWith("/api/v1/media/")) {
      if (!existing || !["OWNER_UPLOAD", "SAROCHI_SOURCE"].includes(existing.provenance) || existing.url !== input.url) throw new AdminCatalogError("INVALID_OWNER_MEDIA", 400);
      assetId = existing.assetId;
      await transaction.update(assets).set({ verificationStatus: input.confidence }).where(eq(assets.id, assetId));
    } else {
      if (!stored) throw new AdminCatalogError("MEDIA_NOT_STORED", 503);
      const insertedAsset = await transaction.insert(assets).values({ pathOrUrl: stored.url, mime: stored.mime, sha256: stored.hash, width: stored.width, height: stored.height, sourceUrl: input.url, license: "Owner source catalog; original retained privately", provenance: "SAROCHI_SOURCE", verificationStatus: input.confidence });
      assetId = insertedAsset[0].insertId;
    }
    if (input.isPrimary) await transaction.update(productMedia).set({ isPrimary: false }).where(eq(productMedia.productId, productId));
    const mediaValues = { assetId, variantId: input.variantId, viewAngle: input.viewAngle, confidence: input.confidence, sortOrder: input.sortOrder, isPrimary: input.isPrimary };
    if (id) await transaction.update(productMedia).set(mediaValues).where(and(eq(productMedia.id, id), eq(productMedia.productId, productId)));
    else { const inserted = await transaction.insert(productMedia).values({ productId, ...mediaValues }); id = inserted[0].insertId; }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "MEDIA_SAVE", entityType: "PRODUCT_MEDIA", entityId: String(id), details: { productId, assetId, viewAngle: input.viewAngle, confidence: input.confidence } });
    return { id: id!, slug: product.slug };
  });
  refreshCatalog(result.slug);
  return { id: result.id };
}

export async function deleteMedia(actor: Actor, productId: number, id: number) {
  assertEditor(actor);
  const slug = await db.transaction(async (transaction) => {
    const [product] = await transaction.select({ slug: products.slug }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
    const [existing] = await transaction.select({ id: productMedia.id }).from(productMedia).where(and(eq(productMedia.id, id), eq(productMedia.productId, productId))).limit(1);
    if (!existing) throw new AdminCatalogError("MEDIA_NOT_FOUND", 404);
    await transaction.delete(productMedia).where(eq(productMedia.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "MEDIA_DELETE", entityType: "PRODUCT_MEDIA", entityId: String(id), details: { productId } });
    return product.slug;
  });
  refreshCatalog(slug);
}

export async function saveCategory(actor: Actor, input: CategoryWrite, id?: number) {
  assertEditor(actor);
  if (id && input.parentId === id) throw new AdminCatalogError("CATEGORY_SELF_PARENT", 400);
  const creating = id === undefined;
  const result = await db.transaction(async (transaction) => {
    let ancestor = input.parentId;
    const visited = new Set<number>();
    while (ancestor !== null) {
      if (ancestor === id || visited.has(ancestor)) throw new AdminCatalogError("CATEGORY_CYCLE", 400);
      visited.add(ancestor);
      const [parent] = await transaction.select({ parentId: categories.parentId }).from(categories).where(eq(categories.id, ancestor)).limit(1);
      if (!parent) throw new AdminCatalogError("PARENT_NOT_FOUND", 400);
      ancestor = parent.parentId;
    }
    if (id) {
      const [existing] = await transaction.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1);
      if (!existing) throw new AdminCatalogError("CATEGORY_NOT_FOUND", 404);
      await transaction.update(categories).set(input).where(eq(categories.id, id));
    } else {
      const inserted = await transaction.insert(categories).values(input);
      id = inserted[0].insertId;
    }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: creating ? "CATEGORY_CREATE" : "CATEGORY_SAVE", entityType: "CATEGORY", entityId: String(id), details: { fields: Object.keys(input) } });
    return id!;
  });
  refreshCatalog();
  return { id: result };
}

export async function deleteCategory(actor: Actor, id: number) {
  assertEditor(actor);
  await db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("CATEGORY_NOT_FOUND", 404);
    const [child] = await transaction.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1);
    const [product] = await transaction.select({ id: productCategories.productId }).from(productCategories).where(eq(productCategories.categoryId, id)).limit(1);
    const [rail] = await transaction.select({ id: rails.id }).from(rails).where(eq(rails.categoryId, id)).limit(1);
    if (child || product || rail) throw new AdminCatalogError("CATEGORY_IN_USE", 409);
    await transaction.delete(categories).where(eq(categories.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "CATEGORY_DELETE", entityType: "CATEGORY", entityId: String(id) });
  });
  refreshCatalog();
}

export async function saveRail(actor: Actor, input: RailWrite, id?: number) {
  assertEditor(actor);
  const result = await db.transaction(async (transaction) => {
    if (id) {
      const [existing] = await transaction.select({ id: rails.id }).from(rails).where(eq(rails.id, id)).limit(1);
      if (!existing) throw new AdminCatalogError("RAIL_NOT_FOUND", 404);
      await transaction.update(rails).set(input).where(eq(rails.id, id));
    } else {
      const inserted = await transaction.insert(rails).values(input);
      id = inserted[0].insertId;
    }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "RAIL_SAVE", entityType: "RAIL", entityId: String(id), details: { fields: Object.keys(input) } });
    return id!;
  });
  refreshCatalog();
  return { id: result };
}

export async function deleteRail(actor: Actor, id: number) {
  assertEditor(actor);
  await db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ id: rails.id }).from(rails).where(eq(rails.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("RAIL_NOT_FOUND", 404);
    await transaction.delete(railItems).where(eq(railItems.railId, id));
    await transaction.delete(rails).where(eq(rails.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "RAIL_DELETE", entityType: "RAIL", entityId: String(id) });
  });
  refreshCatalog();
}

export async function saveProduct(actor: Actor, input: ProductWrite, id?: number) {
  assertEditor(actor);
  const categoryIds = [...new Set(input.categoryIds)];
  if (input.status === "PUBLISHED" && categoryIds.length === 0) throw new AdminCatalogError("PUBLISHED_PRODUCT_NEEDS_CATEGORY", 400);
  const result = await db.transaction(async (transaction) => {
    if (input.brandId !== null) {
      const [brand] = await transaction.select({ id: brands.id }).from(brands).where(eq(brands.id, input.brandId)).limit(1);
      if (!brand) throw new AdminCatalogError("BRAND_NOT_FOUND", 400);
    }
    if (input.familyId !== null) {
      const [family] = await transaction.select({ reviewStatus: productFamilies.reviewStatus }).from(productFamilies).where(eq(productFamilies.id, input.familyId)).limit(1);
      if (!family) throw new AdminCatalogError("FAMILY_NOT_FOUND", 400);
      if (family.reviewStatus !== "APPROVED") throw new AdminCatalogError("FAMILY_NEEDS_REVIEW", 409);
    }
    let oldSlug: string | undefined;
    if (id) {
      const [existing] = await transaction.select({ slug: products.slug }).from(products).where(eq(products.id, id)).limit(1);
      if (!existing) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
      oldSlug = existing.slug;
      if (input.status === "PUBLISHED") {
        const [variant] = await transaction.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id)).limit(1);
        if (!variant) throw new AdminCatalogError("PUBLISHED_PRODUCT_NEEDS_VARIANT", 400);
      }
      await transaction.update(products).set({ slug: input.slug, nameFa: input.nameFa, description: input.description, garmentClass: input.garmentClass, status: input.status, brandId: input.brandId, familyId: input.familyId }).where(eq(products.id, id));
      await transaction.delete(productCategories).where(eq(productCategories.productId, id));
    } else {
      if (input.status === "PUBLISHED") throw new AdminCatalogError("CREATE_AS_DRAFT_FIRST", 400);
      const inserted = await transaction.insert(products).values({ slug: input.slug, nameFa: input.nameFa, description: input.description, garmentClass: input.garmentClass, brandId: input.brandId, familyId: input.familyId, status: "DRAFT", sourceType: "MANUAL" });
      id = inserted[0].insertId;
    }
    if (categoryIds.length) await transaction.insert(productCategories).values(categoryIds.map((categoryId) => ({ productId: id!, categoryId })));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "PRODUCT_SAVE", entityType: "PRODUCT", entityId: String(id), details: { fields: ["slug", "nameFa", "description", "garmentClass", "status", "categoryIds", "brandId", "familyId"] } });
    return { id: id!, oldSlug };
  });
  refreshCatalog(input.slug);
  if (result.oldSlug && result.oldSlug !== input.slug) revalidatePath(`/products/${result.oldSlug}`);
  return { id: result.id };
}

export async function archiveProduct(actor: Actor, id: number) {
  assertEditor(actor);
  const slug = await db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ slug: products.slug }).from(products).where(eq(products.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
    await transaction.update(products).set({ status: "ARCHIVED" }).where(eq(products.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "PRODUCT_ARCHIVE", entityType: "PRODUCT", entityId: String(id) });
    return existing.slug;
  });
  refreshCatalog(slug);
}

export async function assignRailItems(actor: Actor, railId: number, productIds: number[]) {
  assertEditor(actor);
  const unique = [...new Set(productIds)];
  if (unique.length !== productIds.length || unique.length > 100) throw new AdminCatalogError("INVALID_RAIL_ITEMS", 400);
  await db.transaction(async (transaction) => {
    const [rail] = await transaction.select({ id: rails.id }).from(rails).where(eq(rails.id, railId)).limit(1);
    if (!rail) throw new AdminCatalogError("RAIL_NOT_FOUND", 404);
    if (unique.length) {
      const found = await transaction.select({ id: products.id }).from(products).where(inArray(products.id, unique));
      if (found.length !== unique.length) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
    }
    await transaction.delete(railItems).where(eq(railItems.railId, railId));
    if (unique.length) await transaction.insert(railItems).values(unique.map((productId, position) => ({ railId, productId, position })));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "RAIL_REORDER", entityType: "RAIL", entityId: String(railId), details: { productIds: unique } });
  });
  refreshCatalog();
}

export async function saveColor(actor: Actor, input: ColorWrite, id?: number) {
  assertEditor(actor);
  const result = await db.transaction(async (transaction) => {
    if (id) {
      const [existing] = await transaction.select({ id: colors.id }).from(colors).where(eq(colors.id, id)).limit(1);
      if (!existing) throw new AdminCatalogError("COLOR_NOT_FOUND", 404);
      await transaction.update(colors).set(input).where(eq(colors.id, id));
    } else {
      const inserted = await transaction.insert(colors).values(input);
      id = inserted[0].insertId;
    }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "COLOR_SAVE", entityType: "COLOR", entityId: String(id), details: { fields: Object.keys(input) } });
    return id!;
  });
  refreshCatalog();
  return { id: result };
}

export async function deleteColor(actor: Actor, id: number) {
  assertEditor(actor);
  await db.transaction(async (transaction) => {
    const [used] = await transaction.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.colorId, id)).limit(1);
    if (used) throw new AdminCatalogError("COLOR_IN_USE", 409);
    const [existing] = await transaction.select({ id: colors.id }).from(colors).where(eq(colors.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("COLOR_NOT_FOUND", 404);
    await transaction.delete(colors).where(eq(colors.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "COLOR_DELETE", entityType: "COLOR", entityId: String(id) });
  });
  refreshCatalog();
}

export async function saveSize(actor: Actor, input: SizeWrite, id?: number) {
  assertEditor(actor);
  const result = await db.transaction(async (transaction) => {
    if (id) {
      const [existing] = await transaction.select({ id: sizes.id }).from(sizes).where(eq(sizes.id, id)).limit(1);
      if (!existing) throw new AdminCatalogError("SIZE_NOT_FOUND", 404);
      await transaction.update(sizes).set(input).where(eq(sizes.id, id));
    } else {
      const inserted = await transaction.insert(sizes).values(input);
      id = inserted[0].insertId;
    }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "SIZE_SAVE", entityType: "SIZE", entityId: String(id), details: { fields: Object.keys(input) } });
    return id!;
  });
  refreshCatalog();
  return { id: result };
}

export async function deleteSize(actor: Actor, id: number) {
  assertEditor(actor);
  await db.transaction(async (transaction) => {
    const [used] = await transaction.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.sizeId, id)).limit(1);
    if (used) throw new AdminCatalogError("SIZE_IN_USE", 409);
    const [existing] = await transaction.select({ id: sizes.id }).from(sizes).where(eq(sizes.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("SIZE_NOT_FOUND", 404);
    await transaction.delete(sizes).where(eq(sizes.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "SIZE_DELETE", entityType: "SIZE", entityId: String(id) });
  });
  refreshCatalog();
}

export async function saveBrand(actor: Actor, input: BrandWrite, id?: number) {
  assertEditor(actor);
  const result = await db.transaction(async (transaction) => {
    const [current] = id ? await transaction.select({ id: brands.id, settings: brands.settings }).from(brands).where(eq(brands.id, id)).limit(1) : [];
    if (id && !current) throw new AdminCatalogError("BRAND_NOT_FOUND", 404);
    const previousLogo = readBrandSettingsRecord(current?.settings).logoAssetId ?? null;
    const nextLogo = input.settings === undefined ? previousLogo : input.settings?.logoAssetId ?? null;
    if (nextLogo !== previousLogo && actor.role !== "OWNER") throw new AdminCatalogError("OWNER_LOGO_PERMISSION_REQUIRED", 403);
    if (nextLogo !== null) {
      if (typeof nextLogo !== "number" || !Number.isSafeInteger(nextLogo)) throw new AdminCatalogError("INVALID_LOGO", 400);
      const [logo] = await transaction.select({ id: assets.id }).from(assets).where(and(eq(assets.id, nextLogo), eq(assets.provenance, "OWNER_BRAND_LOGO"), eq(assets.verificationStatus, "VERIFIED"))).limit(1);
      if (!logo) throw new AdminCatalogError("INVALID_LOGO", 400);
    }
    if (id) {
      await transaction.update(brands).set(input).where(eq(brands.id, id));
    } else { const inserted = await transaction.insert(brands).values(input); id = inserted[0].insertId; }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "BRAND_SAVE", entityType: "BRAND", entityId: String(id), details: { fields: Object.keys(input) } });
    return id!;
  });
  refreshCatalog(); revalidatePath("/", "layout");
  return { id: result };
}

export async function deleteBrand(actor: Actor, id: number) {
  assertEditor(actor);
  await db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ id: brands.id }).from(brands).where(eq(brands.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("BRAND_NOT_FOUND", 404);
    const [used] = await transaction.select({ id: products.id }).from(products).where(eq(products.brandId, id)).limit(1);
    if (used) throw new AdminCatalogError("BRAND_IN_USE", 409);
    await transaction.delete(brands).where(eq(brands.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "BRAND_DELETE", entityType: "BRAND", entityId: String(id) });
  });
  refreshCatalog();
}

export async function saveFamily(actor: Actor, input: FamilyWrite, id?: number) {
  assertEditor(actor);
  const result = await db.transaction(async (transaction) => {
    if (id) {
      const [existing] = await transaction.select({ id: productFamilies.id }).from(productFamilies).where(eq(productFamilies.id, id)).limit(1);
      if (!existing) throw new AdminCatalogError("FAMILY_NOT_FOUND", 404);
      if (input.reviewStatus !== "APPROVED") {
        const [used] = await transaction.select({ id: products.id }).from(products).where(eq(products.familyId, id)).limit(1);
        if (used) throw new AdminCatalogError("FAMILY_IN_USE", 409);
      }
      await transaction.update(productFamilies).set(input).where(eq(productFamilies.id, id));
    } else { const inserted = await transaction.insert(productFamilies).values(input); id = inserted[0].insertId; }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "FAMILY_SAVE", entityType: "PRODUCT_FAMILY", entityId: String(id), details: { fields: Object.keys(input), reviewStatus: input.reviewStatus } });
    return id!;
  });
  refreshCatalog();
  return { id: result };
}

export async function deleteFamily(actor: Actor, id: number) {
  assertEditor(actor);
  await db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ id: productFamilies.id }).from(productFamilies).where(eq(productFamilies.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("FAMILY_NOT_FOUND", 404);
    const [used] = await transaction.select({ id: products.id }).from(products).where(eq(products.familyId, id)).limit(1);
    if (used) throw new AdminCatalogError("FAMILY_IN_USE", 409);
    await transaction.delete(productFamilies).where(eq(productFamilies.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "FAMILY_DELETE", entityType: "PRODUCT_FAMILY", entityId: String(id) });
  });
  refreshCatalog();
}

export async function saveCmsPage(actor: Actor, input: CmsPageWrite, id?: number) {
  assertEditor(actor);
  const result = await db.transaction(async (transaction) => {
    let oldSlug: string | undefined;
    if (id) {
      const [existing] = await transaction.select({ slug: cmsPages.slug }).from(cmsPages).where(eq(cmsPages.id, id)).limit(1);
      if (!existing) throw new AdminCatalogError("PAGE_NOT_FOUND", 404);
      oldSlug = existing.slug;
      await transaction.update(cmsPages).set({ ...input, updatedAt: new Date() }).where(eq(cmsPages.id, id));
    } else { const inserted = await transaction.insert(cmsPages).values(input); id = inserted[0].insertId; }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "CMS_SAVE", entityType: "CMS_PAGE", entityId: String(id), details: { slug: input.slug, visibility: input.visibility } });
    return { id: id!, oldSlug };
  });
  revalidatePath(`/pages/${input.slug}`);
  revalidatePath("/");
  if (result.oldSlug && result.oldSlug !== input.slug) revalidatePath(`/pages/${result.oldSlug}`);
  return { id: result.id };
}

export async function deleteCmsPage(actor: Actor, id: number) {
  assertEditor(actor);
  const slug = await db.transaction(async (transaction) => {
    const [existing] = await transaction.select({ slug: cmsPages.slug }).from(cmsPages).where(eq(cmsPages.id, id)).limit(1);
    if (!existing) throw new AdminCatalogError("PAGE_NOT_FOUND", 404);
    await transaction.delete(cmsPages).where(eq(cmsPages.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "CMS_DELETE", entityType: "CMS_PAGE", entityId: String(id) });
    return existing.slug;
  });
  revalidatePath(`/pages/${slug}`);
  revalidatePath("/");
}

export async function saveVariant(actor: Actor, productId: number, input: VariantWrite, id?: number) {
  assertEditor(actor);
  const stockStatus = input.stockQty === null ? "UNKNOWN" : input.stockQty > 0 ? "IN_STOCK" : "OUT_OF_STOCK";
  const slug = await db.transaction(async (transaction) => {
    const [product] = await transaction.select({ slug: products.slug }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
    if (id) {
      const [existing] = await transaction.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.id, id), eq(productVariants.productId, productId))).limit(1);
      if (!existing) throw new AdminCatalogError("VARIANT_NOT_FOUND", 404);
      await transaction.update(productVariants).set({ ...input, stockStatus }).where(and(eq(productVariants.id, id), eq(productVariants.productId, productId)));
    } else {
      const inserted = await transaction.insert(productVariants).values({ productId, ...input, stockStatus });
      id = inserted[0].insertId;
    }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "VARIANT_SAVE", entityType: "PRODUCT_VARIANT", entityId: String(id), details: { productId, fields: Object.keys(input) } });
    return product.slug;
  });
  refreshCatalog(slug);
  return { id: id! };
}

export async function deleteVariant(actor: Actor, productId: number, id: number) {
  assertEditor(actor);
  const slug = await db.transaction(async (transaction) => {
    const [product] = await transaction.select({ slug: products.slug, status: products.status }).from(products).where(eq(products.id, productId)).limit(1);
    if (!product) throw new AdminCatalogError("PRODUCT_NOT_FOUND", 404);
    const variants = await transaction.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, productId));
    if (!variants.some((item) => item.id === id)) throw new AdminCatalogError("VARIANT_NOT_FOUND", 404);
    if (product.status === "PUBLISHED" && variants.length === 1) throw new AdminCatalogError("PUBLISHED_PRODUCT_NEEDS_VARIANT", 409);
    await transaction.delete(productVariants).where(eq(productVariants.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "VARIANT_DELETE", entityType: "PRODUCT_VARIANT", entityId: String(id), details: { productId } });
    return product.slug;
  });
  refreshCatalog(slug);
}
