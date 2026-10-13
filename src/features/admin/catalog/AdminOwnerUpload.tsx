"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { getAdminCatalogOverview } from "./server/service";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
const field = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";

export function AdminOwnerUpload({ overview }: { overview: Overview }) {
  const router = useRouter();
  const [productId, setProductId] = useState(overview.products[0]?.id ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [viewAngle, setViewAngle] = useState("UNKNOWN");
  const [verified, setVerified] = useState(false);
  const [variantId, setVariantId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!productId || !file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("viewAngle", viewAngle);
    form.set("confidence", verified ? "VERIFIED" : "UNVERIFIED");
    form.set("variantId", variantId);
    form.set("sortOrder", "0");
    form.set("isPrimary", String(isPrimary));
    form.set("rightsConfirmed", String(rightsConfirmed));
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/v1/admin/products/${productId}/media/upload`, { method: "POST", body: form, cache: "no-store" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "UPLOAD_FAILED");
      setFile(null); setVerified(false); setViewAngle("UNKNOWN");
      setRightsConfirmed(false); setIsPrimary(false);
      if (fileInput.current) fileInput.current.value = "";
      setMessage("تصویر بارگذاری و به محصول پیوند داده شد.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "بارگذاری انجام نشد"); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="owner-upload-title" className="mt-8 rounded-2xl border border-ink/15 p-5">
    <h3 id="owner-upload-title" className="text-xl font-medium">بارگذاری تصویر اصلی مالک</h3>
    <p className="mt-2 text-sm leading-7 text-muted">فقط عکس واقعی محصول را بارگذاری کنید. فایل JPEG، PNG یا WebP تا ۵ مگابایت پذیرفته می‌شود. برچسب زاویه را تنها پس از بررسی عکس تأیید کنید.</p>
    <form onSubmit={upload} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm">محصول<select value={productId} onChange={(event) => { setProductId(Number(event.target.value)); setVariantId(""); }} className={field}>{overview.products.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label>
      <label className="text-sm">فایل تصویر<input ref={fileInput} required type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className={field} /></label>
      <label className="text-sm">زاویه<select value={viewAngle} onChange={(event) => { setViewAngle(event.target.value); setVerified(false); }} className={field}><option value="UNKNOWN">نامشخص</option><option value="FRONT">جلو</option><option value="BACK">پشت</option><option value="DETAIL">جزئیات</option></select></label>
      <label className="text-sm">تنوع<select value={variantId} onChange={(event) => setVariantId(event.target.value)} className={field}><option value="">همه تنوع‌ها</option>{overview.variants.filter((item) => item.productId === productId).map((item) => <option key={item.id} value={item.id}>{item.sku ?? `#${item.id}`}</option>)}</select></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verified} disabled={viewAngle === "UNKNOWN"} onChange={(event) => setVerified(event.target.checked)} /> عکس واقعی و زاویه آن را بررسی کرده‌ام</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} /> تصویر اصلی محصول</label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input required type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} /> حق انتشار این تصویر را دارم</label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2"><button type="submit" disabled={busy || !productId || !file || !rightsConfirmed} className="min-h-11 rounded-full bg-ink px-6 text-sm text-canvas disabled:opacity-50">{busy ? "در حال بارگذاری…" : "بارگذاری و پیوند تصویر"}</button><p role="status" className="text-sm text-muted">{message}</p></div>
    </form>
  </section>;
}
