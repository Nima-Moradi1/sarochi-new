import "dotenv/config";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { importJobs } from "@/db/schema";
import { SarochiHtmlSource } from "../adapters/sarochi-html";
import { createImportJob, stageCandidate } from "../staging";

const cursorSchema = z.object({ categoryIndex: z.number().int().nonnegative(), categoryPages: z.number().int().nonnegative(), pageCursor: z.string().nullable(), offset: z.number().int().nonnegative() });
const countersSchema = z.object({ categoryKeys: z.array(z.string()), category: z.string(), maxPages: z.number().int().positive(), maxProducts: z.number().int().positive(), pagesVisited: z.number().int().nonnegative(), productsFetched: z.number().int().nonnegative(), staged: z.number().int().nonnegative(), unchanged: z.number().int().nonnegative(), failed: z.number().int().nonnegative(), seenSourceUrls: z.array(z.string()).default([]), sourceCategories: z.array(z.object({ key: z.string(), url: z.string(), nameFa: z.string(), parentKey: z.string().nullable() })).default([]), perCategory: z.array(z.object({ key: z.string(), pagesVisited: z.number(), observedTotal: z.number().nullable(), urlsSeen: z.array(z.string()), exhausted: z.boolean() })).default([]) });
type Counters = z.infer<typeof countersSchema>;
type Cursor = z.infer<typeof cursorSchema>;
type Options = { category: string; maxPages: number; maxProducts: number; resumeJobId?: number };

export async function stageSarochiCatalog(options: Options) {
  const source = new SarochiHtmlSource();
  const discovered = await source.discoverCategories();
  let jobId: number;
  let counters: Counters;
  let cursor: Cursor;
  if (options.resumeJobId) {
    const [job] = await db.select({ id: importJobs.id, sourceKind: importJobs.sourceKind, state: importJobs.state, cursor: importJobs.cursor, counters: importJobs.counters }).from(importJobs).where(eq(importJobs.id, options.resumeJobId)).limit(1);
    if (!job || job.sourceKind !== "HTML" || !job.cursor || !["BLOCKED", "STAGING", "PARTIAL"].includes(job.state)) throw new Error("Import job cannot be resumed");
    counters = countersSchema.parse(job.counters);
    cursor = cursorSchema.parse(JSON.parse(job.cursor) as unknown);
    jobId = job.id;
  } else {
    const selected = options.category === "all" ? discovered : discovered.filter((item) => item.key === options.category);
    if (selected.length === 0) throw new Error("Requested category was not found on the public shop page");
    counters = { categoryKeys: selected.map((item) => item.key), category: options.category, maxPages: options.maxPages, maxProducts: options.maxProducts, pagesVisited: 0, productsFetched: 0, staged: 0, unchanged: 0, failed: 0, seenSourceUrls: [], sourceCategories: discovered, perCategory: [] };
    cursor = { categoryIndex: 0, categoryPages: 0, pageCursor: null, offset: 0 };
    jobId = await createImportJob("HTML");
  }
  const seen = new Set(counters.seenSourceUrls);
  const selected = counters.categoryKeys.map((key) => discovered.find((item) => item.key === key));
  if (selected.some((item) => !item)) throw new Error("A previously selected source category is no longer available");
  const checkpoint = async (state: string, next: Cursor | null) => {
    await db.update(importJobs).set({ state, cursor: next ? JSON.stringify(next) : null, counters, updatedAt: new Date() }).where(eq(importJobs.id, jobId));
  };
  await checkpoint("STAGING", cursor);
  for (let categoryIndex = cursor.categoryIndex; categoryIndex < selected.length && counters.productsFetched < counters.maxProducts; categoryIndex += 1) {
    const category = selected[categoryIndex]!;
    let coverage = counters.perCategory.find((item) => item.key === category.key);
    if (!coverage) { coverage = { key: category.key, pagesVisited: 0, observedTotal: null, urlsSeen: [], exhausted: false }; counters.perCategory.push(coverage); }
    let pageCursor = categoryIndex === cursor.categoryIndex ? cursor.pageCursor : null;
    let offset = categoryIndex === cursor.categoryIndex ? cursor.offset : 0;
    let categoryPages = categoryIndex === cursor.categoryIndex ? cursor.categoryPages : 0;
    while (categoryPages < counters.maxPages && counters.productsFetched < counters.maxProducts) {
      let page;
      try { page = await source.listProductPage({ categoryKey: category.key, cursor: pageCursor ?? undefined }); }
      catch (error) { counters.failed += 1; await checkpoint("BLOCKED", { categoryIndex, categoryPages, pageCursor, offset }); throw error; }
      coverage.observedTotal = page.observedTotal;
      coverage.urlsSeen = [...new Set([...coverage.urlsSeen, ...page.refs.map((ref) => ref.sourceUrl)])];
      for (let index = offset; index < page.refs.length && counters.productsFetched < counters.maxProducts; index += 1) {
        const ref = page.refs[index];
        if (seen.has(ref.sourceUrl)) continue;
        try {
          const product = await source.getProduct(ref);
          const staged = await stageCandidate(jobId, product);
          counters.productsFetched += 1;
          seen.add(ref.sourceUrl); counters.seenSourceUrls = [...seen];
          if (staged.decision === "UNCHANGED") counters.unchanged += 1;
          else counters.staged += 1;
          await checkpoint("STAGING", { categoryIndex, categoryPages, pageCursor, offset: index + 1 });
        } catch (error) {
          counters.failed += 1;
          await checkpoint("BLOCKED", { categoryIndex, categoryPages, pageCursor, offset: index });
          throw error;
        }
      }
      categoryPages += 1;
      counters.pagesVisited += 1;
      coverage.pagesVisited = categoryPages;
      coverage.exhausted = !page.nextCursor && counters.productsFetched < counters.maxProducts;
      if (!page.nextCursor || counters.productsFetched >= counters.maxProducts) break;
      pageCursor = page.nextCursor;
      offset = 0;
      await checkpoint("STAGING", { categoryIndex, categoryPages, pageCursor, offset: 0 });
    }
    cursor = { categoryIndex: categoryIndex + 1, categoryPages: 0, pageCursor: null, offset: 0 };
    await checkpoint("STAGING", cursor);
  }
  await checkpoint(counters.staged > 0 ? "REVIEW_REQUIRED" : "PARTIAL", null);
  return { jobId, state: counters.staged > 0 ? "REVIEW_REQUIRED" : "PARTIAL", completenessStatus: "PARTIAL", sourceTraversalComplete: counters.perCategory.length === counters.categoryKeys.length && counters.perCategory.every((item) => item.exhausted && item.observedTotal !== null && item.urlsSeen.length === item.observedTotal), uniqueProductUrlsSeen: new Set(counters.perCategory.flatMap((item) => item.urlsSeen)).size, counters };
}
