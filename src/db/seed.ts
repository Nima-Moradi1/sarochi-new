import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { db, pool } from "./client";
import { brands, categories, colors, productCategories, products, productVariants, railItems, rails, sizes } from "./schema";
import { readBrandSettingsRecord } from "../features/content/brand-settings";

const demoGroups = [
  { slug: "knitwear", title: "بافت", garmentClass: "KNIT", item: "بافت ساده" },
  { slug: "tshirts", title: "تی‌شرت", garmentClass: "TSHIRT", item: "تی‌شرت ساده" },
  { slug: "shirts", title: "پیراهن", garmentClass: "SHIRT", item: "پیراهن ساده" },
  { slug: "jackets", title: "کت و جکت", garmentClass: "JACKET", item: "جکت ساده" },
] as const;

async function idBySlug(table: typeof categories | typeof rails | typeof products | typeof colors, slug: string) {
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
  if (!row) throw new Error(`Missing seeded record: ${slug}`);
  return row.id;
}

async function seed() {
  await db.insert(brands).values({ code: "SAROCHI", nameFa: "ساروچی", nameEn: "SAROCHI" }).onDuplicateKeyUpdate({ set: { code: "SAROCHI" } });
  await db.update(brands).set({ settings: {
    heroEyebrowFa: "آتلیه زنده ساروچی",
    heroHeadingFa: "لباس، پیش از آن‌که پوشیده شود،",
    heroAccentFa: "جان می‌گیرد.",
    heroDescriptionFa: "در میان کالکشن‌ها حرکت کنید، جزئیات را از نزدیک ببینید و پوشاک مناسب خود را انتخاب کنید.",
    heroCtaFa: "کالکشن‌ها را ببینید",
  } }).where(and(eq(brands.code, "SAROCHI"), isNull(brands.settings)));
  const [brand] = await db.select({ id: brands.id, settings: brands.settings }).from(brands).where(eq(brands.code, "SAROCHI")).limit(1);
  const brandSettings = readBrandSettingsRecord(brand?.settings);
  if (brand && brandSettings.stylingPresets === undefined) {
    await db.update(brands).set({ settings: { ...brandSettings, stylingPresets: [
      { id: "classic", labelFa: "فرم کلاسیک", shoulder: 0.47, bodyScale: 1 },
      { id: "relaxed", labelFa: "فرم آزاد", shoulder: 0.53, bodyScale: 1.08 },
    ] } }).where(eq(brands.id, brand.id));
  }
  for (const [sortOrder, label] of ["M", "L", "XL", "XXL"].entries()) {
    await db.insert(sizes).values({ label, sortOrder }).onDuplicateKeyUpdate({ set: { label } });
  }
  await db.insert(colors).values({ slug: "ink", nameFa: "مشکی", hex: "#171b19" }).onDuplicateKeyUpdate({ set: { slug: "ink" } });
  const colorId = await idBySlug(colors, "ink");
  for (const [groupIndex, group] of demoGroups.entries()) {
    await db.insert(categories).values({ slug: group.slug, nameFa: group.title, sortOrder: groupIndex, isPublished: true }).onDuplicateKeyUpdate({ set: { slug: group.slug } });
    const categoryId = await idBySlug(categories, group.slug);
    await db.insert(rails).values({ slug: group.slug, titleFa: group.title, categoryId, sortOrder: groupIndex, isPublished: true }).onDuplicateKeyUpdate({ set: { slug: group.slug } });
    const railId = await idBySlug(rails, group.slug);
    for (let position = 0; position < 6; position += 1) {
      const slug = `demo-${group.slug}-${String(position + 1).padStart(2, "0")}`;
      await db.insert(products).values({
        slug,
        nameFa: `${group.item} — نمونه ${position + 1}`,
        garmentClass: group.garmentClass,
        status: "PUBLISHED",
        sourceType: "DEMO",
        description: "نمونه نمایشی؛ محصول واقعی ساروچی نیست.",
      }).onDuplicateKeyUpdate({ set: { slug } });
      const productId = await idBySlug(products, slug);
      await db.insert(productCategories).values({ productId, categoryId }).onDuplicateKeyUpdate({ set: { productId } });
      await db.insert(railItems).values({ railId, productId, position }).onDuplicateKeyUpdate({ set: { position } });
      const sku = `DEMO-${group.slug.toUpperCase()}-${position + 1}`;
      await db.insert(productVariants).values({ productId, sku, colorId, stockStatus: "UNKNOWN" }).onDuplicateKeyUpdate({ set: { sku } });
    }
  }
  console.log("Seeded 4 demo rails and 24 clearly marked demo products; no prices, inventory or original media were invented.");
}

seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
