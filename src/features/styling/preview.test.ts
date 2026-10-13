import assert from "node:assert/strict";
import test from "node:test";
import { previewColor, previewSizeScale, visualClass } from "./preview";

test("unknown colors and classes stay neutral instead of inventing product detail", () => {
  assert.deepEqual(previewColor(null), { hex: "#68766c", verified: false });
  assert.deepEqual(previewColor("red"), { hex: "#68766c", verified: false });
  assert.equal(visualClass("UNCLASSIFIED"), "OTHER");
});

test("known values select illustrative archetypes", () => {
  assert.deepEqual(previewColor("#134235"), { hex: "#134235", verified: true });
  assert.equal(visualClass("JACKET"), "JACKET");
  assert.equal(previewSizeScale("XL"), 1.07);
  assert.equal(previewSizeScale("custom"), 1);
});
