import assert from "node:assert/strict";
import test from "node:test";
import { stageDecision } from "./staging-rules";

test("approved source changes become conflicts without replacing approved evidence", () => {
  assert.equal(stageDecision({ currentFingerprint: "new" }), "PENDING_REVIEW");
  assert.equal(stageDecision({ previousFingerprint: "same", previousReviewStatus: "APPROVED", currentFingerprint: "same" }), "UNCHANGED");
  assert.equal(stageDecision({ previousFingerprint: "old", previousReviewStatus: "APPROVED", currentFingerprint: "new" }), "CONFLICT");
  assert.equal(stageDecision({ previousFingerprint: "old", previousReviewStatus: "COMMITTED", currentFingerprint: "new" }), "CONFLICT");
  assert.equal(stageDecision({ previousFingerprint: "old", previousReviewStatus: "PENDING_REVIEW", currentFingerprint: "new" }), "PENDING_REVIEW");
});
