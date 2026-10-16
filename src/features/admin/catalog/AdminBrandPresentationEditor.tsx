"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { brandPresentationSchema, brandSettingsSchema, readBrandSettingsRecord, type BrandPresentation } from "@/features/content/brand-settings";
import type { getAdminCatalogOverview } from "./server/service";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Props = { overview: Overview; editable: boolean };

export function AdminBrandPresentationEditor({ overview, editable }: Props) {
  const router = useRouter();
  const brand = overview.brands.find((item) => item.code === "SAROCHI");
  const initial = brandPresentationSchema.safeParse(brand?.settings);
  const [settings, setSettings] = useState<BrandPresentation>(initial.success ? initial.data : {
    heroEyebrowFa: "", heroHeadingFa: "", heroAccentFa: "", heroDescriptionFa: "", heroCtaFa: "",
  });
  const [message, setMessage] = useState("");
  if (!brand) return null;

  const update = (field: keyof BrandPresentation, value: string) => setSettings((current) => ({ ...current, [field]: value }));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = brandPresentationSchema.safeParse(settings);
    if (!parsed.success) { setMessage("همه متن‌ها را کامل کنید."); return; }
    const merged = brandSettingsSchema.safeParse({ ...readBrandSettingsRecord(brand.settings), ...parsed.data });
    if (!merged.success) { setMessage("تنظیمات برند معتبر نیست. فرم‌های استایل را بررسی کنید."); return; }
    try {
      const response = await fetch(`/api/v1/admin/brands/${brand.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: brand.code, nameFa: brand.nameFa, nameEn: brand.nameEn, settings: merged.data }) });
      if (!response.ok) throw new Error("SAVE_FAILED");
      setMessage("متن معرفی برند ذخیره شد.");
      router.refresh();
    } catch { setMessage("ذخیره متن معرفی برند ممکن نشد."); }
  };

  return <section aria-labelledby="brand-presentation-title" className="mt-8 rounded-2xl border border-ink/15 p-5">
    <h3 id="brand-presentation-title" className="text-xl font-medium">معرفی برند در صفحه نخست</h3>
    <p className="mt-2 text-sm text-muted">این متن‌ها از اطلاعات برند فروشگاه خوانده می‌شوند و پس از ذخیره در صفحه نخست دیده می‌شوند.</p>
    <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
      {([
        ["heroEyebrowFa", "متن بالای تیتر"], ["heroHeadingFa", "تیتر اصلی"], ["heroAccentFa", "بخش برجسته تیتر"], ["heroCtaFa", "متن دکمه کالکشن"],
      ] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<input required maxLength={key === "heroHeadingFa" ? 240 : 120} value={settings[key]} onChange={(event) => update(key, event.target.value)} disabled={!editable} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm" /></label>)}
      <label className="text-sm sm:col-span-2">توضیح کوتاه<textarea required maxLength={600} rows={3} value={settings.heroDescriptionFa} onChange={(event) => update("heroDescriptionFa", event.target.value)} disabled={!editable} className="mt-2 w-full rounded-xl border border-ink/20 bg-canvas p-3 text-sm" /></label>
      {editable && <button type="submit" className="min-h-11 rounded-full bg-ink px-5 text-sm text-canvas sm:justify-self-start">ذخیره معرفی برند</button>}
      <p role="status" aria-live="polite" className="self-center text-sm text-muted">{message}</p>
    </form>
  </section>;
}
