import { createHash } from "node:crypto";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { assets, importCandidates, importJobs, productMedia, products, productVariants } from "@/db/schema";

type Coverage = { key: string; pagesVisited: number; observedTotal: number | null; urlsSeen: string[]; exhausted: boolean };

export async function reconcileImportJob(jobId: number) {
  const [job] = await db.select().from(importJobs).where(eq(importJobs.id, jobId)).limit(1);
  if (!job) throw new Error("IMPORT_JOB_NOT_FOUND");
  const counters = job.counters as { seenSourceUrls?: string[]; categoryKeys?: string[]; perCategory?: Coverage[]; failed?: number; sourceCategories?: unknown[] } | null;
  const coverage = counters?.perCategory ?? [];
  const urls = [...new Set([...(counters?.seenSourceUrls ?? []), ...coverage.flatMap((item) => item.urlsSeen)])];
  const hashes = urls.map((url) => createHash("sha256").update(url).digest("hex"));
  const candidates = hashes.length ? await db.select({ id: importCandidates.id, sourceUrl: importCandidates.sourceUrl, reviewStatus: importCandidates.reviewStatus }).from(importCandidates).where(inArray(importCandidates.sourceUrlHash, hashes)).orderBy(desc(importCandidates.id)) : [];
  const latest = new Map<string, typeof candidates[number]>();
  for (const candidate of candidates) if (!latest.has(candidate.sourceUrl)) latest.set(candidate.sourceUrl, candidate);
  const catalog = urls.length ? await db.select({ id: products.id, sourceUrl: products.sourceUrl, status: products.status }).from(products).where(inArray(products.sourceUrl, urls)) : [];
  const ids = catalog.map((product) => product.id);
  const variants = ids.length ? await db.select({ stockQty: productVariants.stockQty, regularPrice: productVariants.regularPriceToman }).from(productVariants).where(inArray(productVariants.productId, ids)) : [];
  const media = ids.length ? await db.select({ productId: productMedia.productId, angle: productMedia.viewAngle, confidence: productMedia.confidence, url: assets.pathOrUrl, sha256: assets.sha256 }).from(productMedia).innerJoin(assets, eq(productMedia.assetId, assets.id)).where(inArray(productMedia.productId, ids)) : [];
  const reviewCounts: Record<string, number> = {};
  for (const candidate of latest.values()) reviewCounts[candidate.reviewStatus] = (reviewCounts[candidate.reviewStatus] ?? 0) + 1;
  return {
    jobId, state: job.state, generatedAt: new Date().toISOString(), sourceKind: job.sourceKind,
    completenessStatus: "PARTIAL", // Traversal does not imply owner approval or complete inventory.
    sourceTraversalComplete: coverage.length > 0 && coverage.length === counters?.categoryKeys?.length && coverage.every((item) => item.exhausted && item.observedTotal !== null && item.urlsSeen.length === item.observedTotal),
    categoryTreeCount: counters?.sourceCategories?.length ?? null,
    uniqueProductUrlsSeen: urls.length, candidatesMatched: latest.size, reviewCounts,
    written: catalog.length, published: catalog.filter((product) => product.status === "PUBLISHED").length,
    draft: catalog.filter((product) => product.status === "DRAFT").length,
    unknownStock: variants.filter((variant) => variant.stockQty === null).length,
    unknownPrices: variants.filter((variant) => variant.regularPrice === null).length,
    mediaPersisted: media.filter((image) => image.sha256 && image.url.startsWith("/api/v1/media/")).length,
    mediaExternal: media.filter((image) => !image.url.startsWith("/api/v1/media/")).length,
    missingVerifiedFront: catalog.filter((product) => !media.some((image) => image.productId === product.id && image.angle === "FRONT" && image.confidence === "VERIFIED")).length,
    missingVerifiedBack: catalog.filter((product) => !media.some((image) => image.productId === product.id && image.angle === "BACK" && image.confidence === "VERIFIED")).length,
    perCategory: coverage.map((item) => ({ key: item.key, pagesVisited: item.pagesVisited, sourceObservedTotal: item.observedTotal, discovered: item.urlsSeen.length, exhausted: item.exhausted, countVerified: item.observedTotal !== null && item.observedTotal === item.urlsSeen.length, candidatesMatched: item.urlsSeen.filter((url) => latest.has(url)).length, written: catalog.filter((product) => product.sourceUrl && item.urlsSeen.includes(product.sourceUrl)).length })),
    unresolved: { fetchFailures: counters?.failed ?? null, unreviewedUrls: urls.filter((url) => !catalog.some((product) => product.sourceUrl === url)).length, ownerMediaAngleReviewRequired: true, exactSourceInventoryUnavailable: true },
  };
}
