import assert from "node:assert/strict";
import test from "node:test";
import type { ProductDetailDTO } from "./types";
import { variantForColor, variantForSize } from "./variant-selection";

const variants: ProductDetailDTO["variants"] = [
  { id: 1, sku: null, color: { slug: "black", nameFa: "مشکی", hex: null }, size: { label: "M", sortOrder: 1 }, regularPriceToman: null, salePriceToman: null, stockQty: null },
  { id: 2, sku: null, color: { slug: "black", nameFa: "مشکی", hex: null }, size: { label: "L", sortOrder: 2 }, regularPriceToman: null, salePriceToman: null, stockQty: null },
  { id: 3, sku: null, color: { slug: "white", nameFa: "سفید", hex: null }, size: { label: "M", sortOrder: 1 }, regularPriceToman: null, salePriceToman: null, stockQty: null },
];

test("color change preserves size when the combination exists", () => {
  assert.equal(variantForColor(variants, "white", "M")?.id, 3);
  assert.equal(variantForColor(variants, "white", "L")?.id, 3);
});

test("missing color and size combinations cannot select another color silently", () => {
  assert.equal(variantForSize(variants, "L", "white"), null);
  assert.equal(variantForSize(variants, "L", "black")?.id, 2);
});
