import "dotenv/config";
import { count, eq } from "drizzle-orm";
import { db, pool } from "./client";
import { brands, products, rails } from "./schema";

async function check() {
  const [brand] = await db.select({ name: brands.nameEn }).from(brands).where(eq(brands.code, "SAROCHI")).limit(1);
  const [productCount] = await db.select({ value: count() }).from(products);
  const [railCount] = await db.select({ value: count() }).from(rails);
  if (!brand) throw new Error("SAROCHI brand row missing");
  console.log(JSON.stringify({ brand: brand.name, products: productCount.value, rails: railCount.value }));
}

check().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
