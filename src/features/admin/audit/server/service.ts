import "server-only";
import { desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db/client";
import { adminAuditEvents, adminUsers } from "@/db/schema";
import { auditQuerySchema, type AuditPageDTO } from "../schemas";

export async function getAuditPage(raw: unknown): Promise<AuditPageDTO> {
  const query = auditQuerySchema.parse(raw);
  const pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await db.select({ id: adminAuditEvents.id, actorEmail: adminUsers.email, action: adminAuditEvents.action, entityType: adminAuditEvents.entityType, entityId: adminAuditEvents.entityId, createdAt: adminAuditEvents.createdAt })
    .from(adminAuditEvents).leftJoin(adminUsers, eq(adminAuditEvents.actorUserId, adminUsers.id))
    .where(query.q ? or(like(adminAuditEvents.action, pattern), like(adminAuditEvents.entityType, pattern), like(adminAuditEvents.entityId, pattern), like(adminUsers.email, pattern)) : undefined)
    .orderBy(desc(adminAuditEvents.id)).limit(51).offset((query.page - 1) * 50);
  return { items: rows.slice(0, 50).map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })), page: query.page, hasNext: rows.length > 50 };
}
