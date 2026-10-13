import { SarochiHtmlSource } from "../src/features/import/adapters/sarochi-html";

type Options = { category: string; maxPages: number; maxProducts: number; mode: "dry" | "stage"; resumeJobId?: number };

function parseArgs(args: string[]): Options {
  if (args.includes("--dry-run") === args.includes("--stage")) throw new Error("Choose exactly one of --dry-run or --stage");
  const allowed = /^(--dry-run|--stage|--resume=\d+|--category=[^=]+|--pages=(all|\d+)|--products=(all|\d+))$/;
  if (args.some((arg) => !allowed.test(arg))) throw new Error("Unknown import option");
  const value = (name: string) => args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
  const pages = value("--pages") ?? "1";
  const products = value("--products") ?? "3";
  const maxPages = pages === "all" ? 100 : Number(pages);
  const maxProducts = products === "all" ? 2000 : Number(products);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new Error("--pages must be 1..100 or all");
  if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 2000) throw new Error("--products must be 1..2000 or all");
  const resumeJobId = value("--resume") ? Number(value("--resume")) : undefined;
  if (resumeJobId !== undefined && (!args.includes("--stage") || !Number.isSafeInteger(resumeJobId) || resumeJobId < 1)) throw new Error("--resume requires --stage and a valid job ID");
  return { category: value("--category") ?? "t-shirt", maxPages, maxProducts, mode: args.includes("--stage") ? "stage" : "dry", resumeJobId };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.mode === "stage") {
    await import("dotenv/config");
    const [{ stageSarochiCatalog }, { pool }] = await Promise.all([import("../src/features/import/server/stage-runner"), import("../src/db/client")]);
    try { console.log(JSON.stringify(await stageSarochiCatalog(options), null, 2)); }
    finally { await pool.end(); }
    return;
  }
  const source = new SarochiHtmlSource();
  const categories = await source.discoverCategories();
  const selected = options.category === "all" ? categories : categories.filter((category) => category.key === options.category);
  if (selected.length === 0) throw new Error("Requested category was not found on the public shop page");
  const seen = new Set<string>();
  const report = {
    sourceKind: "HTML",
    dryRun: true,
    collectedAt: new Date().toISOString(),
    categoryLinksDiscovered: categories.length,
    categoriesVisited: 0,
    pagesVisited: 0,
    uniqueProductUrlsSeen: 0,
    productsFetched: 0,
    productsFailed: 0,
    variantsObserved: 0,
    galleryReferencesObserved: 0,
    unverifiedMediaAngles: 0,
    unknownStockQuantities: 0,
    reviewFlags: {} as Record<string, number>,
    perCategory: [] as Array<{ key: string; pagesVisited: number; productUrlsSeen: number; nextCursor: string | null }>,
    completenessStatus: "PARTIAL",
    writes: 0,
  };
  for (const category of selected) {
    if (report.productsFetched >= options.maxProducts) break;
    report.categoriesVisited += 1;
    let cursor: string | undefined;
    let categoryPages = 0;
    let categoryRefs = 0;
    while (categoryPages < options.maxPages && report.productsFetched < options.maxProducts) {
      const page = await source.listProductPage({ categoryKey: category.key, cursor });
      categoryPages += 1;
      report.pagesVisited += 1;
      for (const ref of page.refs) {
        if (seen.has(ref.sourceUrl)) continue;
        seen.add(ref.sourceUrl);
        categoryRefs += 1;
        report.uniqueProductUrlsSeen += 1;
        if (report.productsFetched >= options.maxProducts) continue;
        try {
          const product = await source.getProduct(ref);
          report.productsFetched += 1;
          report.variantsObserved += product.variants.length;
          report.galleryReferencesObserved += product.media.length;
          report.unverifiedMediaAngles += product.media.filter((item) => item.angle === "UNKNOWN").length;
          report.unknownStockQuantities += product.variants.filter((item) => item.stockQty === null).length;
          for (const issue of product.issues) report.reviewFlags[issue] = (report.reviewFlags[issue] ?? 0) + 1;
        } catch {
          report.productsFailed += 1;
          report.reviewFlags.PRODUCT_FETCH_FAILED = (report.reviewFlags.PRODUCT_FETCH_FAILED ?? 0) + 1;
        }
      }
      cursor = report.productsFetched >= options.maxProducts ? String(page.page) : page.nextCursor ?? undefined;
      if (!cursor) break;
    }
    report.perCategory.push({ key: category.key, pagesVisited: categoryPages, productUrlsSeen: categoryRefs, nextCursor: cursor ?? null });
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Import dry run failed"); process.exitCode = 1; });
