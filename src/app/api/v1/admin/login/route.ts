import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { loginSchema } from "@/features/admin/auth/schemas";
import { clearLoginAttempts, consumeLoginAttempt } from "@/features/admin/auth/server/login-throttle";
import { parseAdminJson } from "@/features/admin/auth/server/route-guard";
import { RequestBodyError } from "@/lib/security/request-body";
import { adminCookieName, adminCookieOptions, createAdminSession, verifyAdminLogin } from "@/features/admin/auth/server/service";
import { adminMutationOriginAllowed } from "@/features/admin/auth/server/origin";

export async function POST(request: Request) {
  if (!adminMutationOriginAllowed(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  let data: unknown;
  try { data = await parseAdminJson(request, 5000); } catch (error) { return NextResponse.json({ error: "INVALID_INPUT" }, { status: error instanceof RequestBodyError ? error.status : 400 }); }
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const key = createHash("sha256").update(parsed.data.email).digest("hex");
  try {
    const globalKey = createHash("sha256").update("sarochi-admin-login-global").digest("hex");
    if (!await consumeLoginAttempt(globalKey, 100, 60) || !await consumeLoginAttempt(key)) return NextResponse.json({ error: "TOO_MANY_ATTEMPTS" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "900" } });
    const user = await verifyAdminLogin(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const session = await createAdminSession(user);
    await clearLoginAttempts(key);
    const response = NextResponse.json({ role: user.role }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(adminCookieName, session.token, adminCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
