import { expect, test } from "@playwright/test";

test.skip(!process.env.E2E_DATABASE_READY, "Requires migrated and seeded MySQL and installed Chromium");

test("rack selection reaches a real product and conceptual styling room", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "کالکشن در حرکت" })).toBeVisible();
  await expect(page.locator("#rack")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: /بافت ساده.*1 از 6/ }).first().click();
  await expect(page.getByRole("region", { name: /نمای نزدیک/ })).toBeVisible();
  await page.getByRole("link", { name: "مشاهده محصول" }).click();
  await expect(page).toHaveURL(/\/products\/demo-knitwear-01/);
  await expect(page.getByText("موجودی نامشخص")).toBeVisible();
  await page.getByRole("link", { name: "پیش‌نمایش سه‌بعدی تقریبی" }).click();
  await expect(page).toHaveURL(/\/style\/demo-knitwear-01/);
  await expect(page.getByText(/پیش‌نمایش سه‌بعدی تقریبی است/)).toBeVisible();
  await expect(page.getByRole("button", { name: "چرخش به چپ" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
});

test("rack keyboard controls and reduced motion preserve page scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#rack")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "پوشاک بعدی" }).click();
  await expect(page.getByText("02 / 06")).toBeVisible();
  await page.getByRole("button", { name: /بافت ساده.*1 از 6/ }).focus();
  await page.keyboard.press("End");
  await expect(page.getByText("06 / 06")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.getByText("01 / 06")).toBeVisible();
  await page.getByRole("button", { name: "نمای نزدیک", exact: true }).click();
  await expect(page.getByRole("region", { name: /نمای نزدیک/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: /نمای نزدیک/ })).toBeHidden();
  await expect(page.getByRole("button", { name: /بافت ساده.*1 از 6/ })).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.locator("#rack").hover();
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 350);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});
