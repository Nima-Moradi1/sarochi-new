"use client";

import { Component, useEffect, useState, type FormEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { readBrandSettingsRecord, stylingPresetsSchema, type StylingPreset } from "@/features/content/brand-settings";
import { stylingGarmentSchema, stylingMappingSchema, stylingMappingWriteSchema, type StylingMappingDTO } from "@/features/styling/mapping";
import { previewColor, visualClass, type VisualClass } from "@/features/styling/preview";
import type { getAdminCatalogOverview } from "./server/service";

const AvatarScene = dynamic(() => import("@/features/styling/AvatarScene"), { ssr: false, loading: () => <p role="status" className="p-6 text-sm text-muted">در حال آماده‌سازی پیش‌نمایش مفهومی…</p> });
const field = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";
const garmentLabels: Record<VisualClass, string> = { TSHIRT: "تی‌شرت", SHIRT: "پیراهن", KNIT: "بافت", JACKET: "کت و جکت", PANTS: "شلوار", OTHER: "شکل عمومی" };
type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Props = { overview: Pick<Overview, "products" | "variants" | "brands" | "colors">; editable: boolean };

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="status" className="p-6 text-sm text-muted">نمای سه‌بعدی در این دستگاه در دسترس نیست. تنظیمات نگاشت همچنان قابل ذخیره است.</p> : this.props.children; }
}

