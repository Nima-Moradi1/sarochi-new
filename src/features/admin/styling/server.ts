import "server-only";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { adminAuditEvents, brands, products, productVariants, variantStylingMappings } from "@/db/schema";
import { catalogIdSchema } from "@/features/admin/catalog/schemas";
import { adminRouteGuard, parseAdminJson } from "@/features/admin/auth/server/route-guard";
import { roleAllows, type AdminRole } from "@/features/admin/auth/rules";
import { readBrandSettingsRecord, stylingPresetsSchema } from "@/features/content/brand-settings";
import { getProductStylingMappings } from "@/features/styling/server/mappings";
import { stylingMappingWriteSchema, type StylingMappingWrite } from "@/features/styling/mapping";

class StylingMappingError extends Error { constructor(message: string, public status: number) { super(message); } }
type Actor = { id: number; role: AdminRole };

export async function saveVariantStyling(actor: Actor, productId: number, variantId: number, input: StylingMappingWrite | null) {
  if (!roleAllows(actor.role, "EDIT")) throw new StylingMappingError("FORBIDDEN", 403);
  const slug = await db.transaction(async (transaction) => {
    const [variant] = await transaction.select({ id: productVariants.id, slug: products.slug }).from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId))).limit(1).for("update");
    if (!variant) throw new StylingMappingError("VARIANT_NOT_FOUND", 404);
    if (input) {
      const [brand] = await transaction.select({ settings: brands.settings }).from(brands).where(eq(brands.code, "SAROCHI")).limit(1).for("update");
      const presets = stylingPresetsSchema.safeParse(readBrandSettingsRecord(brand?.settings).stylingPresets);
      if (!presets.success || !presets.data.some((preset) => preset.id === input.presetId)) throw new StylingMappingError("PRESET_NOT_FOUND", 400);
      await transaction.insert(variantStylingMappings).values({ variantId, ...input })
        .onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
    } else {
      await transaction.delete(variantStylingMappings).where(eq(variantStylingMappings.variantId, variantId));
    }
    await transaction.insert(adminAuditEvents).values({
      actorUserId: actor.id,
      action: input ? "VARIANT_STYLING_SAVE" : "VARIANT_STYLING_DELETE",
      entityType: "VARIANT_STYLING_MAPPING",
      entityId: String(variantId),
      details: { productId, ...(input ?? {}) },
    });
    return variant.slug;
  });
  revalidatePath("/admin");
  revalidatePath(`/style/${slug}`);
  return input ? { variantId, ...input } : null;
}

function errorResponse(error: unknown) {
  if (error instanceof StylingMappingError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  return NextResponse.json({ error: "STYLING_MAPPING_UNAVAILABLE" }, { status: 503 });
}

export async function listVariantStyling(request: Request, rawProductId: string) {
  const guard = await adminRouteGuard(request, "READ", false);
  if (guard.response) return guard.response;
  const id = catalogIdSchema.safeParse(rawProductId);
  if (!id.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, id.data)).limit(1);
    if (!product) throw new StylingMappingError("PRODUCT_NOT_FOUND", 404);
    return NextResponse.json({ mappings: await getProductStylingMappings(id.data) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}

export async function changeVariantStyling(request: Request, rawProductId: string, rawVariantId: string, method: "PUT" | "DELETE") {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const productId = catalogIdSchema.safeParse(rawProductId);
  const variantId = catalogIdSchema.safeParse(rawVariantId);
  if (!productId.success || !variantId.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    if (method === "DELETE") {
      await saveVariantStyling(guard.admin, productId.data, variantId.data, null);
      return new NextResponse(null, { status: 204 });
    }
    const parsed = stylingMappingWriteSchema.safeParse(await parseAdminJson(request, 4096));
    if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT", fields: parsed.error.flatten() }, { status: 400 });
    const mapping = await saveVariantStyling(guard.admin, productId.data, variantId.data, parsed.data);
    return NextResponse.json({ mapping }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
