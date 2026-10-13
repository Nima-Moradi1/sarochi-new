import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, parseAdminJson } from "@/features/admin/auth/server/route-guard";
import { brandWriteSchema, catalogIdSchema, categoryWriteSchema, cmsPageWriteSchema, colorWriteSchema, familyWriteSchema, mediaWriteSchema, productWriteSchema, railWriteSchema, sizeWriteSchema, variantWriteSchema } from "../schemas";
import { AdminCatalogError, archiveProduct, assignRailItems, deleteBrand, deleteCategory, deleteCmsPage, deleteColor, deleteFamily, deleteMedia, deleteRail, deleteSize, deleteVariant, getAdminProductMedia, saveBrand, saveCategory, saveCmsPage, saveColor, saveFamily, saveMedia, saveProduct, saveRail, saveSize, saveVariant } from "./service";
import { getAdminResourcePage, type AdminResourceKind } from "./pagination";
import { adminProductQuerySchema } from "../product-query";

type Kind = AdminResourceKind;

function errorResponse(error: unknown) {
  if (error instanceof AdminCatalogError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") return NextResponse.json({ error: "DUPLICATE_VALUE" }, { status: 409 });
  return NextResponse.json({ error: "ADMIN_CATALOG_UNAVAILABLE" }, { status: 503 });
}

export async function listResource(request: Request, kind: Kind) {
  const guard = await adminRouteGuard(request, "READ", false);
  if (guard.response) return guard.response;
  const rawPage = new URL(request.url).searchParams.get("page") ?? "1";
  const page = z.coerce.number().int().min(1).max(10000).safeParse(rawPage);
  if (!page.success) return NextResponse.json({ error: "INVALID_PAGE" }, { status: 400 });
  const query = adminProductQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (kind === "products" && !query.success) return NextResponse.json({ error: "INVALID_QUERY", fields: query.error.flatten() }, { status: 400 });
  try {
    return NextResponse.json(await getAdminResourcePage(kind, page.data, kind === "products" && query.success ? query.data : {}), { headers: { "Cache-Control": "no-store" } });
  }
  catch (error) { return errorResponse(error); }
}

export async function createResource(request: Request, kind: Kind) {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  try {
    const raw = await parseAdminJson(request);
    if (kind === "categories") {
      const parsed = categoryWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveCategory(guard.admin, parsed.data), { status: 201 });
    }
    if (kind === "rails") {
      const parsed = railWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveRail(guard.admin, parsed.data), { status: 201 });
    }
    if (kind === "colors") {
      const parsed = colorWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveColor(guard.admin, parsed.data), { status: 201 });
    }
    if (kind === "sizes") {
      const parsed = sizeWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveSize(guard.admin, parsed.data), { status: 201 });
    }
    if (kind === "brands") {
      const parsed = brandWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveBrand(guard.admin, parsed.data), { status: 201 });
    }
    if (kind === "families") {
      const parsed = familyWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveFamily(guard.admin, parsed.data), { status: 201 });
    }
    if (kind === "pages") {
      const parsed = cmsPageWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveCmsPage(guard.admin, parsed.data), { status: 201 });
    }
    const parsed = productWriteSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(await saveProduct(guard.admin, parsed.data), { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function changeResource(request: Request, kind: Kind, rawId: string, method: "PATCH" | "DELETE") {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const id = catalogIdSchema.safeParse(rawId);
  if (!id.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    if (method === "DELETE") {
      if (kind === "categories") await deleteCategory(guard.admin, id.data);
      else if (kind === "rails") await deleteRail(guard.admin, id.data);
      else if (kind === "colors") await deleteColor(guard.admin, id.data);
      else if (kind === "sizes") await deleteSize(guard.admin, id.data);
      else if (kind === "brands") await deleteBrand(guard.admin, id.data);
      else if (kind === "families") await deleteFamily(guard.admin, id.data);
      else if (kind === "pages") await deleteCmsPage(guard.admin, id.data);
      else await archiveProduct(guard.admin, id.data);
      return new NextResponse(null, { status: 204 });
    }
    const raw = await parseAdminJson(request);
    if (kind === "categories") {
      const parsed = categoryWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveCategory(guard.admin, parsed.data, id.data));
    }
    if (kind === "rails") {
      const parsed = railWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveRail(guard.admin, parsed.data, id.data));
    }
    if (kind === "colors") {
      const parsed = colorWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveColor(guard.admin, parsed.data, id.data));
    }
    if (kind === "sizes") {
      const parsed = sizeWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveSize(guard.admin, parsed.data, id.data));
    }
    if (kind === "brands") {
      const parsed = brandWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveBrand(guard.admin, parsed.data, id.data));
    }
    if (kind === "families") {
      const parsed = familyWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveFamily(guard.admin, parsed.data, id.data));
    }
    if (kind === "pages") {
      const parsed = cmsPageWriteSchema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
      return NextResponse.json(await saveCmsPage(guard.admin, parsed.data, id.data));
    }
    const parsed = productWriteSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(await saveProduct(guard.admin, parsed.data, id.data));
  } catch (error) { return errorResponse(error); }
}

export async function createVariant(request: Request, rawProductId: string) {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const productId = catalogIdSchema.safeParse(rawProductId);
  if (!productId.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const parsed = variantWriteSchema.safeParse(await parseAdminJson(request));
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(await saveVariant(guard.admin, productId.data, parsed.data), { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function changeVariant(request: Request, rawProductId: string, rawVariantId: string, method: "PATCH" | "DELETE") {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const productId = catalogIdSchema.safeParse(rawProductId);
  const variantId = catalogIdSchema.safeParse(rawVariantId);
  if (!productId.success || !variantId.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    if (method === "DELETE") {
      await deleteVariant(guard.admin, productId.data, variantId.data);
      return new NextResponse(null, { status: 204 });
    }
    const parsed = variantWriteSchema.safeParse(await parseAdminJson(request));
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(await saveVariant(guard.admin, productId.data, parsed.data, variantId.data));
  } catch (error) { return errorResponse(error); }
}

export async function setRailItems(request: Request, rawId: string) {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const id = catalogIdSchema.safeParse(rawId);
  if (!id.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const parsed = z.object({ productIds: z.array(z.number().int().positive()).max(100) }).safeParse(await parseAdminJson(request));
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    await assignRailItems(guard.admin, id.data, parsed.data.productIds);
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

export async function listMedia(request: Request, rawProductId: string) {
  const guard = await adminRouteGuard(request, "READ", false);
  if (guard.response) return guard.response;
  const productId = catalogIdSchema.safeParse(rawProductId);
  if (!productId.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try { return NextResponse.json(await getAdminProductMedia(productId.data), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error); }
}

export async function createMedia(request: Request, rawProductId: string) {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const productId = catalogIdSchema.safeParse(rawProductId);
  if (!productId.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const parsed = mediaWriteSchema.safeParse(await parseAdminJson(request));
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(await saveMedia(guard.admin, productId.data, parsed.data), { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function changeMedia(request: Request, rawProductId: string, rawMediaId: string, method: "PATCH" | "DELETE") {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const productId = catalogIdSchema.safeParse(rawProductId);
  const mediaId = catalogIdSchema.safeParse(rawMediaId);
  if (!productId.success || !mediaId.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    if (method === "DELETE") { await deleteMedia(guard.admin, productId.data, mediaId.data); return new NextResponse(null, { status: 204 }); }
    const parsed = mediaWriteSchema.safeParse(await parseAdminJson(request));
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json(await saveMedia(guard.admin, productId.data, parsed.data, mediaId.data));
  } catch (error) { return errorResponse(error); }
}
