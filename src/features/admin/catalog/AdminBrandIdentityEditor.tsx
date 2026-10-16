"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { brandIdentitySchema, brandSettingsSchema, readBrandSettingsRecord } from "@/features/content/brand-settings";
import type { getAdminCatalogOverview } from "./server/service";

type Props = { overview: Awaited<ReturnType<typeof getAdminCatalogOverview>>; editable: boolean; owner: boolean };
const field = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";
const action = "min-h-11 rounded-full bg-ink px-5 text-sm text-canvas disabled:opacity-40";

export function AdminBrandIdentityEditor({ overview, editable, owner }: Props) {
  const router = useRouter();
  const brand = overview.brands.find((item) => item.code === "SAROCHI");
  const parsed = brandIdentitySchema.safeParse(readBrandSettingsRecord(brand?.settings));
  const initial = parsed.success ? parsed.data : {};
  const [typography, setTypography] = useState(initial.typography ?? "VAZIRMATN");
  const [footerText, setFooterText] = useState(initial.footerTextFa ?? "");
  const [email, setEmail] = useState(initial.contact?.email ?? "");
  const [phone, setPhone] = useState(initial.contact?.phone ?? "");
  const [address, setAddress] = useState(initial.contact?.addressFa ?? "");
  const [socialLinks, setSocialLinks] = useState(initial.socialLinks ?? []);
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  if (!brand) return null;

  const saveSettings = async (settings: unknown) => {
    const value = brandSettingsSchema.safeParse(settings);
    if (!value.success) throw new Error("معرفی برند و نشانی‌های تماس و شبکه اجتماعی را بررسی کنید.");
    const response = await fetch(`/api/v1/admin/brands/${brand.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: brand.code, nameFa: brand.nameFa, nameEn: brand.nameEn, settings: value.data }), cache: "no-store" });
    if (!response.ok) throw new Error("ذخیره تنظیمات انجام نشد.");
    router.refresh();
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await saveSettings({ ...readBrandSettingsRecord(brand.settings), typography, footerTextFa: footerText, contact: { email: email || null, phone: phone || null, addressFa: address }, socialLinks }); setMessage("هویت برند و اطلاعات تماس ذخیره شد."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره انجام نشد."); }
    finally { setBusy(false); }
  };
  const upload = async (event: FormEvent) => {
    event.preventDefault(); if (!file || !rights) return;
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.set("file", file); form.set("rightsConfirmed", "true");
      const response = await fetch(`/api/v1/admin/brands/${brand.id}/logo`, { method: "POST", body: form, cache: "no-store" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "LOGO_UPLOAD_FAILED");
      setFile(null); setRights(false); if (fileInput.current) fileInput.current.value = "";
      setMessage("نشان اصلی برند بارگذاری شد."); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "بارگذاری انجام نشد."); }
    finally { setBusy(false); }
  };
  const removeLogo = async () => {
    if (!window.confirm("نشان بارگذاری‌شده از نمایش عمومی برداشته شود؟")) return;
    setBusy(true); setMessage("");
    try { await saveSettings({ ...readBrandSettingsRecord(brand.settings), logoAssetId: null }); setMessage("نشان از نمایش عمومی برداشته شد."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره انجام نشد."); }
    finally { setBusy(false); }
  };

  return <section aria-labelledby="brand-identity-title" className="mt-8 rounded-2xl border border-ink/15 p-5">
    <h3 id="brand-identity-title" className="text-xl font-medium">هویت برند و اطلاعات تماس</h3>
    {owner && <form onSubmit={upload} className="mt-5 space-y-4 rounded-2xl bg-rack p-4"><h4 className="font-medium">نشان اصلی فروشگاه</h4><p className="text-sm leading-7 text-muted">فقط نشان اصلی متعلق به برند را بارگذاری کنید. JPEG، PNG یا WebP تا ۵ مگابایت؛ فایل اصلی برای سوابق نگهداری می‌شود.</p><label className="block text-sm">فایل نشان<input ref={fileInput} required type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] ?? null)} className={field} /></label><label className="flex items-center gap-2 text-sm"><input required type="checkbox" checked={rights} disabled={busy} onChange={(event) => setRights(event.target.checked)} /> نشان اصلی است و حق انتشار آن را دارم</label><div className="flex flex-wrap gap-3"><button type="submit" disabled={busy || !file || !rights} className={action}>بارگذاری نشان</button>{Boolean(readBrandSettingsRecord(brand.settings).logoAssetId) && <button type="button" onClick={removeLogo} disabled={busy} className="min-h-11 px-3 text-sm underline">برداشتن نشان</button>}</div></form>}
    <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm">قلم متن فارسی<select value={typography} disabled={!editable || busy} onChange={(event) => setTypography(event.target.value as "VAZIRMATN" | "SYSTEM")} className={field}><option value="VAZIRMATN">وزیرمتن</option><option value="SYSTEM">قلم دستگاه</option></select></label>
      <label className="text-sm">ایمیل تماس<input type="email" maxLength={254} value={email} disabled={!editable || busy} onChange={(event) => setEmail(event.target.value)} dir="ltr" className={field} /></label>
      <label className="text-sm">تلفن تماس<input type="tel" maxLength={40} value={phone} disabled={!editable || busy} onChange={(event) => setPhone(event.target.value)} dir="ltr" className={field} /></label>
      <label className="text-sm">نشانی<textarea rows={2} maxLength={500} value={address} disabled={!editable || busy} onChange={(event) => setAddress(event.target.value)} className="mt-2 w-full rounded-xl border border-ink/20 bg-canvas p-3 text-sm" /></label>
      <label className="text-sm sm:col-span-2">متن پایین صفحه<textarea rows={3} maxLength={600} value={footerText} disabled={!editable || busy} onChange={(event) => setFooterText(event.target.value)} className="mt-2 w-full rounded-xl border border-ink/20 bg-canvas p-3 text-sm" /></label>
      <fieldset className="space-y-4 sm:col-span-2"><legend className="mb-3 text-sm">شبکه‌های اجتماعی</legend>{socialLinks.map((link, index) => <div key={index} className="grid gap-3 rounded-xl bg-rack p-3 sm:grid-cols-[1fr_2fr_auto]"><label className="text-sm">عنوان<input required minLength={2} maxLength={60} value={link.labelFa} disabled={!editable || busy} onChange={(event) => setSocialLinks((current) => current.map((item, position) => position === index ? { ...item, labelFa: event.target.value } : item))} className={field} /></label><label className="text-sm">نشانی HTTPS<input required type="url" maxLength={2048} pattern="https://.*" value={link.url} disabled={!editable || busy} onChange={(event) => setSocialLinks((current) => current.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} dir="ltr" className={field} /></label>{editable && <button type="button" disabled={busy} onClick={() => setSocialLinks((current) => current.filter((_, position) => position !== index))} className="min-h-11 self-end px-3 text-sm underline">حذف</button>}</div>)}{editable && <button type="button" disabled={busy || socialLinks.length >= 6} onClick={() => setSocialLinks((current) => [...current, { labelFa: "", url: "" }])} className="min-h-11 px-3 text-sm underline disabled:opacity-40">افزودن شبکه اجتماعی</button>}</fieldset>
      {editable && <button type="submit" disabled={busy} className={`${action} sm:justify-self-start`}>ذخیره هویت برند</button>}
    </form>
    <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">{message}</p>
  </section>;
}
