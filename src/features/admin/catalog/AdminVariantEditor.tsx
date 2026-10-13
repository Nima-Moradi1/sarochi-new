"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminListPagination, useAdminListPage } from "./AdminListPagination";
import type { getAdminCatalogOverview } from "./server/service";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Props = { overview: Overview; editable: boolean };

async function send(url: string, method: "POST" | "PATCH" | "DELETE", data?: unknown) {
  const response = await fetch(url, { method, headers: data === undefined ? undefined : { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), cache: "no-store" });
  if (!response.ok) { const result = await response.json().catch(() => ({})) as { error?: string }; throw new Error(result.error ?? "SAVE_FAILED"); }
}

const fieldClass = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";

function Attributes({ overview, editable }: Props) {
  const router = useRouter();
  const colorList = useAdminListPage("colors", overview.colors);
  const sizeList = useAdminListPage("sizes", overview.sizes);
  const [colorId, setColorId] = useState<number | null>(null);
  const [colorSlug, setColorSlug] = useState("");
  const [colorName, setColorName] = useState("");
  const [hex, setHex] = useState("");
  const [sizeId, setSizeId] = useState<number | null>(null);
  const [sizeLabel, setSizeLabel] = useState("");
  const [sizeOrder, setSizeOrder] = useState(0);
  const [message, setMessage] = useState("");
  const saveColor = async (event: FormEvent) => {
    event.preventDefault();
    try { await send(colorId ? `/api/v1/admin/colors/${colorId}` : "/api/v1/admin/colors", colorId ? "PATCH" : "POST", { slug: colorSlug, nameFa: colorName, hex: hex || null }); setMessage("رنگ ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره نشد"); }
  };
  const saveSize = async (event: FormEvent) => {
    event.preventDefault();
    try { await send(sizeId ? `/api/v1/admin/sizes/${sizeId}` : "/api/v1/admin/sizes", sizeId ? "PATCH" : "POST", { label: sizeLabel, sortOrder: sizeOrder }); setMessage("سایز ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره نشد"); }
  };
  return <section aria-labelledby="attributes-title" className="mt-10 border-t border-ink/15 pt-8"><h2 id="attributes-title" className="text-2xl font-medium">رنگ و سایز</h2><div className="mt-6 grid gap-6 md:grid-cols-2"><div className="rounded-2xl border border-ink/15 p-5"><h3 className="mb-4 font-medium">رنگ‌ها</h3><div className="mb-5 flex flex-wrap gap-2">{colorList.items.map((item) => <button key={item.id} type="button" onClick={() => { setColorId(item.id); setColorSlug(item.slug); setColorName(item.nameFa); setHex(item.hex ?? ""); }} className="min-h-10 rounded-full border border-ink/20 px-3 text-xs">{item.nameFa}</button>)}</div><AdminListPagination {...colorList} label="صفحه‌های رنگ‌ها" /><form onSubmit={saveColor} className="space-y-3"><label className="block text-xs">شناسه رنگ<input required value={colorSlug} onChange={(event) => setColorSlug(event.target.value)} disabled={!editable} dir="ltr" className={fieldClass} /></label><label className="block text-xs">نام رنگ<input required value={colorName} onChange={(event) => setColorName(event.target.value)} disabled={!editable} className={fieldClass} /></label><label className="block text-xs">کد رنگ تأییدشده (اختیاری)<input value={hex} onChange={(event) => setHex(event.target.value)} placeholder="#123456" disabled={!editable} dir="ltr" className={fieldClass} /></label>{editable && <div className="flex gap-3"><button type="submit" className="min-h-11 rounded-full bg-ink px-5 text-xs text-canvas">ذخیره رنگ</button><button type="button" onClick={() => { setColorId(null); setColorSlug(""); setColorName(""); setHex(""); }} className="text-xs underline">تازه</button></div>}</form></div><div className="rounded-2xl border border-ink/15 p-5"><h3 className="mb-4 font-medium">سایزها</h3><div className="mb-5 flex flex-wrap gap-2">{sizeList.items.map((item) => <button key={item.id} type="button" onClick={() => { setSizeId(item.id); setSizeLabel(item.label); setSizeOrder(item.sortOrder); }} className="min-h-10 rounded-full border border-ink/20 px-3 text-xs" dir="ltr">{item.label}</button>)}</div><AdminListPagination {...sizeList} label="صفحه‌های سایزها" /><form onSubmit={saveSize} className="space-y-3"><label className="block text-xs">عنوان سایز<input required value={sizeLabel} onChange={(event) => setSizeLabel(event.target.value)} disabled={!editable} dir="ltr" className={fieldClass} /></label><label className="block text-xs">ترتیب<input type="number" min="0" value={sizeOrder} onChange={(event) => setSizeOrder(Number(event.target.value))} disabled={!editable} className={fieldClass} /></label>{editable && <div className="flex gap-3"><button type="submit" className="min-h-11 rounded-full bg-ink px-5 text-xs text-canvas">ذخیره سایز</button><button type="button" onClick={() => { setSizeId(null); setSizeLabel(""); setSizeOrder(0); }} className="text-xs underline">تازه</button></div>}</form></div></div><p role="status" className="mt-4 text-xs text-muted">{message}</p></section>;
}

