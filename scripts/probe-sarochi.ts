import { SarochiHtmlSource } from "../src/features/import/adapters/sarochi-html";

async function main() {
  const source = new SarochiHtmlSource();
  const categories = await source.discoverCategories();
  const tee = categories.find((category) => category.key === "t-shirt");
  if (!tee) throw new Error("T-shirt category not found in source discovery");
  const page = await source.listProductPage({ categoryKey: tee.key });
  const first = page.refs[0];
  if (!first) throw new Error("No public product links found on first T-shirt page");
  const product = await source.getProduct(first);
  console.log(JSON.stringify({
    source: "public HTML",
    categoryLinks: categories.length,
    checkedCategory: tee.url,
    uniqueProductLinksOnFirstPage: page.refs.length,
    nextCursor: page.nextCursor,
    sampleProductUrl: product.sourceUrl,
    sampleVariants: product.variants.length,
    sampleGalleryItems: product.media.length,
    sampleIssues: product.issues,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
