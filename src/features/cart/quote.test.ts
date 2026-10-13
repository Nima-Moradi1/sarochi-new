import assert from "node:assert/strict";
import test from "node:test";
import { cartItemsSchema } from "./schemas";
import { buildCartQuote, type CartVariantRecord } from "./quote";

const base: CartVariantRecord = { variantId: 7, productId: 2, slug: "item", nameFa: "محصول", sku: "SKU-7", colorNameFa: "مشکی", sizeLabel: "M", regularPriceToman: 500000, salePriceToman: 400000, stockQty: 2 };

test("quote totals only validated source price and sufficient stock", () => {
  const quote = buildCartQuote([{ variantId: 7, quantity: 2 }], [base]);
  assert.equal(quote.lines[0].status, "READY");
  assert.equal(quote.subtotalToman, 800000);
  assert.equal(quote.checkoutMode, "DEMO_ONLY");
});

test("unknown stock, missing price and missing variant cannot demo checkout", () => {
  assert.equal(buildCartQuote([{ variantId: 7, quantity: 1 }], [{ ...base, stockQty: null }]).lines[0].status, "STOCK_UNKNOWN");
  assert.equal(buildCartQuote([{ variantId: 7, quantity: 1 }], [{ ...base, regularPriceToman: null, salePriceToman: null }]).subtotalToman, null);
  assert.equal(buildCartQuote([{ variantId: 8, quantity: 1 }], [base]).lines[0].status, "MISSING");
  assert.equal(buildCartQuote([{ variantId: 7, quantity: 3 }], [base]).lines[0].status, "INSUFFICIENT_STOCK");
});

test("invalid or duplicate cart inputs are rejected", () => {
  assert.equal(cartItemsSchema.safeParse([{ variantId: 7, quantity: 0 }]).success, false);
  assert.equal(cartItemsSchema.safeParse([{ variantId: 7, quantity: 1 }, { variantId: 7, quantity: 1 }]).success, false);
});
