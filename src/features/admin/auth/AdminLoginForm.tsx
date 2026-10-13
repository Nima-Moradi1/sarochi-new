"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), cache: "no-store" });
      if (response.ok) { setPassword(""); router.replace("/admin"); router.refresh(); return; }
      setMessage(response.status === 429 ? "تلاش‌های ورود زیاد بوده است. کمی بعد دوباره تلاش کنید." : response.status === 503 ? "ورود اکنون در دسترس نیست." : "اطلاعات ورود صحیح نیست.");
    } catch { setMessage("ارتباط برقرار نشد. دوباره تلاش کنید."); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="mt-10 space-y-5"><label className="block text-sm">ایمیل مدیر<input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-ink/20 bg-canvas px-4 text-left" dir="ltr" /></label><label className="block text-sm">رمز عبور<input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-ink/20 bg-canvas px-4 text-left" dir="ltr" /></label><button type="submit" disabled={busy} className="min-h-12 w-full rounded-full bg-ink px-6 text-sm text-canvas disabled:opacity-50">{busy ? "در حال بررسی…" : "ورود به مدیریت"}</button><p role="alert" aria-live="polite" className="min-h-6 text-sm text-muted">{message}</p></form>;
}
