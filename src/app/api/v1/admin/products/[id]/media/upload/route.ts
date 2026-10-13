import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { adminRouteGuard } from "@/features/admin/auth/server/route-guard";
import { catalogIdSchema, ownerUploadSchema } from "@/features/admin/catalog/schemas";
import { AdminCatalogError, uploadOwnerMedia } from "@/features/admin/catalog/server/service";
import { MediaStorageError } from "@/features/admin/catalog/server/media-storage";
import { readBoundedBody, RequestBodyError } from "@/lib/security/request-body";
import { consumeLoginAttempt } from "@/features/admin/auth/server/login-throttle";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const guard = await adminRouteGuard(request, "OWNER", true);
  if (guard.response) return guard.response;
  const productId = catalogIdSchema.safeParse((await params).id);
  if (!productId.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const key = createHash("sha256").update(`owner-product-media:${guard.admin.id}`).digest("hex");
    if (!await consumeLoginAttempt(key, 20, 900)) return NextResponse.json({ error: "TOO_MANY_UPLOADS" }, { status: 429, headers: { "Retry-After": "900" } });
    const bytes = await readBoundedBody(request, 6 * 1024 * 1024);
    const form = await new Response(new Uint8Array(bytes), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "IMAGE_REQUIRED" }, { status: 400 });
    const values = ownerUploadSchema.safeParse({
      viewAngle: form.get("viewAngle"),
      confidence: form.get("confidence"),
      variantId: !form.get("variantId") ? null : Number(form.get("variantId")),
      sortOrder: Number(form.get("sortOrder")),
      isPrimary: form.get("isPrimary") === "true",
      rightsConfirmed: form.get("rightsConfirmed") === "true",
    });
    if (!values.success) return NextResponse.json({ error: "INVALID_INPUT", fields: z.treeifyError(values.error) }, { status: 400 });
    return NextResponse.json(await uploadOwnerMedia(guard.admin, productId.data, values.data, file), { status: 201 });
  } catch (error) {
    if (error instanceof MediaStorageError || error instanceof AdminCatalogError || error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof TypeError) return NextResponse.json({ error: "INVALID_MULTIPART" }, { status: 400 });
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 503 });
  }
}
