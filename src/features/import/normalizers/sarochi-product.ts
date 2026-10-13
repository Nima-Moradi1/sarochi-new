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
    descriptionFa: doc(".woocommerce-product-details__short-description").first().text().replace(/\s+/g, " ").trim() || null,
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
