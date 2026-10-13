import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { catalogIdSchema } from "@/features/admin/catalog/schemas";
import { uploadBrandLogo } from "@/features/admin/catalog/server/brand-logo";
import { AdminCatalogError } from "@/features/admin/catalog/server/service";
import { MediaStorageError } from "@/features/admin/catalog/server/media-storage";
import { adminRouteGuard } from "@/features/admin/auth/server/route-guard";
import { consumeLoginAttempt } from "@/features/admin/auth/server/login-throttle";
import { readBoundedBody, RequestBodyError } from "@/lib/security/request-body";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await adminRouteGuard(request, "OWNER", true);
  if (guard.response) return guard.response;
  const id = catalogIdSchema.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const key = createHash("sha256").update(`brand-logo-upload:${guard.admin.id}`).digest("hex");
    if (!await consumeLoginAttempt(key, 12, 900)) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429, headers: { "Retry-After": "900" } });
    const bytes = await readBoundedBody(request, 6 * 1024 * 1024);
    const form = await new Response(new Uint8Array(bytes), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    if (form.get("rightsConfirmed") !== "true") return NextResponse.json({ error: "PUBLICATION_RIGHTS_REQUIRED" }, { status: 400 });
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "IMAGE_REQUIRED" }, { status: 400 });
    return NextResponse.json(await uploadBrandLogo(guard.admin, id.data, file), { status: 201 });
  } catch (error) {
    if (error instanceof AdminCatalogError || error instanceof MediaStorageError || error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof TypeError) return NextResponse.json({ error: "INVALID_MULTIPART" }, { status: 400 });
    return NextResponse.json({ error: "LOGO_UPLOAD_UNAVAILABLE" }, { status: 503 });
  }
}
