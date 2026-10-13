"use client";

import { useEffect, useState } from "react";
import type { AuditPageDTO } from "./schemas";

export function AdminAuditViewer() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [data, setData] = useState<AuditPageDTO>({ items: [], page: 1, hasNext: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => { setFilter(query.trim()); setRequestedPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams({ page: String(requestedPage), q: filter });
        const response = await fetch(`/api/v1/admin/audit?${params}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("دریافت سوابق انجام نشد. دسترسی و اتصال را بررسی کنید.");
        const next = await response.json() as AuditPageDTO;
        if (!controller.signal.aborted) setData(next);
      } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "دریافت سوابق انجام نشد."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [filter, requestedPage, retry]);
  return <section aria-labelledby="audit-title">
    <h2 id="audit-title" className="text-2xl font-medium">سوابق تغییرات مدیریت</h2>
    <p className="mt-3 text-sm leading-7 text-muted">ثبت تغییرات برای صاحب فروشگاه؛ سوابق قابل ویرایش یا حذف نیستند.</p>
    <label className="my-6 block max-w-xl text-sm">جستجو با عملیات، نوع رکورد، شناسه یا حساب مدیر<input type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm" /></label>
    <div aria-busy={loading} className="overflow-x-auto rounded-2xl border border-ink/15">
      <table className="w-full min-w-[680px] text-right text-sm"><caption className="sr-only">رویدادهای حسابرسی مدیریت</caption><thead className="bg-rack"><tr>{["زمان", "حساب مدیر", "عملیات", "نوع رکورد", "شناسه"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{data.items.map((event) => <tr key={event.id} className="border-t border-ink/10"><td className="whitespace-nowrap px-4 py-3"><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</time></td><td className="px-4 py-3"><bdi dir="ltr">{event.actorEmail ?? "حساب ناموجود"}</bdi></td><td className="px-4 py-3"><bdi dir="ltr">{event.action}</bdi></td><td className="px-4 py-3"><bdi dir="ltr">{event.entityType}</bdi></td><td className="px-4 py-3"><bdi dir="ltr">{event.entityId ?? "—"}</bdi></td></tr>)}</tbody></table>
    </div>
    {loading ? <p role="status" className="mt-4 text-sm text-muted">در حال دریافت سوابق…</p> : !error && data.items.length === 0 ? <p role="status" className="mt-4 text-sm text-muted">رویدادی با این جستجو پیدا نشد.</p> : null}
    {error && <p role="status" className="mt-4 text-sm text-muted">{error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="min-h-11 px-3 underline">تلاش دوباره</button></p>}
    <nav aria-label="صفحه‌های سوابق مدیریت" className="mt-5 flex items-center justify-between gap-3 text-sm"><button type="button" disabled={loading || data.page === 1} onClick={() => setRequestedPage(data.page - 1)} className="min-h-11 rounded-full border border-ink/20 px-5 disabled:opacity-30">قبلی</button><span>{data.page.toLocaleString("fa-IR")}</span><button type="button" disabled={loading || !data.hasNext || data.page >= 10000} onClick={() => setRequestedPage(data.page + 1)} className="min-h-11 rounded-full border border-ink/20 px-5 disabled:opacity-30">بعدی</button></nav>
  </section>;
}
