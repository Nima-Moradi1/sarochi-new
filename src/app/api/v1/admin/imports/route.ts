import { NextResponse } from "next/server";
import { adminRouteGuard } from "@/features/admin/auth/server/route-guard";
import { getImportReviewDashboard, ImportReviewError } from "@/features/import/server/review";

export async function GET(request: Request) {
  const guard = await adminRouteGuard(request, "READ", false);
  if (guard.response) return guard.response;
  const page = Number(new URL(request.url).searchParams.get("page") ?? "1");
  try { return NextResponse.json(await getImportReviewDashboard(page), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof ImportReviewError ? error.message : "IMPORT_REVIEW_UNAVAILABLE" }, { status: error instanceof ImportReviewError ? error.status : 503 }); }
}
