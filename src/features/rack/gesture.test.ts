import assert from "node:assert/strict";
import test from "node:test";
import { boundedDragOffset, nextIndexAfterDrag } from "./gesture";

test("short movement returns to current garment, deliberate drag snaps by direction", () => {
  assert.equal(nextIndexAfterDrag(2, 6, 200, 18, 0), 2);
  assert.equal(nextIndexAfterDrag(2, 6, 200, -110, 0), 3);
  assert.equal(nextIndexAfterDrag(2, 6, 200, 110, 0), 1);
});

test("velocity can complete a swipe, but never crosses catalog boundaries", () => {
  assert.equal(nextIndexAfterDrag(2, 6, 200, -15, -800), 3);
  assert.equal(nextIndexAfterDrag(0, 6, 200, 500, 1000), 0);
  assert.equal(nextIndexAfterDrag(5, 6, 200, -500, -1000), 5);
  assert.equal(nextIndexAfterDrag(0, 0, 200, -200, 0), 0);
});

test("outward drag is damped at both ends", () => {
  assert.equal(boundedDragOffset(0, 6, 400), 30);
  assert.equal(boundedDragOffset(5, 6, -400), -30);
  assert.equal(boundedDragOffset(2, 6, -100), -100);
});
