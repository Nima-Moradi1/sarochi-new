import "server-only";
import { createHash, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { adminAuditEvents, adminSessions, adminUsers } from "@/db/schema";
import type { AdminRole } from "../rules";
import { roleAllows } from "../rules";

const sessionDurationSeconds = 8 * 60 * 60;
const dummyHash = argon2.hash(randomBytes(32).toString("hex"));
export const adminCookieName = process.env.NODE_ENV === "production" ? "__Host-sarochi_admin" : "sarochi_admin_dev";

function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function validRole(value: string): value is AdminRole { return value === "OWNER" || value === "EDITOR" || value === "VIEWER"; }

export async function verifyAdminLogin(email: string, password: string) {
  const [user] = await db.select({ id: adminUsers.id, email: adminUsers.email, passwordHash: adminUsers.passwordHash, role: adminUsers.role })
    .from(adminUsers).where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true))).limit(1);
  const matches = await argon2.verify(user?.passwordHash ?? await dummyHash, password);
  if (!user || !matches || !validRole(user.role)) return null;
  return { id: user.id, email: user.email, role: user.role };
}

export async function createAdminSession(user: { id: number; role: AdminRole }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
  await db.transaction(async (transaction) => {
    await transaction.insert(adminSessions).values({ userId: user.id, tokenHash: hashToken(token), expiresAt });
    await transaction.insert(adminAuditEvents).values({ actorUserId: user.id, action: "LOGIN", entityType: "ADMIN_SESSION", details: { role: user.role } });
  });
  return { token, expiresAt };
}

export function adminCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: sessionDurationSeconds };
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(adminCookieName)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await db.select({
    sessionId: adminSessions.id,
    id: adminUsers.id,
    email: adminUsers.email,
    role: adminUsers.role,
  }).from(adminSessions).innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.tokenHash, hashToken(token)), isNull(adminSessions.revokedAt), gt(adminSessions.expiresAt, new Date()), eq(adminUsers.isActive, true))).limit(1);
  if (!row || !validRole(row.role)) return null;
  return { ...row, role: row.role as AdminRole };
}

export async function requireAdmin(required: "READ" | "EDIT" | "OWNER") {
  const admin = await getCurrentAdmin();
  return admin && roleAllows(admin.role, required) ? admin : null;
}

export async function revokeCurrentAdminSession() {
  const admin = await getCurrentAdmin();
  if (!admin) return;
  await db.transaction(async (transaction) => {
    await transaction.update(adminSessions).set({ revokedAt: new Date() }).where(eq(adminSessions.id, admin.sessionId));
    await transaction.insert(adminAuditEvents).values({ actorUserId: admin.id, action: "LOGOUT", entityType: "ADMIN_SESSION", entityId: String(admin.sessionId) });
  });
}

export async function auditAdminMutation(actorUserId: number, action: string, entityType: string, entityId: string, fields: string[]) {
  await db.insert(adminAuditEvents).values({ actorUserId, action, entityType, entityId, details: { fields } });
}
