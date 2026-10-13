import "server-only";
import { and, eq, inArray, like, or } from "drizzle-orm";
import { db } from "@/db/client";
import { brands, categories, cmsPages, colors, productCategories, productFamilies, products, railItems, rails, sizes } from "@/db/schema";
import { AdminCatalogError } from "./service";
import { adminProductQuerySchema } from "../product-query";

export type AdminResourceKind = "categories" | "rails" | "products" | "colors" | "sizes" | "brands" | "families" | "pages";
const PAGE_SIZE = 50;

function result<T>(rows: T[], page: number) {
  return { items: rows.slice(0, PAGE_SIZE), page, hasNext: rows.length > PAGE_SIZE };
}

/** Fetch only the requested resource, plus relationships for its visible rows. */
export async function getAdminResourcePage(kind: AdminResourceKind, page: number, rawFilter: unknown = {}) {
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw new AdminCatalogError("INVALID_PAGE", 400);
  const offset = (page - 1) * PAGE_SIZE;
  if (kind === "categories") {
    return result(await db.select({ id: categories.id, slug: categories.slug, nameFa: categories.nameFa, parentId: categories.parentId, sortOrder: categories.sortOrder, isPublished: categories.isPublished }).from(categories).orderBy(categories.sortOrder, categories.id).limit(PAGE_SIZE + 1).offset(offset), page);
  }
  if (kind === "rails") {
    const rows = await db.select({ id: rails.id, slug: rails.slug, titleFa: rails.titleFa, categoryId: rails.categoryId, sortOrder: rails.sortOrder, isPublished: rails.isPublished, themeId: rails.themeId, editorialCopy: rails.editorialCopy }).from(rails).orderBy(rails.sortOrder, rails.id).limit(PAGE_SIZE + 1).offset(offset);
    const visible = rows.slice(0, PAGE_SIZE);
    const items = visible.length ? await db.select({ railId: railItems.railId, productId: railItems.productId }).from(railItems).where(inArray(railItems.railId, visible.map((row) => row.id))).orderBy(railItems.railId, railItems.position) : [];
    return { ...result(rows, page), items: visible.map((rail) => ({ ...rail, productIds: items.filter((item) => item.railId === rail.id).map((item) => item.productId) })) };
  }
  if (kind === "products") {
    const filter = adminProductQuerySchema.parse(rawFilter);
    const pattern = `%${filter.q.replace(/[\\%_]/g, "\\$&")}%`;
    const rows = await db.select({ id: products.id, slug: products.slug, nameFa: products.nameFa, description: products.description, garmentClass: products.garmentClass, status: products.status, sourceType: products.sourceType, brandId: products.brandId, familyId: products.familyId }).from(products).where(and(filter.status ? eq(products.status, filter.status) : undefined, filter.q ? or(like(products.nameFa, pattern), like(products.slug, pattern)) : undefined)).orderBy(products.id).limit(PAGE_SIZE + 1).offset(offset);
    const visible = rows.slice(0, PAGE_SIZE);
    const links = visible.length ? await db.select({ productId: productCategories.productId, categoryId: productCategories.categoryId }).from(productCategories).where(inArray(productCategories.productId, visible.map((row) => row.id))) : [];
    return { ...result(rows, page), items: visible.map((product) => ({ ...product, categoryIds: links.filter((link) => link.productId === product.id).map((link) => link.categoryId) })) };
  }
  if (kind === "colors") return result(await db.select({ id: colors.id, slug: colors.slug, nameFa: colors.nameFa, hex: colors.hex }).from(colors).orderBy(colors.id).limit(PAGE_SIZE + 1).offset(offset), page);
  if (kind === "sizes") return result(await db.select({ id: sizes.id, label: sizes.label, sortOrder: sizes.sortOrder }).from(sizes).orderBy(sizes.sortOrder, sizes.id).limit(PAGE_SIZE + 1).offset(offset), page);
  if (kind === "brands") return result(await db.select({ id: brands.id, code: brands.code, nameFa: brands.nameFa, nameEn: brands.nameEn, settings: brands.settings }).from(brands).orderBy(brands.id).limit(PAGE_SIZE + 1).offset(offset), page);
  if (kind === "families") return result(await db.select({ id: productFamilies.id, code: productFamilies.code, titleFa: productFamilies.titleFa, reviewStatus: productFamilies.reviewStatus }).from(productFamilies).orderBy(productFamilies.id).limit(PAGE_SIZE + 1).offset(offset), page);
  return result(await db.select({ id: cmsPages.id, slug: cmsPages.slug, locale: cmsPages.locale, title: cmsPages.title, body: cmsPages.body, visibility: cmsPages.visibility }).from(cmsPages).orderBy(cmsPages.id).limit(PAGE_SIZE + 1).offset(offset), page);
}
