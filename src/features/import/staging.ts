import { createHash } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { importCandidates, importJobs } from "@/db/schema";
import { productFingerprint, type NormalizedProduct } from "./normalizers/sarochi-product";
import { stageDecision, type StageDecision } from "./staging-rules";

export async function createImportJob(sourceKind: "HTML" | "CSV" | "REST") {
  const [result] = await db.insert(importJobs).values({ sourceKind, state: "STAGING" }).$returningId();
  return result.id;
}

export async function stageCandidate(jobId: number, product: NormalizedProduct): Promise<{ decision: StageDecision; candidateId: number }> {
  const sourceUrlHash = createHash("sha256").update(product.sourceUrl).digest("hex");
  const fingerprint = productFingerprint(product);
  return db.transaction(async (tx) => {
    const [previous] = await tx.select({
      id: importCandidates.id,
      fingerprint: importCandidates.fingerprint,
      reviewStatus: importCandidates.reviewStatus,
    }).from(importCandidates).where(eq(importCandidates.sourceUrlHash, sourceUrlHash))
      .orderBy(desc(importCandidates.id)).limit(1);
    const decision = stageDecision({
      previousFingerprint: previous?.fingerprint,
      previousReviewStatus: previous?.reviewStatus,
      currentFingerprint: fingerprint,
    });
    if (decision === "UNCHANGED") return { decision, candidateId: previous.id };
    const issues = previous ? [...product.issues, "SOURCE_CHANGED"] : product.issues;
    const [inserted] = await tx.insert(importCandidates).values({
      jobId,
      sourceUrl: product.sourceUrl,
      sourceUrlHash,
      sourceId: product.sourceId,
      fingerprint,
      payload: product,
      issues,
      reviewStatus: decision,
      collectedAt: new Date(product.collectedAt),
    }).$returningId();
    return { decision, candidateId: inserted.id };
  });
}

export async function getImportReviewSummary(jobId: number) {
  return db.select({
    reviewStatus: importCandidates.reviewStatus,
    count: sql<number>`count(*)`,
  }).from(importCandidates).where(eq(importCandidates.jobId, jobId)).groupBy(importCandidates.reviewStatus);
}
