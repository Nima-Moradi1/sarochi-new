import assert from "node:assert/strict";
import test from "node:test";
import { SarochiHtmlSource } from "./sarochi-html";
import { isAllowedByRobots, SourceAccessError, SourceHttpClient } from "./source-http";

const robots = "User-agent: *\nDisallow: /wp-admin/\nDisallow: /*?*\nAllow: /wp-admin/admin-ajax.php\n";

test("robots policy protects query and admin paths", () => {
  assert.equal(isAllowedByRobots(robots, "https://sarochi.ir/product-cat/t-shirt/"), true);
  assert.equal(isAllowedByRobots(robots, "https://sarochi.ir/wp-json/wc/store/v1/products?per_page=1"), false);
  assert.equal(isAllowedByRobots(robots, "https://sarochi.ir/wp-admin/users.php"), false);
  assert.equal(isAllowedByRobots(robots, "https://sarochi.ir/wp-admin/admin-ajax.php"), true);
  assert.throws(() => isAllowedByRobots(robots, "http://localhost/private"), SourceAccessError);
});

test("HTML discovery follows only source category paths and deduplicates product links", async () => {
  const calls: string[] = [];
  const pages: Record<string, string> = {
    "/robots.txt": robots,
    "/shop/": '<a href="/product-cat/t-shirt/">تیشرت</a><a href="/product-cat/t-shirt/">تیشرت</a><a href="https://other.test/product-cat/fake/">جعلی</a>',
    "/product-cat/t-shirt/": '<div class="product-wrapper"><a href="/product/tee-one/">یک</a><a href="/product/tee-one/">یک</a></div><a class="page-numbers" href="/product-cat/t-shirt/page/2/">2</a>',
  };
  const fakeFetch: typeof fetch = async (input) => {
    const path = new URL(input.toString()).pathname;
    calls.push(path);
    return new Response(pages[path] ?? "missing", { status: pages[path] ? 200 : 404, headers: { "content-type": path === "/robots.txt" ? "text/plain" : "text/html" } });
  };
  const source = new SarochiHtmlSource(new SourceHttpClient({ fetchImpl: fakeFetch, minIntervalMs: 0 }));
  const categories = await source.discoverCategories();
  assert.deepEqual(categories.map((category) => category.key), ["t-shirt"]);
  const page = await source.listProductPage({ categoryKey: "t-shirt" });
  assert.equal(page.refs.length, 1);
  assert.equal(page.refs[0].sourceUrl, "https://sarochi.ir/product/tee-one/");
  assert.equal(page.nextCursor, "2");
  await assert.rejects(source.listProductPage({ categoryKey: "other" }), SourceAccessError);
  assert.deepEqual(calls, ["/robots.txt", "/shop/", "/product-cat/t-shirt/"]);
});

test("source client caps bytes and refuses redirects off the approved host", async () => {
  const oversized: typeof fetch = async (input) => new Response(new URL(input.toString()).pathname === "/robots.txt" ? "User-agent: *" : "123456789012345678901", { headers: { "content-type": "text/html" } });
  const client = new SourceHttpClient({ fetchImpl: oversized, minIntervalMs: 0, maxBytes: 20 });
  await assert.rejects(client.html("/shop/"), SourceAccessError);
  const redirectFetch: typeof fetch = async (input) => new URL(input.toString()).pathname === "/robots.txt"
    ? new Response(robots, { headers: { "content-type": "text/plain" } })
    : new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } });
  const redirected = new SourceHttpClient({ fetchImpl: redirectFetch, minIntervalMs: 0 });
  await assert.rejects(redirected.html("/shop/"), SourceAccessError);
});
