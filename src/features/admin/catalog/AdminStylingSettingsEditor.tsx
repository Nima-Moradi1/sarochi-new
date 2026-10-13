"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { brandSettingsSchema, stylingPresetsSchema, readBrandSettingsRecord, type StylingPreset } from "@/features/content/brand-settings";
import type { getAdminCatalogOverview } from "./server/service";

type Props = { overview: Awaited<ReturnType<typeof getAdminCatalogOverview>>; editable: boolean };
const field = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";

export function AdminStylingSettingsEditor({ overview, editable }: Props) {
  const router = useRouter();
  const brand = overview.brands.find((item) => item.code === "SAROCHI");
  const brandSettings = readBrandSettingsRecord(brand?.settings);
  const initial = stylingPresetsSchema.safeParse(brandSettings.stylingPresets);
  const [presets, setPresets] = useState<StylingPreset[]>(initial.success ? initial.data : []);
  const [theme, setTheme] = useState(brandSettings.theme === "CHALK" ? "CHALK" : "PORCELAIN");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  if (!brand) return null;

  const update = (index: number, value: Partial<StylingPreset>) => setPresets((current) => current.map((item, position) => position === index ? { ...item, ...value } : item));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const settings = brandSettingsSchema.safeParse({ ...brandSettings, stylingPresets: presets, theme });
    if (!settings.success) { setMessage("معرفی برند را کامل کنید و شناسه یکتا و محدوده عددی فرم‌ها را بررسی کنید."); return; }
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/v1/admin/brands/${brand.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: brand.code, nameFa: brand.nameFa, nameEn: brand.nameEn, settings: settings.data }), cache: "no-store" });
      if (!response.ok) throw new Error("SAVE_FAILED");
      setMessage("تنظیمات اتاق استایل و ظاهر ذخیره شد."); router.refresh();
    } catch { setMessage("ذخیره تنظیمات انجام نشد. دوباره تلاش کنید."); }
    finally { setSaving(false); }
  };

  return <section aria-labelledby="styling-settings-title" className="mt-8 rounded-2xl border border-ink/15 p-5">
    <h3 id="styling-settings-title" className="text-xl font-medium">فرم‌های اتاق استایل و ظاهر</h3>
    <p className="mt-2 text-sm leading-7 text-muted">فرم‌ها نمایشی‌اند و اندازه بدن یا فیت واقعی را پیش‌بینی نمی‌کنند. حداکثر هشت فرم قابل تنظیم است؛ فهرست خالی حالت تنظیم‌نشده را نشان می‌دهد.</p>
    <form onSubmit={save} className="mt-6 space-y-5">
      <label className="block max-w-sm text-sm">رنگ زمینه<select value={theme} onChange={(event) => setTheme(event.target.value)} disabled={!editable || saving} className={field}><option value="PORCELAIN">چینی روشن</option><option value="CHALK">گچ آتلیه</option></select></label>
      {presets.map((preset, index) => <fieldset key={index} className="grid gap-4 rounded-2xl bg-rack p-4 sm:grid-cols-2">
        <legend className="px-2 text-sm">فرم {(index + 1).toLocaleString("fa-IR")}</legend>
        <label className="text-sm">شناسه یکتا<input required pattern="[a-z0-9-]+" maxLength={40} value={preset.id} onChange={(event) => update(index, { id: event.target.value })} disabled={!editable || saving} dir="ltr" className={field} /></label>
        <label className="text-sm">عنوان فارسی<input required minLength={2} maxLength={80} value={preset.labelFa} onChange={(event) => update(index, { labelFa: event.target.value })} disabled={!editable || saving} className={field} /></label>
        <label className="text-sm">فاصله نمایشی شانه (۰٫۳۸ تا ۰٫۶۵)<input required type="number" min={0.38} max={0.65} step={0.01} value={Number.isNaN(preset.shoulder) ? "" : preset.shoulder} onChange={(event) => update(index, { shoulder: event.target.valueAsNumber })} disabled={!editable || saving} dir="ltr" className={field} /></label>
        <label className="text-sm">نسبت نمایشی تنه (۰٫۸۵ تا ۱٫۲)<input required type="number" min={0.85} max={1.2} step={0.01} value={Number.isNaN(preset.bodyScale) ? "" : preset.bodyScale} onChange={(event) => update(index, { bodyScale: event.target.valueAsNumber })} disabled={!editable || saving} dir="ltr" className={field} /></label>
        {editable && <button type="button" onClick={() => setPresets((current) => current.filter((_, position) => position !== index))} disabled={saving} className="min-h-11 text-right text-sm underline">حذف فرم</button>}
      </fieldset>)}
      {editable && <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setPresets((current) => [...current, { id: "", labelFa: "", shoulder: 0.47, bodyScale: 1 }])} disabled={saving || presets.length >= 8} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm disabled:opacity-40">افزودن فرم</button><button type="submit" disabled={saving} className="min-h-11 rounded-full bg-ink px-5 text-sm text-canvas disabled:opacity-40">{saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}</button></div>}
      <p role="status" aria-live="polite" className="text-sm text-muted">{message}</p>
    </form>
  </section>;
}