export function AdminVariantEditor({ overview, editable }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(overview.products[0]?.id ?? 0);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [sku, setSku] = useState("");
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [message, setMessage] = useState("");
  const variants = overview.variants.filter((item) => item.productId === productId);
  const choose = (id: number | null) => {
    const row = variants.find((item) => item.id === id);
    setVariantId(id); setSku(row?.sku ?? ""); setColorId(row?.colorId ? String(row.colorId) : ""); setSizeId(row?.sizeId ? String(row.sizeId) : ""); setRegularPrice(row?.regularPriceToman === null || row?.regularPriceToman === undefined ? "" : String(row.regularPriceToman)); setSalePrice(row?.salePriceToman === null || row?.salePriceToman === undefined ? "" : String(row.salePriceToman)); setStockQty(row?.stockQty === null || row?.stockQty === undefined ? "" : String(row.stockQty)); setMessage("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!productId) return;
    const data = { sku: sku || null, colorId: colorId ? Number(colorId) : null, sizeId: sizeId ? Number(sizeId) : null, regularPriceToman: regularPrice ? Number(regularPrice) : null, salePriceToman: salePrice ? Number(salePrice) : null, stockQty: stockQty ? Number(stockQty) : null };
    try { await send(variantId ? `/api/v1/admin/products/${productId}/variants/${variantId}` : `/api/v1/admin/products/${productId}/variants`, variantId ? "PATCH" : "POST", data); setMessage("تنوع ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره نشد"); }
  };
  const remove = async () => {
    if (!variantId || !window.confirm("این تنوع محصول حذف شود؟")) return;
    try { await send(`/api/v1/admin/products/${productId}/variants/${variantId}`, "DELETE"); choose(null); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "حذف نشد"); }
  };
  return <div><section aria-labelledby="variants-title"><h2 id="variants-title" className="text-2xl font-medium">تنوع محصول</h2><label className="mt-5 block max-w-lg text-sm">محصول<select value={productId} onChange={(event) => { setProductId(Number(event.target.value)); choose(null); }} className={fieldClass}>{overview.products.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label>{!productId ? <p className="mt-5 text-sm text-muted">ابتدا یک محصول ثبت کنید.</p> : <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]"><div className="rounded-2xl bg-rack p-3">{variants.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={variantId === item.id} className="block min-h-10 w-full rounded-xl px-3 text-right text-sm aria-pressed:bg-canvas"><bdi dir="ltr">{item.sku ?? `#${item.id}`}</bdi></button>)}{editable && <button type="button" onClick={() => choose(null)} className="mt-3 text-xs underline">تنوع تازه</button>}</div><form onSubmit={save} className="grid gap-4 rounded-2xl border border-ink/15 p-5 sm:grid-cols-2"><label className="text-sm">شناسه SKU<input value={sku} onChange={(event) => setSku(event.target.value)} disabled={!editable} dir="ltr" className={fieldClass} /></label><label className="text-sm">رنگ<select value={colorId} onChange={(event) => setColorId(event.target.value)} disabled={!editable} className={fieldClass}><option value="">ثبت نشده</option>{overview.colors.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label><label className="text-sm">سایز<select value={sizeId} onChange={(event) => setSizeId(event.target.value)} disabled={!editable} className={fieldClass}><option value="">ثبت نشده</option>{overview.sizes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="text-sm">قیمت اصلی (تومان)<input type="number" min="0" value={regularPrice} onChange={(event) => setRegularPrice(event.target.value)} disabled={!editable} className={fieldClass} /></label><label className="text-sm">قیمت فروش (تومان)<input type="number" min="0" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} disabled={!editable} className={fieldClass} /></label><label className="text-sm">موجودی تأییدشده<input type="number" min="0" value={stockQty} onChange={(event) => setStockQty(event.target.value)} disabled={!editable} className={fieldClass} /><span className="mt-1 block text-xs text-muted">خالی یعنی نامشخص؛ صفر یعنی ناموجود.</span></label><div className="flex flex-wrap items-center gap-3 sm:col-span-2">{editable && <><button type="submit" className="min-h-11 rounded-full bg-ink px-6 text-sm text-canvas">ذخیره تنوع</button>{variantId && <button type="button" onClick={remove} className="min-h-11 rounded-full border border-ink/25 px-5 text-sm">حذف تنوع</button>}</>}<p role="status" className="text-xs text-muted">{message}</p></div></form></div>}</section><Attributes overview={overview} editable={editable} /></div>;
}
