import { expect, test } from "@playwright/test";

test("public shell and invalid catalog query respond without a database fixture", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(await home.text()).toContain("SAROCHI");
  const invalid = await request.get("/api/v1/catalog/products?limit=invalid");
  expect(invalid.status()).toBe(400);
});

test("admin reads and mutation fail closed without a session or origin", async ({ request }) => {
  for (const path of ["/api/v1/admin/imports", "/api/v1/admin/brands", "/api/v1/admin/products/1/media", "/api/v1/admin/pages"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
  }
  const mutation = await request.post("/api/v1/admin/imports/1/commit");
  expect(mutation.status()).toBe(403);
});
