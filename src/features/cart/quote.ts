import { variantPriceSchema } from "@/features/catalog/rules";
import type { CartItemInput } from "./schemas";

export type CartVariantRecord = {
  variantId: number;
  productId: number;
  slug: string;
  nameFa: string;
  sku: string | null;
  colorNameFa: string | null;
  sizeLabel: string | null;
  regularPriceToman: number | null;
  salePriceToman: number | null;
  stockQty: number | null;
};

export type CartQuoteLine = CartItemInput & {
  productId: number | null;
  slug: string | null;
  nameFa: string | null;
  sku: string | null;
  colorNameFa: string | null;
  sizeLabel: string | null;
  unitPriceToman: number | null;
  lineTotalToman: number | null;
  status: "READY" | "MISSING" | "PRICE_UNAVAILABLE" | "STOCK_UNKNOWN" | "INSUFFICIENT_STOCK";
};

export type CartQuote = { lines: CartQuoteLine[]; subtotalToman: number | null; canDemoCheckout: boolean; checkoutMode: "DEMO_ONLY" };

export function buildCartQuote(items: CartItemInput[], records: CartVariantRecord[]): CartQuote {
  const byVariant = new Map(records.map((record) => [record.variantId, record]));
  const lines = items.map((item): CartQuoteLine => {
    const record = byVariant.get(item.variantId);
    if (!record) return { ...item, productId: null, slug: null, nameFa: null, sku: null, colorNameFa: null, sizeLabel: null, unitPriceToman: null, lineTotalToman: null, status: "MISSING" };
    const validPrice = variantPriceSchema.safeParse({ regularPriceToman: record.regularPriceToman, salePriceToman: record.salePriceToman }).success;
    const price = validPrice ? record.salePriceToman ?? record.regularPriceToman : null;
    const status = price === null ? "PRICE_UNAVAILABLE" : record.stockQty === null ? "STOCK_UNKNOWN" : record.stockQty < item.quantity ? "INSUFFICIENT_STOCK" : "READY";
    return {
      ...item,
      productId: record.productId,
      slug: record.slug,
      nameFa: record.nameFa,
      sku: record.sku,
      colorNameFa: record.colorNameFa,
      sizeLabel: record.sizeLabel,
      unitPriceToman: price,
      lineTotalToman: price === null ? null : price * item.quantity,
      status,
    };
  });
  const canDemoCheckout = lines.length > 0 && lines.every((line) => line.status === "READY");
  return { lines, subtotalToman: canDemoCheckout ? lines.reduce((sum, line) => sum + (line.lineTotalToman ?? 0), 0) : null, canDemoCheckout, checkoutMode: "DEMO_ONLY" };
}
