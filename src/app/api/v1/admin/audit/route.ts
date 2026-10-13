import { NextResponse } from "next/server";
import { adminRouteGuard } from "@/features/admin/auth/server/route-guard";
import { auditQuerySchema } from "@/features/admin/audit/schemas";
import { getAuditPage } from "@/features/admin/audit/server/service";

export async function GET(request: Request) {
  const guard = await adminRouteGuard(request, "OWNER", false);
  if (guard.response) return guard.response;
  const query = auditQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return NextResponse.json({ error: "INVALID_QUERY", fields: query.error.flatten() }, { status: 400 });
  try { return NextResponse.json(await getAuditPage(query.data), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "AUDIT_UNAVAILABLE" }, { status: 503 }); }
}
