import assert from "node:assert/strict";
import test from "node:test";
import { roleAllows, sameOrigin } from "./rules";

test("admin write permissions require editor or owner", () => {
  assert.equal(roleAllows("VIEWER", "EDIT"), false);
  assert.equal(roleAllows("EDITOR", "EDIT"), true);
  assert.equal(roleAllows("EDITOR", "OWNER"), false);
});

test("state changing requests require exact same origin", () => {
  assert.equal(sameOrigin("https://sarochi.ir", "https://sarochi.ir"), true);
  assert.equal(sameOrigin("https://sarochi.ir.attacker.test", "https://sarochi.ir"), false);
  assert.equal(sameOrigin(null, "https://sarochi.ir"), false);
  assert.equal(sameOrigin("null", "https://sarochi.ir"), false);
});
