import assert from "node:assert/strict";
import test from "node:test";
import { effectivePriceToman, stockState, variantPriceSchema } from "./rules";
import { productQuerySchema } from "./schemas";

test("price preserves Toman integer values and rejects inconsistent discounts", () => {
  assert.equal(effectivePriceToman(6_480_000, 5_184_000), 5_184_000);
  assert.equal(effectivePriceToman(null, null), null);
  assert.equal(variantPriceSchema.safeParse({ regularPriceToman: 100, salePriceToman: 101 }).success, false);
  assert.equal(variantPriceSchema.safeParse({ regularPriceToman: null, salePriceToman: 50 }).success, false);
  assert.equal(variantPriceSchema.safeParse({ regularPriceToman: -1, salePriceToman: null }).success, false);
});

test("unknown quantity never becomes unlimited stock", () => {
  assert.equal(stockState([]), "UNKNOWN");
  assert.equal(stockState([null]), "UNKNOWN");
  assert.equal(stockState([0, null]), "UNKNOWN");
  assert.equal(stockState([0, 0]), "OUT_OF_STOCK");
  assert.equal(stockState([0, 2]), "IN_STOCK");
});

test("catalog pagination and price bounds reject invalid queries", () => {
  assert.equal(productQuerySchema.parse({}).limit, 12);
  assert.equal(productQuerySchema.safeParse({ limit: 25 }).success, false);
  assert.equal(productQuerySchema.safeParse({ cursor: 0 }).success, false);
  assert.equal(productQuerySchema.safeParse({ minPrice: 100, maxPrice: 99 }).success, false);
  assert.equal(productQuerySchema.safeParse({ category: "../admin" }).success, false);
});
