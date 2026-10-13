import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/features/admin/auth/server/service";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ email: admin.email, role: admin.role }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
