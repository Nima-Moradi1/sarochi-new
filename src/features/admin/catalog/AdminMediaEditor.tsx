"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { getAdminCatalogOverview } from "./server/service";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Props = { overview: Overview; editable: boolean };
const field = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";

export function AdminMediaEditor({ overview, editable }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(overview.products[0]?.id ?? 0);
  const [mediaId, setMediaId] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [viewAngle, setViewAngle] = useState("UNKNOWN");
  const [confidence, setConfidence] = useState("UNVERIFIED");
  const [variantId, setVariantId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPrimary, setIsPrimary] = useState(false);
  const [message, setMessage] = useState("");
  const rows = overview.media.filter((item) => item.productId === productId);
  const ownerImage = url.startsWith("/api/v1/media/");
  const variants = overview.variants.filter((item) => item.productId === productId);
  const choose = (id: number | null) => {
    const row = rows.find((item) => item.id === id);
    setMediaId(id); setUrl(row?.url ?? ""); setSourceUrl(row?.sourceUrl ?? ""); setViewAngle(row?.viewAngle ?? "UNKNOWN"); setConfidence(row?.confidence ?? "UNVERIFIED"); setVariantId(row?.variantId ? String(row.variantId) : ""); setSortOrder(row?.sortOrder ?? 0); setIsPrimary(row?.isPrimary ?? false); setMessage("");
  };
  const send = async (method: "POST" | "PATCH" | "DELETE", data?: unknown) => {
    const path = `/api/v1/admin/products/${productId}/media${mediaId ? `/${mediaId}` : ""}`;
    const response = await fetch(path, { method, headers: data === undefined ? undefined : { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), cache: "no-store" });
    if (!response.ok) { const result = await response.json().catch(() => ({})) as { error?: string }; throw new Error(result.error ?? "SAVE_FAILED"); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!productId) return;
    try { await send(mediaId ? "PATCH" : "POST", { url, sourceUrl: sourceUrl || null, viewAngle, confidence, variantId: variantId ? Number(variantId) : null, sortOrder, isPrimary }); setMessage("تصویر و منشأ آن ثبت شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره انجام نشد"); }
  };
  const remove = async () => {
    if (!mediaId || !window.confirm("این پیوند تصویر از محصول برداشته شود؟")) return;
    try { await send("DELETE"); choose(null); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "حذف انجام نشد"); }
  };
  return <section aria-labelledby="admin-media-title"><h2 id="admin-media-title" className="text-2xl font-medium">تصاویر و منشأ</h2><p className="mt-3 text-sm leading-7 text-muted">فقط نشانی تصویر واقعی ساروچی را همراه صفحه منبع ثبت کنید. زاویه پشت را پس از بررسی عکس واقعی تأیید کنید.</p><label className="mt-6 block max-w-xl text-sm">محصول<select value={productId} onChange={(event) => { setProductId(Number(event.target.value)); choose(null); }} className={field}>{overview.products.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label>{!productId ? <p className="mt-6 text-muted">ابتدا یک محصول ثبت کنید.</p> : <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]"><div className="space-y-2 rounded-2xl bg-rack p-3">{rows.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={mediaId === item.id} className="block min-h-10 w-full rounded-xl px-3 text-right text-sm aria-pressed:bg-canvas">#{item.id} · {item.viewAngle} · {item.confidence}</button>)}{editable && <button type="button" onClick={() => choose(null)} className="mt-3 text-xs underline">تصویر تازه</button>}</div><form onSubmit={save} className="grid gap-4 rounded-2xl border border-ink/15 p-5 sm:grid-cols-2"><label className="text-sm sm:col-span-2">نشانی تصویر<input required type={ownerImage ? "text" : "url"} readOnly={ownerImage} value={url} onChange={(event) => setUrl(event.target.value)} disabled={!editable} dir="ltr" className={field} /></label><label className="text-sm sm:col-span-2">صفحه منبع<input required={!ownerImage} readOnly={ownerImage} type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} disabled={!editable} dir="ltr" className={field} /></label><label className="text-sm">زاویه<select value={viewAngle} onChange={(event) => setViewAngle(event.target.value)} disabled={!editable} className={field}><option value="UNKNOWN">نامشخص</option><option value="FRONT">جلو</option><option value="BACK">پشت</option><option value="DETAIL">جزئیات</option></select></label><label className="text-sm">بررسی زاویه<select value={confidence} onChange={(event) => setConfidence(event.target.value)} disabled={!editable} className={field}><option value="UNVERIFIED">تأیید نشده</option><option value="VERIFIED">عکس واقعی بررسی و تأیید شد</option></select></label><label className="text-sm">تنوع مربوط<select value={variantId} onChange={(event) => setVariantId(event.target.value)} disabled={!editable} className={field}><option value="">همه تنوع‌ها</option>{variants.map((item) => <option key={item.id} value={item.id}>{item.sku ?? `#${item.id}`}</option>)}</select></label><label className="text-sm">ترتیب<input type="number" min="0" max="10000" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} disabled={!editable} className={field} /></label><label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} disabled={!editable} />تصویر اصلی محصول</label><div className="flex flex-wrap items-center gap-3 sm:col-span-2">{editable && <><button type="submit" className="min-h-11 rounded-full bg-ink px-6 text-sm text-canvas">ذخیره تصویر</button>{mediaId && <button type="button" onClick={remove} className="min-h-11 rounded-full border border-ink/25 px-5 text-sm">برداشتن تصویر</button>}</>}<p role="status" className="text-xs text-muted">{message}</p></div></form></div>}</section>;
}
