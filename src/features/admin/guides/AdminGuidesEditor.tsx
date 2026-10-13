"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { getAdminCatalogOverview } from "@/features/admin/catalog/server/service";
import { guideWriteSchema, type GuideKind, type GuideRecord } from "./schemas";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Measurement = { sizeId: string; metric: string; valueCm: string };
const field = "mt-2 min-h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 py-2 text-sm";
const action = "min-h-11 rounded-full bg-ink px-6 text-sm text-canvas disabled:opacity-40";
const blankMeasurement = (): Measurement => ({ sizeId: "", metric: "", valueCm: "" });

export function AdminGuidesEditor({ overview, editable }: { overview: Overview; editable: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<GuideKind>("care");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<{ items: GuideRecord[]; hasNext: boolean }>({ items: [], hasNext: false });
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [target, setTarget] = useState<"product" | "category">("product");
  const [targetId, setTargetId] = useState("");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [measurements, setMeasurements] = useState<Measurement[]>([blankMeasurement()]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/admin/guides?kind=${kind}&page=${page}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("دریافت راهنماها انجام نشد. دوباره تلاش کنید.");
        const result = await response.json() as { items: GuideRecord[]; hasNext: boolean };
        if (!controller.signal.aborted) setList(result);
      } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "دریافت راهنماها انجام نشد."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [kind, page, reload]);

  const choose = (row?: GuideRecord) => {
    setId(row?.id ?? null); setTarget(row?.categoryId ? "category" : "product");
    setTargetId(row?.categoryId ? String(row.categoryId) : row?.productId ? String(row.productId) : "");
    setTitle(row?.titleFa ?? ""); setSourceUrl(row?.sourceUrl ?? ""); setInstructions(row?.instructionsFa ?? "");
    setTolerance(row?.toleranceCm === null || row?.toleranceCm === undefined ? "" : String(row.toleranceCm));
    setMeasurements(row?.measurements.length ? row.measurements.map((item) => ({ sizeId: String(item.sizeId), metric: item.metric, valueCm: String(item.valueCm) })) : [blankMeasurement()]);
    setMessage("");
  };
  const changeKind = (value: GuideKind) => { setKind(value); setPage(1); setList({ items: [], hasNext: false }); choose(); };
  const updateMeasurement = (index: number, values: Partial<Measurement>) => setMeasurements((rows) => rows.map((row, position) => position === index ? { ...row, ...values } : row));
  const targets = target === "product" ? overview.products.map((row) => ({ id: row.id, label: row.nameFa })) : overview.categories.map((row) => ({ id: row.id, label: row.nameFa }));

  async function send(method: "POST" | "PATCH" | "DELETE", data?: unknown) {
    const response = await fetch(`/api/v1/admin/guides${id ? `/${id}` : ""}${method === "DELETE" ? `?kind=${kind}` : ""}`, { method, headers: data ? { "Content-Type": "application/json" } : undefined, body: data ? JSON.stringify(data) : undefined });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error === "SIZE_GUIDE_ALREADY_EXISTS" ? "برای این محصول یا دسته، راهنمای سایز دیگری ثبت شده است. همان راهنما را ویرایش کنید." : result.error === "INVALID_INPUT" ? "مقادیر راهنما معتبر نیست؛ اندازه‌ها و ردیف‌های تکراری را بررسی کنید." : "ذخیره راهنما انجام نشد. دوباره تلاش کنید.");
    }
  }
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editable || saving) return;
    const common = { productId: target === "product" ? Number(targetId) : null, categoryId: target === "category" ? Number(targetId) : null, titleFa: title, sourceUrl: sourceUrl.trim() || null };
    const parsed = guideWriteSchema.safeParse(kind === "care" ? { ...common, kind, instructionsFa: instructions } : { ...common, kind, toleranceCm: tolerance === "" ? null : Number(tolerance), measurements: measurements.map((row) => ({ sizeId: Number(row.sizeId), metric: row.metric, valueCm: Number(row.valueCm) })) });
    if (!parsed.success) { setMessage("عنوان، محصول یا دسته و اندازه‌های واقعی را تکمیل کنید. هر سایز و معیار فقط یک‌بار و با حداکثر یک رقم اعشار ثبت شود."); return; }
    setSaving(true); setMessage("");
    try { await send(id ? "PATCH" : "POST", parsed.data); choose(); setMessage("راهنما ذخیره شد و در صفحه محصول در دسترس است."); setReload((value) => value + 1); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره انجام نشد."); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!id || !editable || saving || !window.confirm("این راهنما و اندازه‌های مربوط به آن حذف شود؟")) return;
    setSaving(true);
    try { await send("DELETE"); choose(); setMessage("راهنما حذف شد."); setReload((value) => value + 1); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "حذف انجام نشد."); }
    finally { setSaving(false); }
  };

  return <section aria-labelledby="admin-guides-title">
    <h2 id="admin-guides-title" className="text-2xl font-medium">راهنمای نگهداری و اندازه</h2>
    <p className="mt-3 text-sm leading-7 text-muted">تنها اطلاعات تأییدشده محصول یا دسته را ثبت کنید. اندازه‌ها بر حسب سانتی‌متر هستند؛ راهنمای مخصوص محصول بر راهنمای سایز دسته اولویت دارد.</p>
    <div role="group" aria-label="نوع راهنما" className="my-6 flex gap-2">{(["care", "size"] as const).map((value) => <button key={value} type="button" disabled={saving} aria-pressed={kind === value} onClick={() => changeKind(value)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm aria-pressed:bg-ink aria-pressed:text-canvas">{value === "care" ? "نگهداری" : "اندازه"}</button>)}</div>
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="rounded-2xl bg-rack p-3">
        {loading ? <p role="status" className="p-3 text-sm text-muted">در حال دریافت…</p> : <>{list.items.map((row) => <button key={`${row.kind}-${row.id}`} type="button" disabled={saving} onClick={() => choose(row)} aria-pressed={id === row.id} className="block min-h-11 w-full rounded-xl px-3 text-right text-sm aria-pressed:bg-canvas">{row.titleFa}</button>)}{list.items.length === 0 && <p className="p-3 text-sm text-muted">راهنمایی در این صفحه ثبت نشده است.</p>}</>}
        {editable && <button type="button" disabled={saving} onClick={() => choose()} className="my-3 min-h-11 px-3 text-sm underline">راهنمای تازه</button>}
        <nav aria-label="صفحه‌های راهنما" className="mt-3 flex items-center justify-between gap-2 text-sm"><button type="button" disabled={loading || saving || page === 1} onClick={() => { setPage((value) => value - 1); choose(); }} className="min-h-11 rounded-full border border-ink/20 px-3 disabled:opacity-30">قبلی</button><span>{page.toLocaleString("fa-IR")}</span><button type="button" disabled={loading || saving || !list.hasNext} onClick={() => { setPage((value) => value + 1); choose(); }} className="min-h-11 rounded-full border border-ink/20 px-3 disabled:opacity-30">بعدی</button></nav>
      </div>
      <form onSubmit={save} className="rounded-2xl border border-ink/15 p-5">
        <fieldset disabled={!editable || saving} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">عنوان<input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className={field} /></label>
          <label className="text-sm">مربوط به<select value={target} onChange={(event) => { setTarget(event.target.value as "product" | "category"); setTargetId(""); }} className={field}><option value="product">محصول</option><option value="category">دسته‌بندی</option></select></label>
          <label className="text-sm">{target === "product" ? "محصول در صفحه فعلی مدیریت" : "دسته‌بندی"}<select required value={targetId} onChange={(event) => setTargetId(event.target.value)} className={field}><option value="">انتخاب کنید</option>{targetId && !targets.some((row) => String(row.id) === targetId) && <option value={targetId}>انتخاب ثبت‌شده · {targetId}</option>}{targets.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
          <label className="text-sm sm:col-span-2">نشانی منبع تأییدشده (اختیاری)<input type="url" dir="ltr" maxLength={1024} placeholder="https://" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className={field} /></label>
          {kind === "care" ? <label className="text-sm sm:col-span-2">دستور نگهداری<textarea required minLength={2} maxLength={20000} rows={7} value={instructions} onChange={(event) => setInstructions(event.target.value)} className={`${field} leading-7`} /></label> : <>
            <label className="text-sm">تلورانس اندازه (سانتی‌متر، اختیاری)<input type="number" min={0} max={99.9} step="0.1" value={tolerance} onChange={(event) => setTolerance(event.target.value)} className={field} /></label>
            <div className="sm:col-span-2"><h3 className="mb-4 font-medium">اندازه‌های واقعی</h3>{measurements.map((row, index) => <div key={index} className="mb-4 grid gap-3 rounded-xl bg-rack p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"><label className="text-xs">سایز<select required value={row.sizeId} onChange={(event) => updateMeasurement(index, { sizeId: event.target.value })} className={field}><option value="">انتخاب کنید</option>{overview.sizes.map((size) => <option key={size.id} value={size.id}>{size.label}</option>)}</select></label><label className="text-xs">معیار (مثل عرض سینه)<input required minLength={2} maxLength={80} value={row.metric} onChange={(event) => updateMeasurement(index, { metric: event.target.value })} className={field} /></label><label className="text-xs">سانتی‌متر<input required type="number" min={0.1} max={99999.9} step="0.1" value={row.valueCm} onChange={(event) => updateMeasurement(index, { valueCm: event.target.value })} className={field} /></label><button type="button" disabled={measurements.length === 1} onClick={() => setMeasurements((rows) => rows.filter((_, position) => position !== index))} aria-label={`حذف اندازه ${index + 1}`} className="min-h-11 self-end rounded-full border border-ink/20 px-3 text-sm disabled:opacity-30">حذف</button></div>)}<button type="button" disabled={measurements.length >= 100} onClick={() => setMeasurements((rows) => [...rows, blankMeasurement()])} className="min-h-11 rounded-full border border-ink/20 px-4 text-sm disabled:opacity-30">افزودن اندازه</button></div>
          </>}
          <div className="flex gap-3 sm:col-span-2"><button type="submit" className={action}>{saving ? "در حال ذخیره…" : "ذخیره راهنما"}</button>{id && <button type="button" onClick={remove} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm">حذف راهنما</button>}</div>
        </fieldset>
        <p role="status" className="mt-4 text-sm leading-7 text-muted">{message}</p>
      </form>
    </div>
  </section>;
}
