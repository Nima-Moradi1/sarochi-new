import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard } from "@/features/admin/auth/server/route-guard";
import { reconcileImportJob } from "@/features/import/server/reconciliation";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await adminRouteGuard(request, "READ", false);
  if (guard.response) return guard.response;
  const id = z.coerce.number().int().positive().safeParse((await context.params).id);
  if (!id.success) return NextResponse.json({ error: "INVALID_JOB_ID" }, { status: 400 });
  try { return NextResponse.json(await reconcileImportJob(id.data), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: "IMPORT_REPORT_UNAVAILABLE" }, { status: error instanceof Error && error.message === "IMPORT_JOB_NOT_FOUND" ? 404 : 503 }); }
}
