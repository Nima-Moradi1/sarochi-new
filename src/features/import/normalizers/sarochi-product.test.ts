import assert from "node:assert/strict";
import test from "node:test";
import { parseSarochiProduct, productFingerprint } from "./sarochi-product";

const url = "https://sarochi.ir/product/knit-pink/";
const variations = JSON.stringify([
  { variation_id: 32, attributes: { attribute_pa_size: "m" }, display_price: 5_184_000, display_regular_price: 6_480_000, is_in_stock: true, max_qty: 2, sku: "K-32" },
  { variation_id: 33, attributes: { attribute_pa_size: "l" }, display_price: 5_184_000, display_regular_price: 6_480_000, is_in_stock: false, max_qty: 0, sku: "K-33" },
]);

function productHtml(priceText = "تومان 6,480,000 تومان 5,184,000") {
  return `<html><head><link rel="canonical" href="${url}"><script type="application/ld+json">${JSON.stringify({ itemListElement: [{ item: { "@id": "https://sarochi.ir/product-cat/salonik-stitch/" } }] })}</script></head><body>
    <h1 class="product_title">بافت یقه هفت ساده Pink</h1><div class="price">${priceText}</div>
    <form class="variations_form" data-product_id="1842" data-product_variations='${variations}'></form>
    <div class="woocommerce-product-gallery__image"><a href="/wp-content/uploads/front.jpg">Front</a></div>
    <div class="woocommerce-product-gallery__image"><a href="/wp-content/uploads/detail.jpg">Detail</a></div>
  </body></html>`;
}

test("normalizer keeps original price, unknown quantity and unclassified media", () => {
  const product = parseSarochiProduct(productHtml(), url, new Date("2026-10-13T08:00:00Z"));
  assert.equal(product.sourceId, "1842");
  assert.deepEqual(product.categoryKeys, ["salonik-stitch"]);
  assert.equal(product.variants.length, 2);
  assert.equal(product.variants[0].regularPriceToman, 6_480_000);
  assert.equal(product.variants[0].salePriceToman, 5_184_000);
  assert.equal(product.variants[0].stockQty, null);
  assert.equal(product.variants[0].stockStatus, "IN_STOCK");
  assert.equal(product.variants[1].stockStatus, "OUT_OF_STOCK");
  assert.deepEqual(product.media.map((item) => item.angle), ["UNKNOWN", "UNKNOWN"]);
  assert.equal(product.issues.length, 0);
  assert.equal(productFingerprint(product), productFingerprint({ ...product, collectedAt: "2026-10-14T00:00:00Z" }));
});

test("unverified currency removes prices and requires review", () => {
  const product = parseSarochiProduct(productHtml("ریال 64,800,000"), url);
  assert.equal(product.variants[0].regularPriceToman, null);
  assert.equal(product.variants[0].salePriceToman, null);
  assert.deepEqual(product.issues, ["PRICE_CURRENCY_UNVERIFIED"]);
});

test("canonical URL cannot cross the approved source host", () => {
  assert.throws(() => parseSarochiProduct('<link rel="canonical" href="http://127.0.0.1/private"><h1 class="product_title">bad</h1>', url));
});
