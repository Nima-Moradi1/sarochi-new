import { load } from "cheerio";
import { SourceAccessError, SourceHttpClient } from "./source-http";
import { parseSarochiProduct } from "../normalizers/sarochi-product";

const origin = "https://sarochi.ir";

export type ExternalCategory = { key: string; url: string; nameFa: string; parentKey: string | null };
export type ExternalProductRef = { sourceUrl: string; categoryKey: string; page: number };
export type ExternalProductPage = { refs: ExternalProductRef[]; nextCursor: string | null; page: number; observedTotal: number | null };

function categoryKey(input: string): string | null {
  const url = new URL(input, origin);
  if (url.origin !== origin || !url.pathname.startsWith("/product-cat/")) return null;
  const key = url.pathname.slice("/product-cat/".length).replace(/\/$/, "");
  if (!key || key.includes("/page/")) return null;
  return key;
}

export class SarochiHtmlSource {
  private categories = new Map<string, ExternalCategory>();

  constructor(private readonly http = new SourceHttpClient()) {}

  async discoverCategories(): Promise<ExternalCategory[]> {
    const doc = load(await this.http.html("/shop/"));
    const found = new Map<string, ExternalCategory>();
    doc('a[href*="/product-cat/"]').each((_, element) => {
      const anchor = doc(element);
      const href = anchor.attr("href");
      if (!href) return;
      const key = categoryKey(href);
      if (!key) return;
      const nameFa = anchor.text().replace(/\s+/g, " ").trim();
      if (!nameFa) return;
      const url = new URL(href, origin);
      const parentHref = anchor.closest("li").parents("li").first().children("a").first().attr("href");
      const parentKey = parentHref ? categoryKey(parentHref) : null;
      found.set(key, { key, url: `${origin}${url.pathname}`, nameFa, parentKey: parentKey && parentKey !== key ? parentKey : found.get(key)?.parentKey ?? null });
    });
    if (found.size === 0) throw new SourceAccessError("No source category links were found");
    this.categories = found;
    return [...found.values()];
  }

  async listProductPage(input: { categoryKey: string; cursor?: string }): Promise<ExternalProductPage> {
    const category = this.categories.get(input.categoryKey);
    if (!category) throw new SourceAccessError("Category must come from source discovery");
    const page = input.cursor === undefined ? 1 : Number(input.cursor);
    if (!Number.isInteger(page) || page < 1 || page > 100) throw new SourceAccessError("Invalid category page cursor");
    // The observed allproducts category redirects to the main shop archive.
    const archiveUrl = category.key === "allproducts" ? `${origin}/shop/` : category.url;
    const pagePath = page === 1 ? archiveUrl : `${archiveUrl}page/${page}/`;
    const doc = load(await this.http.html(pagePath));
    const refs = new Map<string, ExternalProductRef>();
    doc('.product-wrapper a[href*="/product/"]').each((_, element) => {
      const href = doc(element).attr("href");
      if (!href) return;
      const url = new URL(href, origin);
      if (url.origin !== origin || !url.pathname.startsWith("/product/")) return;
      refs.set(url.pathname, { sourceUrl: `${origin}${url.pathname}`, categoryKey: category.key, page });
    });
    const nextPages = doc("a.page-numbers").map((_, element) => {
      const href = doc(element).attr("href");
      if (!href) return null;
      const url = new URL(href, origin);
      if (url.origin !== origin || !url.pathname.startsWith(new URL(archiveUrl).pathname)) return null;
      const match = /\/page\/(\d+)\/$/.exec(url.pathname);
      return match ? Number(match[1]) : null;
    }).get().filter((candidate): candidate is number => candidate !== null && candidate > page).sort((a, b) => a - b);
    const countText = doc(".woocommerce-result-count").first().text().replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٬,]/g, "");
    const count = /(?:از|of)\s+(\d+)/i.exec(countText) ?? /(?:نمایش همه|showing all)\s+(\d+)/i.exec(countText);
    return { refs: [...refs.values()], nextCursor: nextPages[0]?.toString() ?? null, page, observedTotal: count ? Number(count[1]) : /نمایش\s+(?:یک|تک)\s+نتیجه|showing the single result/i.test(countText) ? 1 : null };
  }

  async getProduct(ref: ExternalProductRef) {
    if (!this.categories.has(ref.categoryKey)) throw new SourceAccessError("Product category must come from source discovery");
    const html = await this.http.html(ref.sourceUrl);
    return parseSarochiProduct(html, ref.sourceUrl);
  }
}
