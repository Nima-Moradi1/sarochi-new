import { NextResponse } from "next/server";
import { adminRouteGuard } from "@/features/admin/auth/server/route-guard";
import { catalogIdSchema } from "@/features/admin/catalog/schemas";
import { commitImportCandidate, ImportReviewError } from "@/features/import/server/review";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const guard = await adminRouteGuard(request, "OWNER", true);
  if (guard.response) return guard.response;
  const id = catalogIdSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try { return NextResponse.json(await commitImportCandidate(guard.admin, id.data)); }
  catch (error) { return NextResponse.json({ error: error instanceof ImportReviewError ? error.message : "IMPORT_COMMIT_UNAVAILABLE" }, { status: error instanceof ImportReviewError ? error.status : 503 }); }
}
