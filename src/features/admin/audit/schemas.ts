import { z } from "zod";

export const auditQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export type AuditEventDTO = { id: number; actorEmail: string | null; action: string; entityType: string; entityId: string | null; createdAt: string };
export type AuditPageDTO = { items: AuditEventDTO[]; page: number; hasNext: boolean };
