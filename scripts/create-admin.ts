import "dotenv/config";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db/client";
import { adminAuditEvents, adminUsers } from "../src/db/schema";
import { provisionSchema } from "../src/features/admin/auth/schemas";

async function main() {
  const parsed = provisionSchema.safeParse({ email: process.env.SAROCHI_ADMIN_EMAIL, password: process.env.SAROCHI_ADMIN_PASSWORD });
  if (!parsed.success) throw new Error("Set a unique SAROCHI_ADMIN_EMAIL and a password of at least 12 characters in the process environment");
  const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  if (existing) throw new Error("An admin with this email already exists; no password was changed");
  const passwordHash = await argon2.hash(parsed.data.password);
  await db.transaction(async (transaction) => {
    const result = await transaction.insert(adminUsers).values({ email: parsed.data.email, passwordHash, role: "OWNER", isActive: true });
    const id = result[0].insertId;
    await transaction.insert(adminAuditEvents).values({ actorUserId: id, action: "PROVISION", entityType: "ADMIN_USER", entityId: String(id), details: { role: "OWNER" } });
  });
  console.log("Admin owner created; password and hash were not printed.");
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Admin provision failed"); process.exitCode = 1; }).finally(() => pool.end());
