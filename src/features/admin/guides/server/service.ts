import "server-only";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { adminAuditEvents, careGuides, categories, products, sizeGuides, sizeMeasurements, sizes } from "@/db/schema";
import { roleAllows, type AdminRole } from "@/features/admin/auth/rules";
import { guideWriteSchema, type GuideKind, type GuideRecord, type GuideWrite } from "../schemas";

export class AdminGuideError extends Error { constructor(message: string, public status: number) { super(message); } }
type Actor = { id: number; role: AdminRole };

function assertEditor(actor: Actor) { if (!roleAllows(actor.role, "EDIT")) throw new AdminGuideError("FORBIDDEN", 403); }
function refreshGuides() { revalidatePath("/products/[slug]", "page"); revalidatePath("/admin"); }

export async function listGuides(kind: GuideKind, page: number) {
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw new AdminGuideError("INVALID_PAGE", 400);
  if (kind === "care") {
    const rows = await db.select().from(careGuides).orderBy(careGuides.id).limit(26).offset((page - 1) * 25);
    return { items: rows.slice(0, 25).map((row): GuideRecord => ({ ...row, kind, toleranceCm: null, measurements: [] })), page, hasNext: rows.length > 25 };
  }
  const rows = await db.select().from(sizeGuides).orderBy(sizeGuides.id).limit(26).offset((page - 1) * 25);
  const visible = rows.slice(0, 25);
  const measurements = visible.length ? await db.select().from(sizeMeasurements).where(inArray(sizeMeasurements.guideId, visible.map((row) => row.id))).orderBy(sizeMeasurements.id) : [];
  return { items: visible.map((row): GuideRecord => ({ ...row, kind, instructionsFa: null, toleranceCm: row.toleranceCm === null ? null : Number(row.toleranceCm), measurements: measurements.filter((item) => item.guideId === row.id).map((item) => ({ sizeId: item.sizeId, metric: item.metric, valueCm: Number(item.valueCm) })) })), page, hasNext: rows.length > 25 };
}

export async function saveGuide(actor: Actor, raw: GuideWrite, id?: number) {
  assertEditor(actor);
  const parsed = guideWriteSchema.safeParse(raw);
  if (!parsed.success) throw new AdminGuideError("INVALID_INPUT", 400);
  const input = parsed.data;
  const result = await db.transaction(async (transaction) => {
    const table = input.kind === "care" ? careGuides : sizeGuides;
    if (id) {
      const [existing] = await transaction.select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1);
      if (!existing) throw new AdminGuideError("GUIDE_NOT_FOUND", 404);
    }
    if (input.productId !== null) {
      const [product] = await transaction.select({ id: products.id }).from(products).where(eq(products.id, input.productId)).limit(1);
      if (!product) throw new AdminGuideError("PRODUCT_NOT_FOUND", 404);
    } else {
      const [category] = await transaction.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId!)).limit(1);
      if (!category) throw new AdminGuideError("CATEGORY_NOT_FOUND", 404);
    }
    const common = { titleFa: input.titleFa, productId: input.productId, categoryId: input.categoryId, sourceUrl: input.sourceUrl };
    let savedId = id;
    if (input.kind === "care") {
      const values = { ...common, instructionsFa: input.instructionsFa };
      if (savedId) await transaction.update(careGuides).set(values).where(eq(careGuides.id, savedId));
      else [savedId] = (await transaction.insert(careGuides).values(values).$returningId()).map((row) => row.id);
    } else {
      const sizeIds = [...new Set(input.measurements.map((item) => item.sizeId))];
      const sizeRows = await transaction.select({ id: sizes.id }).from(sizes).where(inArray(sizes.id, sizeIds));
      if (sizeRows.length !== sizeIds.length) throw new AdminGuideError("SIZE_NOT_FOUND", 404);
      const [duplicate] = await transaction.select({ id: sizeGuides.id }).from(sizeGuides).where(and(input.productId !== null ? eq(sizeGuides.productId, input.productId) : eq(sizeGuides.categoryId, input.categoryId!), id ? ne(sizeGuides.id, id) : undefined)).limit(1);
      if (duplicate) throw new AdminGuideError("SIZE_GUIDE_ALREADY_EXISTS", 409);
      const values = { ...common, toleranceCm: input.toleranceCm === null ? null : input.toleranceCm.toFixed(1) };
      if (savedId) await transaction.update(sizeGuides).set(values).where(eq(sizeGuides.id, savedId));
      else [savedId] = (await transaction.insert(sizeGuides).values(values).$returningId()).map((row) => row.id);
      await transaction.delete(sizeMeasurements).where(eq(sizeMeasurements.guideId, savedId!));
      await transaction.insert(sizeMeasurements).values(input.measurements.map((row) => ({ guideId: savedId!, sizeId: row.sizeId, metric: row.metric, valueCm: row.valueCm.toFixed(1) })));
    }
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: id ? "GUIDE_UPDATE" : "GUIDE_CREATE", entityType: input.kind === "care" ? "CARE_GUIDE" : "SIZE_GUIDE", entityId: String(savedId), details: { productId: input.productId, categoryId: input.categoryId } });
    return { id: savedId };
  });
  refreshGuides();
  return result;
}

export async function deleteGuide(actor: Actor, kind: GuideKind, id: number) {
  assertEditor(actor);
  await db.transaction(async (transaction) => {
    const table = kind === "care" ? careGuides : sizeGuides;
    const [existing] = await transaction.select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1);
    if (!existing) throw new AdminGuideError("GUIDE_NOT_FOUND", 404);
    await transaction.delete(table).where(eq(table.id, id));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "GUIDE_DELETE", entityType: kind === "care" ? "CARE_GUIDE" : "SIZE_GUIDE", entityId: String(id) });
  });
  refreshGuides();
}
