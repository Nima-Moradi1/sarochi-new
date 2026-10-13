"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminListPagination, useAdminListPage } from "./AdminListPagination";
import type { getAdminCatalogOverview } from "./server/service";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Props = { overview: Overview; editable: boolean };
const field = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";

export function AdminPageEditor({ overview, editable }: Props) {
  const router = useRouter();
  const list = useAdminListPage("pages", overview.pages);
  const [id, setId] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("DRAFT");
  const [message, setMessage] = useState("");
  const choose = (value: number | null) => { const row = list.items.find((item) => item.id === value); setId(value); setSlug(row?.slug ?? ""); setTitle(row?.title ?? ""); setBody(row?.body ?? ""); setVisibility(row?.visibility ?? "DRAFT"); setMessage(""); };
  const send = async (method: "POST" | "PATCH" | "DELETE", data?: unknown) => {
    const response = await fetch(id ? `/api/v1/admin/pages/${id}` : "/api/v1/admin/pages", { method, headers: data === undefined ? undefined : { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), cache: "no-store" });
    if (!response.ok) { const result = await response.json().catch(() => ({})) as { error?: string }; throw new Error(result.error ?? "SAVE_FAILED"); }
  };
  const save = async (event: FormEvent) => { event.preventDefault(); try { await send(id ? "PATCH" : "POST", { slug, locale: "fa-IR", title, body, visibility }); setMessage("صفحه ذخیره شد."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره نشد"); } };
  const remove = async () => { if (!id || !window.confirm("این صفحه حذف شود؟")) return; try { await send("DELETE"); choose(null); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "حذف نشد"); } };
  return <section aria-labelledby="admin-pages-title"><h2 id="admin-pages-title" className="text-2xl font-medium">صفحه‌های اطلاع‌رسانی</h2><p className="mt-3 text-sm leading-7 text-muted">متن سیاست‌ها، راهنما و اطلاعات تماس را فقط پس از تأیید محتوای واقعی منتشر کنید. متن به‌صورت ساده نمایش داده می‌شود.</p><div className="mt-7 grid gap-6 lg:grid-cols-[260px_1fr]"><div className="space-y-2 rounded-2xl bg-rack p-3">{list.items.map((page) => <button key={page.id} type="button" onClick={() => choose(page.id)} aria-pressed={id === page.id} className="block min-h-10 w-full rounded-xl px-3 text-right text-sm aria-pressed:bg-canvas">{page.title} <span className="text-xs text-muted">{page.visibility}</span></button>)}{editable && <button type="button" onClick={() => choose(null)} className="mt-3 text-xs underline">صفحه تازه</button>}<AdminListPagination {...list} label="صفحه‌های اطلاع‌رسانی" /></div><form onSubmit={save} className="space-y-4 rounded-2xl border border-ink/15 p-5"><label className="block text-sm">نشانی صفحه<input required pattern="[a-z0-9-]+" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={!editable} dir="ltr" className={field} /></label><label className="block text-sm">عنوان<input required maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} disabled={!editable} className={field} /></label><label className="block text-sm">متن<textarea required rows={12} value={body} onChange={(event) => setBody(event.target.value)} disabled={!editable} className="mt-2 w-full rounded-xl border border-ink/20 bg-canvas p-3 text-sm leading-7" /></label><label className="block text-sm">وضعیت<select value={visibility} onChange={(event) => setVisibility(event.target.value)} disabled={!editable} className={field}><option value="DRAFT">پیش‌نویس</option><option value="PUBLISHED">منتشر</option></select></label><div className="flex flex-wrap items-center gap-3">{editable && <><button type="submit" className="min-h-11 rounded-full bg-ink px-6 text-sm text-canvas">ذخیره صفحه</button>{id && <button type="button" onClick={remove} className="min-h-11 rounded-full border border-ink/25 px-5 text-sm">حذف</button>}</>}{visibility === "PUBLISHED" && slug && <Link href={`/pages/${encodeURIComponent(slug)}`} className="text-sm underline">مشاهده صفحه</Link>}</div><p role="status" className="text-xs text-muted">{message}</p></form></div></section>;
}
