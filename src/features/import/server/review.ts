import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { adminAuditEvents, assets, brands, categories, colors, importCandidates, importJobs, productCategories, productMedia, products, productVariants, sizes, sourceObservations } from "@/db/schema";
import type { AdminRole } from "@/features/admin/auth/rules";
import { importProductSlug, reviewCandidateSchema, validateCandidatePayload } from "../review-rules";
import type { z } from "zod";
import { persistSarochiImage } from "./media";

type Actor = { id: number; role: AdminRole };
type Review = z.infer<typeof reviewCandidateSchema>;
export class ImportReviewError extends Error { constructor(message: string, public status: number) { super(message); } }

export async function getImportReviewDashboard(page = 1) {
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw new ImportReviewError("INVALID_PAGE", 400);
  const [jobs, candidateRows, categoryRows] = await Promise.all([
    db.select({ id: importJobs.id, sourceKind: importJobs.sourceKind, state: importJobs.state, cursor: importJobs.cursor, counters: importJobs.counters, startedAt: importJobs.startedAt }).from(importJobs).orderBy(desc(importJobs.id)).limit(30),
    db.select({ id: importCandidates.id, jobId: importCandidates.jobId, sourceUrl: importCandidates.sourceUrl, sourceUrlHash: importCandidates.sourceUrlHash, reviewStatus: importCandidates.reviewStatus, issues: importCandidates.issues, payload: importCandidates.payload, reviewOverrides: importCandidates.reviewOverrides, committedProductId: importCandidates.committedProductId, collectedAt: importCandidates.collectedAt }).from(importCandidates).orderBy(desc(importCandidates.id)).limit(51).offset((page - 1) * 50),
    db.select({ id: categories.id, nameFa: categories.nameFa, slug: categories.slug }).from(categories).orderBy(categories.sortOrder).limit(200),
  ]);
  return { jobs, candidates: candidateRows.slice(0, 50).map((row) => { const parsed = validateCandidatePayloadSafe(row.payload); return { ...row, nameFa: parsed?.nameFa ?? "داده نامعتبر", categoryKeys: parsed?.categoryKeys ?? [], variantCount: parsed?.variants.length ?? 0, mediaCount: parsed?.media.length ?? 0, hasVerifiedBack: false }; }), categories: categoryRows, page, hasNext: candidateRows.length > 50 };
}

function validateCandidatePayloadSafe(raw: unknown) { try { return validateCandidatePayload(raw); } catch { return null; } }

async function requireLatestCandidate(candidateId: number, sourceUrlHash: string, transaction: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
  const [latest] = await transaction.select({ id: importCandidates.id }).from(importCandidates).where(eq(importCandidates.sourceUrlHash, sourceUrlHash)).orderBy(desc(importCandidates.id)).limit(1);
  if (latest?.id !== candidateId) throw new ImportReviewError("STALE_CANDIDATE", 409);
}

export async function reviewImportCandidate(actor: Actor, candidateId: number, input: Review) {
  const result = await db.transaction(async (transaction) => {
    const [candidate] = await transaction.select({ id: importCandidates.id, sourceUrlHash: importCandidates.sourceUrlHash, reviewStatus: importCandidates.reviewStatus, payload: importCandidates.payload }).from(importCandidates).where(eq(importCandidates.id, candidateId)).limit(1);
    if (!candidate) throw new ImportReviewError("CANDIDATE_NOT_FOUND", 404);
    if (!["PENDING_REVIEW", "CONFLICT"].includes(candidate.reviewStatus)) throw new ImportReviewError("CANDIDATE_NOT_REVIEWABLE", 409);
    if (candidate.reviewStatus === "CONFLICT" && actor.role !== "OWNER") throw new ImportReviewError("OWNER_REVIEW_REQUIRED", 403);
    await requireLatestCandidate(candidateId, candidate.sourceUrlHash, transaction);
    if (input.decision === "APPROVE") {
      try { validateCandidatePayload(candidate.payload); } catch { throw new ImportReviewError("INVALID_CANDIDATE_PAYLOAD", 400); }
      const unique = [...new Set(input.categoryIds)];
      if (unique.length !== input.categoryIds.length) throw new ImportReviewError("DUPLICATE_CATEGORY", 400);
      const found = await transaction.select({ id: categories.id }).from(categories).where(inArray(categories.id, unique));
      if (found.length !== unique.length) throw new ImportReviewError("CATEGORY_NOT_FOUND", 400);
    }
    const updated = await transaction.update(importCandidates).set({ reviewStatus: input.decision === "APPROVE" ? "APPROVED" : "REJECTED", reviewOverrides: input, reviewedById: actor.id, approvedAt: input.decision === "APPROVE" ? new Date() : null }).where(and(eq(importCandidates.id, candidateId), inArray(importCandidates.reviewStatus, ["PENDING_REVIEW", "CONFLICT"])));
    if (updated[0].affectedRows !== 1) throw new ImportReviewError("CANDIDATE_CHANGED_DURING_REVIEW", 409);
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: input.decision === "APPROVE" ? "IMPORT_APPROVE" : "IMPORT_REJECT", entityType: "IMPORT_CANDIDATE", entityId: String(candidateId), details: { note: input.note, categoryIds: input.categoryIds, garmentClass: input.garmentClass } });
    return { id: candidateId, status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED" };
  });
  return result;
}