function MappingForm({ product, variant, mapping, presets, variantHex, editable, onSaved }: {
  product: Overview["products"][number]; variant: Overview["variants"][number]; mapping?: StylingMappingDTO;
  presets: StylingPreset[]; variantHex: string | null; editable: boolean; onSaved: (mapping: StylingMappingDTO | null) => void;
}) {
  const [garmentClass, setGarmentClass] = useState<VisualClass>(mapping?.garmentClass ?? visualClass(product.garmentClass));
  const [presetId, setPresetId] = useState(mapping?.presetId ?? presets[0]?.id ?? "");
  const [colorHex, setColorHex] = useState(mapping?.colorHex ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [turn, setTurn] = useState(0);
  const preset = presets.find((item) => item.id === presetId) ?? null;
  const endpoint = `/api/v1/admin/products/${product.id}/variants/${variant.id}/styling`;
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || !editable) return;
    const parsed = stylingMappingWriteSchema.safeParse({ garmentClass, presetId, colorHex: colorHex.trim() || null, fidelity: "CONCEPTUAL" });
    if (!parsed.success || !preset) { setMessage("نوع پوشاک، فرم ثبت‌شده و کد رنگ شش‌رقمی را بررسی کنید."); return; }
    setSaving(true); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), cache: "no-store" });
      if (!response.ok) throw new Error("SAVE_FAILED");
      const result = await response.json() as { mapping: unknown };
      onSaved(stylingMappingSchema.parse(result.mapping));
      setMessage("نگاشت مفهومی تنوع ذخیره شد.");
    } catch { setMessage("نگاشت ذخیره نشد. فرم و دسترسی را بررسی و دوباره تلاش کنید."); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (saving || !editable) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "DELETE", cache: "no-store" });
      if (!response.ok) throw new Error("DELETE_FAILED");
      onSaved(null); setMessage("نگاشت حذف شد؛ نمایش عمومی دسته محصول استفاده می‌شود.");
    } catch { setMessage("نگاشت حذف نشد. دوباره تلاش کنید."); }
    finally { setSaving(false); }
  };
  return <div className="mt-5">
    <p className="text-xs leading-6 text-muted">{mapping ? "این تنوع نگاشت مفهومی ذخیره‌شده دارد." : "نگاشت اختصاصی این تنوع هنوز ثبت نشده است."}</p>
    <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm">شکل مفهومی پوشاک<select value={garmentClass} onChange={(event) => setGarmentClass(stylingGarmentSchema.parse(event.target.value))} disabled={!editable || saving} className={field}>{stylingGarmentSchema.options.map((value) => <option key={value} value={value}>{garmentLabels[value]}</option>)}</select></label>
      <label className="text-sm">فرم نمایشی مدل<select required value={presetId} onChange={(event) => setPresetId(event.target.value)} disabled={!editable || saving || !presets.length} className={field}><option value="">انتخاب فرم ثبت‌شده</option>{mapping && !presets.some((item) => item.id === mapping.presetId) && <option value={mapping.presetId}>فرم حذف‌شده — فرم تازه انتخاب کنید</option>}{presets.map((item) => <option key={item.id} value={item.id}>{item.labelFa}</option>)}</select></label>
      <label className="text-sm">رنگ جایگزین مفهومی (اختیاری)<input value={colorHex} onChange={(event) => setColorHex(event.target.value)} maxLength={7} pattern="#[0-9a-fA-F]{6}" placeholder="#123456" dir="ltr" disabled={!editable || saving} className={field} /><span className="mt-2 block text-xs text-muted">خالی: کد رنگ ثبت‌شده تنوع؛ بدون کد: رنگ خنثی. این مقدار رنگ واقعی محصول را تغییر نمی‌دهد.</span></label>
      <p className="self-center text-xs leading-7 text-muted">دقت نگاشت: فقط مفهومی (CONCEPTUAL). شکل، پارچه، رنگ و فیت واقعی محصول تضمین نمی‌شود.</p>
      <div className="flex flex-wrap gap-3 sm:col-span-2">{editable && <><button type="submit" disabled={saving || !preset} className="min-h-11 rounded-full bg-ink px-5 text-sm text-canvas disabled:opacity-40">{saving ? "در حال ذخیره…" : "ذخیره نگاشت مفهومی"}</button>{mapping && <button type="button" disabled={saving} onClick={remove} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm disabled:opacity-40">حذف نگاشت</button>}</>}<button type="button" onClick={() => setPreview((value) => !value)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm">{preview ? "بستن پیش‌نمایش مفهومی" : "پیش‌نمایش مفهومی سه‌بعدی"}</button></div>
    </form>
    {!presets.length && <p role="status" className="mt-3 text-xs text-muted">ابتدا فرم‌های اتاق استایل را در تنظیمات برند ثبت کنید.</p>}
    <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">{message}</p>
    {preview && <div className="mt-5"><div role="region" aria-label="بازرس سه‌بعدی مفهومی نگاشت تنوع" className="h-96 overflow-hidden rounded-2xl bg-rack"><PreviewBoundary><AvatarScene preset={preset} turn={turn} still visible garmentClass={garmentClass} garmentColor={previewColor(colorHex || variantHex).hex} garmentScale={1} /></PreviewBoundary></div><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={() => setTurn(0)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm">جلوی مدل مفهومی</button><button type="button" onClick={() => setTurn(2)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm">پشت مدل مفهومی</button><p className="self-center text-xs text-muted">این بازسازی، تصویر پشت واقعی یا مدل دقیق محصول نیست.</p></div></div>}
  </div>;
}

export function AdminVariantStylingEditor({ overview, editable }: Props) {
  const [productId, setProductId] = useState(overview.products[0]?.id ?? 0);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<{ productId: number; mappings: StylingMappingDTO[]; error?: string } | null>(null);
  const product = overview.products.find((item) => item.id === productId) ?? overview.products[0];
  const activeProductId = product?.id ?? 0;
  const variants = overview.variants.filter((item) => item.productId === activeProductId);
  const variant = variants.find((item) => item.id === variantId) ?? variants[0];
  const brand = overview.brands.find((item) => item.code === "SAROCHI");
  const parsedPresets = stylingPresetsSchema.safeParse(readBrandSettingsRecord(brand?.settings).stylingPresets);
  const presets = parsedPresets.success ? parsedPresets.data : [];
  const ready = result?.productId === activeProductId;
  const mapping = ready ? result.mappings.find((item) => item.variantId === variant?.id) : undefined;
  useEffect(() => {
    if (!activeProductId) return;
    const controller = new AbortController();
    fetch(`/api/v1/admin/products/${activeProductId}/styling`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("LOAD_FAILED");
        const body = await response.json() as { mappings: unknown[] };
        return body.mappings.map((item) => stylingMappingSchema.parse(item));
      }).then((mappings) => { if (!controller.signal.aborted) setResult({ productId: activeProductId, mappings }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ productId: activeProductId, mappings: [], error: "نگاشت‌ها بارگذاری نشدند. دوباره تلاش کنید." }); });
    return () => controller.abort();
  }, [activeProductId, revision]);
  return <section aria-labelledby="variant-styling-title" className="mt-8 rounded-2xl border border-ink/15 p-5">
    <h3 id="variant-styling-title" className="text-xl font-medium">نگاشت سه‌بعدی تنوع محصول</h3>
    <p className="mt-2 text-sm leading-7 text-muted">هر تنوع را به یک شکل پوشاک و فرم نمایشی ثبت‌شده متصل کنید. همه نگاشت‌ها مفهومی‌اند؛ تصویر و موجودی محصول تغییری نمی‌کند.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">محصول نگاشت<select value={activeProductId} onChange={(event) => { setProductId(Number(event.target.value)); setVariantId(null); setNotice(""); }} className={field}>{overview.products.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label><label className="text-sm">تنوع نگاشت<select value={variant?.id ?? ""} onChange={(event) => { setVariantId(Number(event.target.value)); setNotice(""); }} disabled={!variants.length} className={field}>{variants.length ? variants.map((item) => <option key={item.id} value={item.id}>{item.sku ?? `تنوع ${item.id.toLocaleString("fa-IR")}`}</option>) : <option value="">تنوعی ثبت نشده است</option>}</select></label></div>
    {!product || !variant ? <p className="mt-5 text-sm text-muted">ابتدا محصول و تنوع آن را ثبت کنید.</p> : !ready ? <p role="status" className="mt-5 text-sm text-muted">در حال بارگذاری نگاشت‌ها…</p> : result.error ? <div role="alert" className="mt-5 text-sm text-muted">{result.error}<button type="button" onClick={() => setRevision((value) => value + 1)} className="mr-3 min-h-11 underline">تلاش دوباره</button></div> : <MappingForm key={`${product.id}:${variant.id}:${mapping ? JSON.stringify(mapping) : "new"}`} product={product} variant={variant} mapping={mapping} presets={presets} variantHex={overview.colors.find((item) => item.id === variant.colorId)?.hex ?? null} editable={editable} onSaved={(saved) => {
      setResult((current) => ({ productId: activeProductId, mappings: [...(current?.productId === activeProductId ? current.mappings.filter((item) => item.variantId !== variant.id) : []), ...(saved ? [saved] : [])] }));
      setNotice(saved ? "نگاشت مفهومی تنوع ذخیره شد." : "نگاشت حذف شد؛ نمایش عمومی دسته محصول استفاده می‌شود.");
    }} />}
    <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">{notice}</p>
  </section>;
}
