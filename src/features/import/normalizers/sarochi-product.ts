import { load } from "cheerio";
import { createHash } from "node:crypto";
import { z } from "zod";
import { variantPriceSchema } from "@/features/catalog/rules";

const origin = "https://sarochi.ir";

const sourceVariationSchema = z.object({
  variation_id: z.number().int().positive(),
  attributes: z.record(z.string(), z.string()),
  display_price: z.number().int().nonnegative(),
  display_regular_price: z.number().int().nonnegative(),
  is_in_stock: z.boolean(),
  sku: z.string().optional(),
  image: z.object({ full_src: z.string().optional() }).optional(),
});

export type NormalizedProduct = {
  sourceUrl: string;
  sourceId: string | null;
  nameFa: string;
  descriptionFa: string | null;
  care?: string[];
  sizeGuide?: { titleFa: string; toleranceCm: number | null; measurements: { size: string; metric: string; valueCm: number }[] } | null;
  categoryKeys: string[];
  variants: Array<{
    sourceVariationId: string;
    sku: string | null;
    size: string | null;
    color: string | null;
    regularPriceToman: number | null;
    salePriceToman: number | null;
    stockQty: null;
    stockStatus: "IN_STOCK" | "OUT_OF_STOCK";
  }>;
  media: Array<{ sourceUrl: string; angle: "UNKNOWN"; isPrimary: boolean }>;
  issues: string[];
  collectedAt: string;
};

