import { NextResponse } from "next/server";
import { adminRouteGuard, parseAdminJson } from "@/features/admin/auth/server/route-guard";
import { catalogIdSchema } from "@/features/admin/catalog/schemas";
import { reviewCandidateSchema } from "@/features/import/review-rules";
import { ImportReviewError, reviewImportCandidate } from "@/features/import/server/review";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  const guard = await adminRouteGuard(request, "EDIT", true);
  if (guard.response) return guard.response;
  const id = catalogIdSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const review = reviewCandidateSchema.safeParse(await parseAdminJson(request));
    if (!review.success) return NextResponse.json({ error: "INVALID_INPUT", fields: review.error.flatten() }, { status: 400 });
    return NextResponse.json(await reviewImportCandidate(guard.admin, id.data, review.data));
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    return NextResponse.json({ error: error instanceof ImportReviewError ? error.message : "IMPORT_REVIEW_UNAVAILABLE" }, { status: error instanceof ImportReviewError ? error.status : 503 });
  }
}
