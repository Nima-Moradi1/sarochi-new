import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRouteGuard, parseAdminJson } from "@/features/admin/auth/server/route-guard";
import { guideWriteSchema } from "../schemas";
import { AdminGuideError, deleteGuide, listGuides, saveGuide } from "./service";

const querySchema = z.object({ kind: z.enum(["care", "size"]), page: z.coerce.number().int().min(1).max(10000).default(1) });
function failure(error: unknown) {
  if (error instanceof AdminGuideError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return NextResponse.json({ error: error.message }, { status: 413 });
  return NextResponse.json({ error: "GUIDES_UNAVAILABLE" }, { status: 503 });
}

export async function handleGuides(request: Request, rawId?: string) {
  const mutation = request.method !== "GET";
  const guard = await adminRouteGuard(request, mutation ? "EDIT" : "READ", mutation);
  if (guard.response) return guard.response;
  const id = rawId === undefined ? undefined : z.coerce.number().int().positive().safeParse(rawId);
  if (id && !id.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    if (request.method === "GET" || request.method === "DELETE") {
      const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
      if (!parsed.success) return NextResponse.json({ error: "INVALID_QUERY", fields: parsed.error.flatten() }, { status: 400 });
      if (request.method === "DELETE") {
        if (!id?.success) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
        await deleteGuide(guard.admin, parsed.data.kind, id.data);
        return new NextResponse(null, { status: 204 });
      }
      return NextResponse.json(await listGuides(parsed.data.kind, parsed.data.page), { headers: { "Cache-Control": "no-store" } });
    }
    const input = guideWriteSchema.safeParse(await parseAdminJson(request));
    if (!input.success) return NextResponse.json({ error: "INVALID_INPUT", fields: input.error.flatten() }, { status: 400 });
    return NextResponse.json(await saveGuide(guard.admin, input.data, id?.success ? id.data : undefined), { status: request.method === "POST" ? 201 : 200 });
  } catch (error) { return failure(error); }
}
