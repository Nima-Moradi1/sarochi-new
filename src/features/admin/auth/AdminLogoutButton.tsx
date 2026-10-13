"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <><button type="button" disabled={busy} onClick={async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/admin/logout", { method: "POST", cache: "no-store" });
      if (!response.ok) throw new Error("LOGOUT_FAILED");
      router.replace("/admin/login"); router.refresh();
    } catch { setError("خروج انجام نشد. دوباره تلاش کنید."); setBusy(false); }
  }} className="min-h-11 rounded-full border border-ink/25 px-5 text-sm disabled:opacity-50">خروج</button><span role="alert" className="text-xs text-muted">{error}</span></>;
}
