"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { getImportReviewDashboard } from "./server/review";

type Dashboard = Awaited<ReturnType<typeof getImportReviewDashboard>>;
type Props = { dashboard: Dashboard; editable: boolean; owner: boolean };

export function AdminImportReview({ dashboard, editable, owner }: Props) {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState<number | null>(dashboard.candidates[0]?.id ?? null);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [garmentClass, setGarmentClass] = useState("OTHER");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const candidate = dashboard.candidates.find((item) => item.id === candidateId);
  const choose = (id: number) => { setCandidateId(id); setCategoryIds([]); setGarmentClass("OTHER"); setNote(""); setMessage(""); };
  const submit = async (decision: "APPROVE" | "REJECT") => {
    if (!candidateId) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/v1/admin/imports/${candidateId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, categoryIds, garmentClass, note }), cache: "no-store" });
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; throw new Error(data.error ?? "REVIEW_FAILED"); }
      setMessage(decision === "APPROVE" ? "نامزد تأیید شد؛ هنوز در فروشگاه منتشر نشده است." : "نامزد رد شد."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "بررسی انجام نشد"); }
    finally { setBusy(false); }
  };
  const commit = async () => {
    if (!candidateId || !window.confirm("این نامزد تأییدشده به‌صورت پیش‌نویس در کاتالوگ ثبت شود؟")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/v1/admin/imports/${candidateId}/commit`, { method: "POST", cache: "no-store" });
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; throw new Error(data.error ?? "COMMIT_FAILED"); }
      setMessage("محصول به‌صورت پیش‌نویس ثبت شد. برای انتشار، تصاویر و داده‌ها را در مدیریت محصول بررسی کنید."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "ثبت انجام نشد"); }
    finally { setBusy(false); }
  };
  const onForm = (event: FormEvent) => event.preventDefault();
  return <div className="mt-9"><section aria-labelledby="import-jobs-title"><h2 id="import-jobs-title" className="text-2xl font-medium">کارهای ورود داده</h2>{dashboard.jobs.length === 0 ? <p className="mt-4 rounded-2xl bg-rack p-6 text-sm text-muted">هنوز هیچ نامزدی در MySQL مرحله‌بندی نشده است. دستور مرحله‌بندی را در محیط مجاز اجرا کنید.</p> : <div className="mt-4 space-y-2">{dashboard.jobs.map((job) => <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rack px-5 py-3 text-sm"><span>کار #{job.id} · {job.sourceKind} · {job.state}</span><span className="text-xs text-muted">{job.startedAt.toLocaleString("fa-IR")}</span><a href={`/api/v1/admin/imports/${job.id}/report`} target="_blank" rel="noreferrer" className="min-h-10 py-2 text-xs underline">گزارش پوشش و تطبیق</a></div>)}</div>}</section><section aria-labelledby="import-candidates-title" className="mt-12"><h2 id="import-candidates-title" className="text-2xl font-medium">نامزدهای بررسی</h2><div className="mt-5 grid gap-6 lg:grid-cols-[320px_1fr]"><div className="max-h-[700px] space-y-2 overflow-y-auto rounded-2xl bg-rack p-3">{dashboard.candidates.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={candidateId === item.id} className="block min-h-12 w-full rounded-xl px-3 py-2 text-right text-sm aria-pressed:bg-canvas"><span className="block">{item.nameFa}</span><span className="text-xs text-muted">#{item.id} · {item.reviewStatus}</span></button>)}<nav aria-label="صفحه‌های نامزدها" className="flex items-center justify-between pt-3 text-xs"><Link href={`/admin/import?page=${dashboard.page - 1}`} aria-disabled={dashboard.page === 1} tabIndex={dashboard.page === 1 ? -1 : undefined} className={dashboard.page === 1 ? "pointer-events-none opacity-30" : "underline"}>قبلی</Link><span>{dashboard.page.toLocaleString("fa-IR")}</span><Link href={`/admin/import?page=${dashboard.page + 1}`} aria-disabled={!dashboard.hasNext} tabIndex={!dashboard.hasNext ? -1 : undefined} className={!dashboard.hasNext ? "pointer-events-none opacity-30" : "underline"}>بعدی</Link></nav></div>{candidate ? <form onSubmit={onForm} className="space-y-5 rounded-2xl border border-ink/15 p-5"><div><h3 className="text-xl font-medium">{candidate.nameFa}</h3><a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-xs underline" dir="ltr">{candidate.sourceUrl}</a></div><p className="text-sm text-muted">تنوع: {candidate.variantCount.toLocaleString("fa-IR")} · تصویر: {candidate.mediaCount.toLocaleString("fa-IR")} · موجودی عددی: نامشخص · پشت تأییدشده: ندارد</p><p className="text-sm text-muted">دسته‌های منبع: {candidate.categoryKeys.join(" · ") || "ثبت نشده"}</p><div className="flex flex-wrap gap-2">{Array.isArray(candidate.issues) && candidate.issues.map((issue, index) => <span key={index} className="rounded-full bg-rack px-3 py-1 text-xs">{String(issue)}</span>)}</div><p className="text-xs leading-6 text-muted">تأیید نامزد، تصویر پشت یا موجودی را تأیید نمی‌کند. ثبت اولیه محصول به‌صورت پیش‌نویس است.</p>{["PENDING_REVIEW", "CONFLICT"].includes(candidate.reviewStatus) && editable && <><fieldset><legend className="mb-3 text-sm font-medium">دسته‌بندی واقعی محصول</legend><div className="flex flex-wrap gap-2">{dashboard.categories.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-full border border-ink/20 px-3 py-2 text-xs"><input type="checkbox" checked={categoryIds.includes(item.id)} onChange={(event) => setCategoryIds(event.target.checked ? [...categoryIds, item.id] : categoryIds.filter((value) => value !== item.id))} />{item.nameFa}</label>)}</div></fieldset><label className="block text-sm">نوع پوشاک<select value={garmentClass} onChange={(event) => setGarmentClass(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm">{["TSHIRT", "SHIRT", "KNIT", "JACKET", "PANTS", "OTHER"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="block text-sm">دلیل بررسی<textarea required minLength={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-ink/20 bg-canvas p-3 text-sm" /></label><div className="flex flex-wrap gap-3"><button type="button" disabled={busy || !note.trim() || categoryIds.length === 0 || (candidate.reviewStatus === "CONFLICT" && !owner)} onClick={() => submit("APPROVE")} className="min-h-11 rounded-full bg-ink px-5 text-sm text-canvas disabled:opacity-40">تأیید برای ثبت پیش‌نویس</button><button type="button" disabled={busy || !note.trim() || (candidate.reviewStatus === "CONFLICT" && !owner)} onClick={() => submit("REJECT")} className="min-h-11 rounded-full border border-ink/25 px-5 text-sm disabled:opacity-40">رد نامزد</button></div></>}{candidate.reviewStatus === "APPROVED" && owner && <button type="button" disabled={busy} onClick={commit} className="min-h-11 rounded-full bg-ink px-5 text-sm text-canvas disabled:opacity-40">ثبت در کاتالوگ به‌صورت پیش‌نویس</button>}{candidate.reviewStatus === "COMMITTED" && <p className="text-sm text-moss">در کاتالوگ ثبت شد · شناسه محصول {candidate.committedProductId}</p>}<p role="status" aria-live="polite" className="text-xs text-muted">{message}</p></form> : <p className="rounded-2xl border border-ink/15 p-8 text-sm text-muted">نامزدی برای بررسی در این صفحه وجود ندارد.</p>}</div></section></div>;
}
