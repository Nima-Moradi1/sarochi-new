import { expect, test } from "@playwright/test";

test.skip(!process.env.E2E_DATABASE_READY, "Requires migrated MySQL, published source samples and installed Chromium");

test("source rack selection reaches the same product and original photographs", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#rack")).toHaveAttribute("data-hydrated", "true");
  const garments = page.locator("[data-product-id]");
  await expect(garments.first()).toBeAttached();
  const selectedId = await garments.nth(Math.floor(await garments.count() / 2)).getAttribute("data-product-id");
  await page.getByRole("button", { name: "نمای نزدیک", exact: true }).click();
  await expect(page.getByRole("region", { name: /نمای نزدیک/ })).toBeVisible();
  const link = page.getByRole("link", { name: "مشاهده محصول" });
  const productPath = await link.getAttribute("href");
  expect(productPath).toMatch(/^\/products\//);
  await link.click();
  await expect(page).toHaveURL(new RegExp(productPath! + "(?:\\?|$)"));
  const response = await page.request.get(`/api/v1/catalog/products/${productPath!.split("/").at(-1)}`);
  const detail = await response.json();
  expect(detail.id).toBe(Number(selectedId));
  expect(detail.sourceType).toBe("SAROCHI");
  await page.getByRole("link", { name: "نمایش استایل" }).click();
  await expect(page).toHaveURL(/\/style\//);
  await expect(page.locator("main img").first()).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("rack keyboard controls and reduced motion preserve page scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#rack")).toHaveAttribute("data-hydrated", "true");
  const garments = page.locator("[data-product-id]");
  await expect(garments.first()).toBeAttached();
  const total = String(await garments.count()).padStart(2, "0");
  await garments.first().focus();
  await page.keyboard.press("End");
  await expect(page.getByText(`${total} / ${total}`, { exact: true })).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.getByText(`01 / ${total}`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "نمای نزدیک", exact: true }).click();
  await expect(page.getByRole("region", { name: /نمای نزدیک/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: /نمای نزدیک/ })).toBeHidden();
  await expect(garments.first()).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await page.locator("#rack").hover();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
});
