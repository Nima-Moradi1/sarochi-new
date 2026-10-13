import { NextResponse } from "next/server";
import { adminCookieName, adminCookieOptions, revokeCurrentAdminSession } from "@/features/admin/auth/server/service";
import { adminMutationOriginAllowed } from "@/features/admin/auth/server/origin";

export async function POST(request: Request) {
  if (!adminMutationOriginAllowed(request)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    await revokeCurrentAdminSession();
    const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    response.cookies.set(adminCookieName, "", { ...adminCookieOptions(), maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