export const normalizedProductSchema = z.object({
  sourceUrl: z.url().max(1024),
  sourceId: z.string().max(160).nullable(),
  nameFa: z.string().min(1).max(240),
  descriptionFa: z.string().max(20000).nullable(),
  care: z.array(z.string().max(2000)).max(30).optional(),
  sizeGuide: z.object({ titleFa: z.string().max(200), toleranceCm: z.number().nonnegative().max(99).nullable(), measurements: z.array(z.object({ size: z.string().max(24), metric: z.string().max(80), valueCm: z.number().nonnegative().max(9999) })).max(500) }).nullable().optional(),
  categoryKeys: z.array(z.string().max(160)).max(30),
  variants: z.array(z.object({ sourceVariationId: z.string().min(1).max(160), sku: z.string().max(120).nullable(), size: z.string().max(24).nullable(), color: z.string().max(80).nullable(), regularPriceToman: z.number().int().nonnegative().nullable(), salePriceToman: z.number().int().nonnegative().nullable(), stockQty: z.null(), stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK"]) })).max(100),
  media: z.array(z.object({ sourceUrl: z.url().max(2048), angle: z.literal("UNKNOWN"), isPrimary: z.boolean() })).max(100),
  issues: z.array(z.string().max(100)).max(100),
  collectedAt: z.iso.datetime(),
});

function approvedSourceUrl(value: string, prefix: string): string | null {
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !url.pathname.startsWith(prefix) || url.search || url.hash) return null;
    return `${origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function parseSarochiProduct(html: string, requestedUrl: string, collectedAt = new Date()): NormalizedProduct {
  const doc = load(html);
  const canonical = approvedSourceUrl(doc('link[rel="canonical"]').first().attr("href") ?? requestedUrl, "/product/");
  if (!canonical) throw new Error("Product canonical URL is outside the approved source");
  const nameFa = doc("h1.product_title").first().text().replace(/\s+/g, " ").trim();
  if (!nameFa) throw new Error("Source product title missing");
  const form = doc("form.variations_form").first();
  const sourceId = form.attr("data-product_id")?.trim() || null;
  const issues: string[] = [];
  const priceText = doc(".price").first().text();
  const currencyVerified = priceText.includes("تومان") && !priceText.includes("ریال");
  if (!currencyVerified) issues.push("PRICE_CURRENCY_UNVERIFIED");

  const rawVariations = form.attr("data-product_variations");
  let variationData: unknown[] = [];
  if (rawVariations && rawVariations.length <= 200_000) {
    try {
      const parsed: unknown = JSON.parse(rawVariations);
      if (Array.isArray(parsed)) variationData = parsed.slice(0, 100);
      else issues.push("VARIATIONS_UNAVAILABLE");
    } catch {
      issues.push("VARIATIONS_INVALID");
    }
  } else {
    issues.push("VARIATIONS_UNAVAILABLE");
  }
  const variants: NormalizedProduct["variants"] = [];
  for (const raw of variationData) {
    const parsed = sourceVariationSchema.safeParse(raw);
    if (!parsed.success) { issues.push("VARIATION_INVALID"); continue; }
    const source = parsed.data;
    const prices = variantPriceSchema.safeParse({
      regularPriceToman: currencyVerified ? source.display_regular_price : null,
      salePriceToman: currencyVerified && source.display_price < source.display_regular_price ? source.display_price : null,
    });
    if (!prices.success) { issues.push("PRICE_CONFLICT"); continue; }
    variants.push({
      sourceVariationId: String(source.variation_id),
      sku: source.sku?.trim() || null,
      size: source.attributes.attribute_pa_size?.toUpperCase() ?? null,
      color: source.attributes.attribute_pa_color ?? null,
      regularPriceToman: prices.data.regularPriceToman,
      salePriceToman: prices.data.salePriceToman,
      stockQty: null,
      stockStatus: source.is_in_stock ? "IN_STOCK" : "OUT_OF_STOCK",
    });
  }
  if (variants.length === 0) issues.push("NO_VERIFIED_VARIANTS");

  const mediaUrls = new Set<string>();
  doc('.woocommerce-product-gallery__image a[href]').each((_, element) => {
    const url = approvedSourceUrl(doc(element).attr("href") ?? "", "/wp-content/uploads/");
    if (url) mediaUrls.add(url);
  });
  if (mediaUrls.size === 0) issues.push("MISSING_GALLERY");

  const details: string[] = [];
  const short = doc(".woocommerce-product-details__short-description").first().text().replace(/\s+/g, " ").trim();
  if (short) details.push(short);
  const description = doc(".woocommerce-Tabs-panel--description").first().clone();
  description.find("script,style").remove();
  description.find("br,p,li,h2,h3").append("\n");
  const long = description.text().split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
  if (long && long !== short) details.push(long);
  doc(".woocommerce-product-attributes tr").each((_, element) => {
    const label = doc(element).find("th").text().replace(/\s+/g, " ").trim();
    const value = doc(element).find("td").text().replace(/\s+/g, " ").trim();
    if (label && value) details.push(`${label}: ${value}`);
  });

  const care: string[] = [];
  doc(".e-n-accordion-item").each((_, element) => {
    const title = doc(element).find("summary").first().text();
    if (!/شستشو|نگهداری/.test(title)) return;
    const content = doc(element).clone();
    content.find("summary,script,style").remove();
    content.find("br,p,li").append("\n");
    const text = content.text().split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
    if (text) care.push(text.slice(0, 2000));
  });
  const numberText = (value: string) => value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/٫/g, ".");
  const table = doc(".wd-sizeguide-table").first();
  const guideContainer = table.closest(".wd-sizeguide");
  const guideText = guideContainer.text().replace(/\s+/g, " ");
  const headers = table.find("tr").first().find("th,td").map((_, cell) => doc(cell).text().trim()).get();
  const measurements: NonNullable<NormalizedProduct["sizeGuide"]>["measurements"] = [];
  // Only source tables explicitly declaring centimetres may enter valueCm.
  if (/سانتی\s*متر/.test(guideText) && headers.length > 1) {
    table.find("tr").slice(1).each((_, row) => {
      const cells = doc(row).find("th,td").map((_, cell) => doc(cell).text().trim()).get();
      const size = numberText(cells[0] ?? "").toUpperCase();
      if (!size || size.length > 24 || cells.length !== headers.length) return;
      cells.slice(1).forEach((value, index) => {
        const numeric = numberText(value);
        if (!/^\d+(?:\.\d+)?$/.test(numeric) || Number(numeric) > 9999 || !headers[index + 1] || headers[index + 1].length > 80) return;
        measurements.push({ size, metric: headers[index + 1], valueCm: Number(numeric) });
      });
    });
  }
  const tolerance = /\+\s*\/\s*-\s*([\d۰-۹٠-٩]+(?:[.٫][\d۰-۹٠-٩]+)?)\s*سانتی/.exec(guideText);
  const sizeGuide = measurements.length && measurements.length <= 500 ? {
    titleFa: guideContainer.find("h1,h2,h3,h4,h5,.wd-sizeguide-title").first().text().trim().slice(0, 200) || "راهنمای سایز ساروچی",
    toleranceCm: tolerance ? Number(numberText(tolerance[1])) : null,
    measurements,
  } : null;

  const categoryKeys = new Set<string>();
  doc('script[type="application/ld+json"]').each((_, element) => {
    try {
      const value: unknown = JSON.parse(doc(element).html() ?? "");
      if (!value || typeof value !== "object" || !("itemListElement" in value)) return;
      const entries = (value as { itemListElement?: unknown }).itemListElement;
      if (!Array.isArray(entries)) return;
      for (const entry of entries) {
        const url = (entry as { item?: { "@id"?: string } })?.item?.["@id"];
        if (!url) continue;
        const approved = approvedSourceUrl(url, "/product-cat/");
        if (approved) categoryKeys.add(new URL(approved).pathname.slice("/product-cat/".length).replace(/\/$/, ""));
      }
    } catch { /* invalid metadata is ignored; source page fields remain authoritative */ }
  });

  return {
    sourceUrl: canonical,
    sourceId,
    nameFa,
    descriptionFa: [...new Set(details)].join("\n\n").slice(0, 20000) || null,
    care: [...new Set(care)],
    sizeGuide,
    categoryKeys: [...categoryKeys],
    variants,
    media: [...mediaUrls].map((sourceUrl, index) => ({ sourceUrl, angle: "UNKNOWN", isPrimary: index === 0 })),
    issues: [...new Set(issues)],
    collectedAt: collectedAt.toISOString(),
  };
}

export function productFingerprint(product: NormalizedProduct): string {
  const stable = { ...product, collectedAt: undefined };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}
