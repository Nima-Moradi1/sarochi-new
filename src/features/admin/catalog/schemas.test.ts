import assert from "node:assert/strict";
import test from "node:test";
import { brandWriteSchema, categoryWriteSchema, familyWriteSchema, mediaWriteSchema, ownerUploadSchema, productWriteSchema, variantWriteSchema } from "./schemas";

test("admin catalog rejects unsafe slug and invalid category relationship", () => {
  const category = { slug: "bad/path", nameFa: "دسته پوشاک", parentId: null, sortOrder: 0, isPublished: true };
  assert.equal(categoryWriteSchema.safeParse(category).success, false);
  assert.equal(categoryWriteSchema.safeParse({ ...category, slug: "knitwear", parentId: -1 }).success, false);
});

test("media needs Sarochi provenance and cannot verify an unknown angle", () => {
  const sample = { url: "https://sarochi.ir/wp-content/a.webp", sourceUrl: "https://sarochi.ir/product/a", viewAngle: "UNKNOWN", confidence: "UNVERIFIED", variantId: null, sortOrder: 0, isPrimary: false };
  assert.equal(mediaWriteSchema.safeParse(sample).success, true);
  assert.equal(mediaWriteSchema.safeParse({ ...sample, confidence: "VERIFIED" }).success, false);
  assert.equal(mediaWriteSchema.safeParse({ ...sample, url: "https://example.com/a.webp" }).success, false);
  assert.equal(mediaWriteSchema.safeParse({ ...sample, url: "not-a-url" }).success, false);
});

test("owner upload only verifies an inspected real angle", () => {
  const sample = { rightsConfirmed: true, viewAngle: "UNKNOWN", confidence: "UNVERIFIED", variantId: null, sortOrder: 0, isPrimary: false };
  assert.equal(ownerUploadSchema.safeParse(sample).success, true);
  assert.equal(ownerUploadSchema.safeParse({ ...sample, confidence: "VERIFIED" }).success, false);
  assert.equal(ownerUploadSchema.safeParse({ ...sample, viewAngle: "BACK", confidence: "VERIFIED" }).success, true);
});

test("variant cannot invent negative stock or a sale price above regular price", () => {
  const value = { sku: null, colorId: null, sizeId: null, regularPriceToman: 100000, salePriceToman: 120000, stockQty: null };
  assert.equal(variantWriteSchema.safeParse(value).success, false);
  assert.equal(variantWriteSchema.safeParse({ ...value, salePriceToman: null, stockQty: -1 }).success, false);
  assert.equal(variantWriteSchema.safeParse({ ...value, salePriceToman: 90000 }).success, true);
});

test("manual product requires explicit category and publication state", () => {
  const sample = { slug: "a", nameFa: "محصول", description: null, garmentClass: "KNIT", status: "PUBLISHED", categoryIds: [1], brandId: null, familyId: null };
  assert.equal(productWriteSchema.safeParse(sample).success, true);
  assert.equal(productWriteSchema.safeParse({ ...sample, status: undefined }).success, false);
  assert.equal(familyWriteSchema.safeParse({ code: "style-1", titleFa: "خانواده", reviewStatus: "APPROVED" }).success, true);
  assert.equal(familyWriteSchema.safeParse({ code: "style-1", titleFa: "خانواده", reviewStatus: "AUTO" }).success, false);
  assert.equal(brandWriteSchema.safeParse({ code: "SAROCHI", nameFa: "ساروچی", nameEn: "SAROCHI" }).success, true);
  const settings = { heroEyebrowFa: "آتلیه ساروچی", heroHeadingFa: "پوشاک در حرکت", heroAccentFa: "زندگی می‌کند", heroDescriptionFa: "پوشاک را در کالکشن‌ها ببینید", heroCtaFa: "کالکشن‌ها" };
  assert.equal(brandWriteSchema.safeParse({ code: "SAROCHI", nameFa: "ساروچی", nameEn: "SAROCHI", settings }).success, true);
  assert.equal(brandWriteSchema.safeParse({ code: "SAROCHI", nameFa: "ساروچی", nameEn: "SAROCHI", settings: { ...settings, heroHeadingFa: "" } }).success, false);
});