export async function commitImportCandidate(actor: Actor, candidateId: number) {
  if (actor.role !== "OWNER") throw new ImportReviewError("OWNER_COMMIT_REQUIRED", 403);
  const [prepared] = await db.select({ payload: importCandidates.payload, reviewStatus: importCandidates.reviewStatus }).from(importCandidates).where(eq(importCandidates.id, candidateId)).limit(1);
  if (!prepared || prepared.reviewStatus !== "APPROVED") throw new ImportReviewError("CANDIDATE_NOT_APPROVED", 409);
  const preparedPayload = validateCandidatePayload(prepared.payload);
  const storedImages = new Map<string, Awaited<ReturnType<typeof persistSarochiImage>>>();
  for (const image of preparedPayload.media) storedImages.set(image.sourceUrl, await persistSarochiImage(image.sourceUrl));
  const result = await db.transaction(async (transaction) => {
    const [candidate] = await transaction.select({ id: importCandidates.id, jobId: importCandidates.jobId, sourceUrl: importCandidates.sourceUrl, sourceUrlHash: importCandidates.sourceUrlHash, sourceId: importCandidates.sourceId, reviewStatus: importCandidates.reviewStatus, payload: importCandidates.payload, reviewOverrides: importCandidates.reviewOverrides }).from(importCandidates).where(eq(importCandidates.id, candidateId)).limit(1);
    if (!candidate) throw new ImportReviewError("CANDIDATE_NOT_FOUND", 404);
    if (candidate.reviewStatus !== "APPROVED") throw new ImportReviewError("CANDIDATE_NOT_APPROVED", 409);
    await requireLatestCandidate(candidateId, candidate.sourceUrlHash, transaction);
    const review = reviewCandidateSchema.safeParse(candidate.reviewOverrides);
    if (!review.success || review.data.decision !== "APPROVE") throw new ImportReviewError("MISSING_REVIEW", 409);
    const claimed = await transaction.update(importCandidates).set({ reviewStatus: "COMMITTING" }).where(and(eq(importCandidates.id, candidateId), eq(importCandidates.reviewStatus, "APPROVED")));
    if (claimed[0].affectedRows !== 1) throw new ImportReviewError("CANDIDATE_CHANGED_DURING_COMMIT", 409);
    let payload;
    try { payload = validateCandidatePayload(candidate.payload); } catch { throw new ImportReviewError("INVALID_CANDIDATE_PAYLOAD", 400); }
    const uniqueCategories = [...new Set(review.data.categoryIds)];
    const foundCategories = await transaction.select({ id: categories.id }).from(categories).where(inArray(categories.id, uniqueCategories));
    if (foundCategories.length !== uniqueCategories.length) throw new ImportReviewError("CATEGORY_NOT_FOUND", 409);
    const slug = importProductSlug(candidate.sourceUrlHash);
    const [existing] = await transaction.select({ id: products.id }).from(products).where(or(eq(products.slug, slug), eq(products.sourceUrl, candidate.sourceUrl), candidate.sourceId ? and(eq(products.sourceType, "SAROCHI"), eq(products.sourceId, candidate.sourceId)) : undefined)).limit(1);
    if (existing) throw new ImportReviewError("PRODUCT_ALREADY_IMPORTED_REVIEW_REQUIRED", 409);
    const [brand] = await transaction.select({ id: brands.id }).from(brands).where(or(eq(brands.code, "sarochi"), eq(brands.code, "SAROCHI"))).limit(1);
    const [inserted] = await transaction.insert(products).values({ brandId: brand?.id ?? null, slug, nameFa: payload.nameFa, description: payload.descriptionFa, garmentClass: review.data.garmentClass, status: "DRAFT", sourceType: "SAROCHI", sourceId: candidate.sourceId, sourceUrl: candidate.sourceUrl }).$returningId();
    const productId = inserted.id;
    await transaction.insert(productCategories).values(uniqueCategories.map((categoryId) => ({ productId, categoryId })));
    for (const variant of payload.variants) {
      let sizeId: number | null = null;
      let colorId: number | null = null;
      if (variant.size) {
        const [size] = await transaction.select({ id: sizes.id }).from(sizes).where(eq(sizes.label, variant.size)).limit(1);
        if (size) sizeId = size.id;
        else { const [created] = await transaction.insert(sizes).values({ label: variant.size, sortOrder: 1000 }).$returningId(); sizeId = created.id; }
      }
      if (variant.color) {
        const colorSlug = `source-${createHash("sha256").update(variant.color).digest("hex").slice(0, 20)}`;
        const [color] = await transaction.select({ id: colors.id }).from(colors).where(eq(colors.slug, colorSlug)).limit(1);
        if (color) colorId = color.id;
        else { const [created] = await transaction.insert(colors).values({ slug: colorSlug, nameFa: variant.color, hex: null }).$returningId(); colorId = created.id; }
      }
      if (variant.sku) {
        const [sameSku] = await transaction.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.sku, variant.sku)).limit(1);
        if (sameSku) throw new ImportReviewError("SKU_CONFLICT", 409);
      }
      await transaction.insert(productVariants).values({ productId, sku: variant.sku, colorId, sizeId, regularPriceToman: variant.regularPriceToman, salePriceToman: variant.salePriceToman, stockQty: null, stockStatus: variant.stockStatus });
      await transaction.insert(sourceObservations).values({ productId, sourceType: "SAROCHI", sourceUrl: candidate.sourceUrl, sourceUrlHash: candidate.sourceUrlHash, field: `variant:${variant.sourceVariationId}`, value: { regularPriceToman: variant.regularPriceToman, salePriceToman: variant.salePriceToman, stockStatus: variant.stockStatus, stockQty: null }, confidence: "SOURCE", collectedAt: new Date(payload.collectedAt), approvedAt: new Date() });
    }
    for (const [index, image] of payload.media.entries()) {
      const stored = storedImages.get(image.sourceUrl);
      if (!stored) throw new ImportReviewError("CANDIDATE_CHANGED_DURING_COMMIT", 409);
      const [created] = await transaction.insert(assets).values({ pathOrUrl: stored.url, sourceUrl: image.sourceUrl, mime: stored.mime, sha256: stored.hash, width: stored.width, height: stored.height, license: "Owner source catalog; original retained privately", provenance: "SAROCHI_SOURCE", verificationStatus: "UNVERIFIED" }).$returningId();
      await transaction.insert(productMedia).values({ productId, assetId: created.id, viewAngle: "UNKNOWN", confidence: "UNVERIFIED", isPrimary: image.isPrimary, sortOrder: index });
    }
    await transaction.update(importCandidates).set({ reviewStatus: "COMMITTED", committedProductId: productId }).where(eq(importCandidates.id, candidateId));
    await transaction.update(importJobs).set({ state: "PARTIAL", updatedAt: new Date() }).where(eq(importJobs.id, candidate.jobId));
    await transaction.insert(adminAuditEvents).values({ actorUserId: actor.id, action: "IMPORT_COMMIT", entityType: "IMPORT_CANDIDATE", entityId: String(candidateId), details: { productId, status: "DRAFT", variantCount: payload.variants.length, mediaCount: payload.media.length } });
    return { productId, slug, status: "DRAFT" as const };
  });
  revalidatePath("/"); revalidatePath("/shop"); revalidatePath(`/products/${result.slug}`);
  return result;
}
