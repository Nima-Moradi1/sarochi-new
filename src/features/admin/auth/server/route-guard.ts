import "server-only";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "./service";
import { adminMutationOriginAllowed } from "./origin";
import { roleAllows, type AdminRole } from "../rules";
import { readBoundedBody } from "@/lib/security/request-body";

type AdminIdentity = { id: number; email: string; role: AdminRole; sessionId: number };

export async function adminRouteGuard(request: Request, required: "READ" | "EDIT" | "OWNER", mutation: boolean): Promise<{ admin: AdminIdentity; response?: never } | { admin?: never; response: NextResponse }> {
  if (mutation && !adminMutationOriginAllowed(request)) return { response: NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 }) };
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return { response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
    if (!roleAllows(admin.role, required)) return { response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
    return { admin };
  } catch {
    return { response: NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503 }) };
  }
}

export async function parseAdminJson(request: Request, maxLength = 256 * 1024): Promise<unknown> {
  const raw = new TextDecoder().decode(await readBoundedBody(request, maxLength));
  return JSON.parse(raw) as unknown;
}
