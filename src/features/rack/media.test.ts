import assert from "node:assert/strict";
import test from "node:test";
import { selectRackMedia } from "./media";

test("unclassified gallery media cannot become an authentic back", () => {
  const result = selectRackMedia([{ url: "https://sarochi.ir/a.jpg", angle: "UNKNOWN", confidence: "UNVERIFIED" }]);
  assert.equal(result.front?.angle, "UNKNOWN");
  assert.equal(result.back, null);
  assert.equal(result.frontVerified, false);
});

test("flip requires both verified front and back media", () => {
  const media = [
    { url: "https://sarochi.ir/a.jpg", angle: "FRONT", confidence: "VERIFIED" },
    { url: "https://sarochi.ir/b.jpg", angle: "BACK", confidence: "UNVERIFIED" },
  ];
  assert.equal(selectRackMedia(media).back, null);
  const verified = selectRackMedia([{ ...media[1], confidence: "VERIFIED" }, media[0]]);
  assert.equal(verified.front?.url, media[0].url);
  assert.equal(verified.back?.url, media[1].url);
});
