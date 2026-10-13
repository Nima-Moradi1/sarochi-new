import assert from "node:assert/strict";
import test from "node:test";
import { importProductSlug, reviewCandidateSchema, validateCandidatePayload } from "./review-rules";

test("review requires explicit category, class and reason", () => {
  const sample = { decision: "APPROVE", categoryIds: [2], garmentClass: "KNIT", note: "Checked source product and category" };
  assert.equal(reviewCandidateSchema.safeParse(sample).success, true);
  assert.equal(reviewCandidateSchema.safeParse({ ...sample, categoryIds: [] }).success, false);
  assert.equal(reviewCandidateSchema.safeParse({ ...sample, note: "" }).success, false);
  assert.equal(importProductSlug("abcdef0123456789abcdef"), "sarochi-abcdef0123456789abcd");
});

test("commit refuses off-source product evidence", () => {
  const sample = { sourceUrl: "https://example.com/product/a", sourceId: null, nameFa: "پوشاک", descriptionFa: null, categoryKeys: [], variants: [{ sourceVariationId: "1", sku: null, size: null, color: null, regularPriceToman: null, salePriceToman: null, stockQty: null, stockStatus: "IN_STOCK" }], media: [], issues: [], collectedAt: "2026-10-13T11:00:00.000Z" };
  assert.throws(() => validateCandidatePayload(sample), /SOURCE_HOST_UNAPPROVED/);
  assert.equal(validateCandidatePayload({ ...sample, sourceUrl: "https://sarochi.ir/product/a" }).variants[0].stockQty, null);
});
