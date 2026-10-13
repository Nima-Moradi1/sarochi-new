"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { getAdminCatalogOverview } from "./server/service";
import { AdminVariantEditor } from "./AdminVariantEditor";
import { AdminMediaEditor } from "./AdminMediaEditor";
import { AdminOwnerUpload } from "./AdminOwnerUpload";
import { AdminTaxonomyEditor } from "./AdminTaxonomyEditor";
import { AdminBrandPresentationEditor } from "./AdminBrandPresentationEditor";
import { AdminPageEditor } from "./AdminPageEditor";
import { AdminGuidesEditor } from "@/features/admin/guides/AdminGuidesEditor";
import { AdminStylingSettingsEditor } from "./AdminStylingSettingsEditor";
import { AdminBrandIdentityEditor } from "./AdminBrandIdentityEditor";
import { AdminVariantStylingEditor } from "./AdminVariantStylingEditor";
import { AdminListPagination, useAdminListPage } from "./AdminListPagination";
import { AdminAuditViewer } from "@/features/admin/audit/AdminAuditViewer";
import { AdminProductSearch } from "./AdminProductSearch";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Props = { overview: Overview; editable: boolean; owner?: boolean };

async function mutate(url: string, method: "POST" | "PATCH" | "PUT" | "DELETE", data?: unknown) {
  const response = await fetch(url, { method, headers: data === undefined ? undefined : { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data), cache: "no-store" });
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error ?? "SAVE_FAILED");
  }
  return response.status === 204 ? null : response.json();
}

const fieldClass = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";
const actionClass = "min-h-11 rounded-full bg-ink px-6 text-sm text-canvas disabled:opacity-40";

function CategoriesPanel({ overview, editable }: Props) {
  const list = useAdminListPage("categories", overview.categories);
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [nameFa, setNameFa] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [message, setMessage] = useState("");
  const choose = (id: number | null) => {
    const row = list.items.find((item) => item.id === id);
    setEditing(id); setSlug(row?.slug ?? ""); setNameFa(row?.nameFa ?? ""); setParentId(row?.parentId ? String(row.parentId) : ""); setSortOrder(row?.sortOrder ?? 0); setIsPublished(row?.isPublished ?? false); setMessage("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    try { await mutate(editing ? `/api/v1/admin/categories/${editing}` : "/api/v1/admin/categories", editing ? "PATCH" : "POST", { slug, nameFa, parentId: parentId ? Number(parentId) : null, sortOrder, isPublished }); setMessage("دسته ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره انجام نشد"); }
  };
  const remove = async () => {
    if (!editing || !window.confirm("این دسته فقط در صورت بدون‌استفاده بودن حذف می‌شود. ادامه؟")) return;
    try { await mutate(`/api/v1/admin/categories/${editing}`, "DELETE"); choose(null); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "حذف انجام نشد"); }
  };
  return <section aria-labelledby="admin-categories-title"><div className="mb-5 flex items-center justify-between"><h2 id="admin-categories-title" className="text-2xl font-medium">دسته‌بندی‌ها</h2>{editable && <button type="button" onClick={() => choose(null)} className="text-sm underline">دسته تازه</button>}</div><div className="grid gap-7 lg:grid-cols-[260px_1fr]"><div className="max-h-96 space-y-1 overflow-y-auto rounded-2xl bg-rack p-3">{list.items.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={editing === item.id} className="block min-h-10 w-full rounded-xl px-3 text-right text-sm aria-pressed:bg-canvas">{item.nameFa}</button>)}<AdminListPagination {...list} label="صفحه‌های دسته‌بندی‌ها" /></div><form onSubmit={save} className="grid gap-4 rounded-2xl border border-ink/15 p-5 sm:grid-cols-2"><label className="text-sm">نام فارسی<input required maxLength={160} value={nameFa} onChange={(event) => setNameFa(event.target.value)} disabled={!editable} className={fieldClass} /></label><label className="text-sm">شناسه نشانی<input required pattern="[a-z0-9-]+" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={!editable} dir="ltr" className={fieldClass} /></label><label className="text-sm">دسته والد<select value={parentId} onChange={(event) => setParentId(event.target.value)} disabled={!editable} className={fieldClass}><option value="">بدون والد</option>{overview.categories.filter((item) => item.id !== editing).map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label><label className="text-sm">ترتیب<input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} disabled={!editable} className={fieldClass} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} disabled={!editable} /> منتشر شود</label><div className="flex flex-wrap items-center gap-3 sm:col-span-2">{editable && <><button type="submit" className={actionClass}>ذخیره دسته</button>{editing && <button type="button" onClick={remove} className="min-h-11 rounded-full border border-ink/25 px-5 text-sm">حذف</button>}</>}<p role="status" className="text-xs text-muted">{message}</p></div></form></div></section>;
}

function RailsPanel({ overview, editable }: Props) {
  const list = useAdminListPage("rails", overview.rails);
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [editorialCopy, setEditorialCopy] = useState("");
  const [themeId, setThemeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const choose = (id: number | null) => {
    const row = list.items.find((item) => item.id === id);
    setEditing(id); setSlug(row?.slug ?? ""); setTitleFa(row?.titleFa ?? ""); setEditorialCopy(row?.editorialCopy ?? ""); setThemeId(row?.themeId ?? ""); setCategoryId(row?.categoryId ? String(row.categoryId) : ""); setSortOrder(row?.sortOrder ?? 0); setIsPublished(row?.isPublished ?? false); setProductIds(row?.productIds ?? []); setMessage("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    try { await mutate(editing ? `/api/v1/admin/rails/${editing}` : "/api/v1/admin/rails", editing ? "PATCH" : "POST", { slug, titleFa, categoryId: categoryId ? Number(categoryId) : null, sortOrder, isPublished, editorialCopy: editorialCopy.trim() || null, themeId: themeId || null }); setMessage("ریل ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره انجام نشد"); }
  };
  const saveItems = async () => {
    if (!editing) return;
    try { await mutate(`/api/v1/admin/rails/${editing}/items`, "PUT", { productIds }); setMessage("ترتیب پوشاک ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ترتیب ذخیره نشد"); }
  };
  const shift = (index: number, offset: number) => { const next = [...productIds]; const target = index + offset; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setProductIds(next); };
  return <section aria-labelledby="admin-rails-title"><div className="mb-5 flex items-center justify-between"><h2 id="admin-rails-title" className="text-2xl font-medium">ریل‌ها</h2>{editable && <button type="button" onClick={() => choose(null)} className="text-sm underline">ریل تازه</button>}</div><div className="grid gap-7 lg:grid-cols-[260px_1fr]"><div className="max-h-96 space-y-1 overflow-y-auto rounded-2xl bg-rack p-3">{list.items.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={editing === item.id} className="block min-h-10 w-full rounded-xl px-3 text-right text-sm aria-pressed:bg-canvas">{item.titleFa}</button>)}<AdminListPagination {...list} label="صفحه‌های ریل‌ها" /></div><div><form onSubmit={save} className="grid gap-4 rounded-2xl border border-ink/15 p-5 sm:grid-cols-2"><label className="text-sm sm:col-span-2">معرفی کالکشن<textarea maxLength={1000} value={editorialCopy} onChange={(event) => setEditorialCopy(event.target.value)} disabled={!editable} rows={3} className="mt-2 w-full rounded-xl border border-ink/20 bg-canvas p-3 text-sm leading-7" /></label><label className="text-sm">فضای ریل<select value={themeId} onChange={(event) => setThemeId(event.target.value)} disabled={!editable} className={fieldClass}><option value="">هماهنگ با برند</option><option value="PORCELAIN">پرسلان</option><option value="CHALK">گچی</option></select></label><label className="text-sm">عنوان فارسی<input required maxLength={160} value={titleFa} onChange={(event) => setTitleFa(event.target.value)} disabled={!editable} className={fieldClass} /></label><label className="text-sm">شناسه نشانی<input required pattern="[a-z0-9-]+" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={!editable} dir="ltr" className={fieldClass} /></label><label className="text-sm">دسته مرتبط<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={!editable} className={fieldClass}><option value="">بدون دسته</option>{overview.categories.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label><label className="text-sm">ترتیب<input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} disabled={!editable} className={fieldClass} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} disabled={!editable} /> منتشر شود</label><div className="flex flex-wrap items-center gap-3 sm:col-span-2">{editable && <button type="submit" className={actionClass}>ذخیره ریل</button>}<p role="status" className="text-xs text-muted">{message}</p></div></form>{editing && <div className="mt-5 rounded-2xl border border-ink/15 p-5"><h3 className="font-medium">ترتیب پوشاک روی ریل</h3><div className="mt-4 space-y-2">{productIds.map((id, index) => <div key={id} className="flex items-center justify-between rounded-xl bg-rack px-3 py-2 text-sm"><span>{overview.products.find((item) => item.id === id)?.nameFa ?? `محصول ${id}`}</span>{editable && <div className="flex gap-2"><button type="button" onClick={() => shift(index, -1)} disabled={index === 0} aria-label="بالا بردن پوشاک" className="h-9 w-9 rounded-full border border-ink/20 disabled:opacity-30">↑</button><button type="button" onClick={() => shift(index, 1)} disabled={index === productIds.length - 1} aria-label="پایین بردن پوشاک" className="h-9 w-9 rounded-full border border-ink/20 disabled:opacity-30">↓</button><button type="button" onClick={() => setProductIds(productIds.filter((value) => value !== id))} aria-label="برداشتن از ریل" className="h-9 w-9 rounded-full border border-ink/20">×</button></div>}</div>)}</div>{editable && <div className="mt-5 flex flex-wrap gap-3"><select defaultValue="" onChange={(event) => { const id = Number(event.target.value); if (id && !productIds.includes(id)) setProductIds([...productIds, id]); event.target.value = ""; }} className={fieldClass}><option value="">افزودن پوشاک</option>{overview.products.filter((item) => !productIds.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select><button type="button" onClick={saveItems} className={actionClass}>ذخیره ترتیب</button></div>}</div>}</div></div></section>;
}

function ProductsPanel({ overview, editable }: Props) {
  const productPageHref = (page: number) => { const params = new URLSearchParams({ page: String(page) }); if (overview.productFilters.q) params.set("q", overview.productFilters.q); if (overview.productFilters.status) params.set("status", overview.productFilters.status); return `/admin?${params}`; };
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [nameFa, setNameFa] = useState("");
  const [description, setDescription] = useState("");
  const [garmentClass, setGarmentClass] = useState("TSHIRT");
  const [status, setStatus] = useState("DRAFT");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [brandId, setBrandId] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [message, setMessage] = useState("");
  const choose = (id: number | null) => {
    const row = overview.products.find((item) => item.id === id);
    setEditing(id); setSlug(row?.slug ?? ""); setNameFa(row?.nameFa ?? ""); setDescription(row?.description ?? ""); setGarmentClass(row?.garmentClass ?? "TSHIRT"); setStatus(row?.status ?? "DRAFT"); setCategoryIds(row?.categoryIds ?? []); setBrandId(row?.brandId ? String(row.brandId) : ""); setFamilyId(row?.familyId ? String(row.familyId) : ""); setMessage("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setMessage("");
    try { await mutate(editing ? `/api/v1/admin/products/${editing}` : "/api/v1/admin/products", editing ? "PATCH" : "POST", { slug, nameFa, description: description || null, garmentClass, status, categoryIds, brandId: brandId ? Number(brandId) : null, familyId: familyId ? Number(familyId) : null }); setMessage("محصول ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره انجام نشد"); }
  };
  const archive = async () => {
    if (!editing || !window.confirm("این محصول از فروشگاه پنهان می‌شود. ادامه؟")) return;
    try { await mutate(`/api/v1/admin/products/${editing}`, "DELETE"); setStatus("ARCHIVED"); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "بایگانی انجام نشد"); }
  };
  return <section aria-labelledby="admin-products-title"><div className="mb-5 flex items-center justify-between"><h2 id="admin-products-title" className="text-2xl font-medium">محصولات</h2>{editable && <button type="button" onClick={() => choose(null)} className="text-sm underline">محصول تازه</button>}</div><AdminProductSearch /><div className="grid gap-7 lg:grid-cols-[260px_1fr]"><div><div className="max-h-[550px] space-y-1 overflow-y-auto rounded-2xl bg-rack p-3">{overview.products.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={editing === item.id} className="block min-h-10 w-full rounded-xl px-3 text-right text-sm aria-pressed:bg-canvas">{item.nameFa} <span className="text-xs text-muted">{item.status}</span></button>)}</div><nav aria-label="صفحه‌های محصولات مدیریت" className="mt-4 flex items-center justify-between gap-2 text-sm"><Link href={productPageHref(overview.productPage - 1)} aria-disabled={overview.productPage === 1} tabIndex={overview.productPage === 1 ? -1 : undefined} className={`min-h-11 rounded-full border border-ink/20 px-4 py-3 ${overview.productPage === 1 ? "pointer-events-none opacity-30" : ""}`}>قبلی</Link><span>{overview.productPage.toLocaleString("fa-IR")}</span><Link href={productPageHref(overview.productPage + 1)} aria-disabled={!overview.hasNextProducts} tabIndex={!overview.hasNextProducts ? -1 : undefined} className={`min-h-11 rounded-full border border-ink/20 px-4 py-3 ${!overview.hasNextProducts ? "pointer-events-none opacity-30" : ""}`}>بعدی</Link></nav></div><form onSubmit={save} className="grid gap-4 rounded-2xl border border-ink/15 p-5 sm:grid-cols-2"><label className="text-sm">نام فارسی<input required maxLength={240} value={nameFa} onChange={(event) => setNameFa(event.target.value)} disabled={!editable} className={fieldClass} /></label><label className="text-sm">شناسه نشانی<input required pattern="[a-z0-9-]+" value={slug} onChange={(event) => setSlug(event.target.value)} disabled={!editable} dir="ltr" className={fieldClass} /></label><label className="text-sm">نوع پوشاک<select value={garmentClass} onChange={(event) => setGarmentClass(event.target.value)} disabled={!editable} className={fieldClass}>{["TSHIRT", "SHIRT", "KNIT", "JACKET", "PANTS", "OTHER"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-sm">وضعیت<select value={status} onChange={(event) => setStatus(event.target.value)} disabled={!editable} className={fieldClass}>{["DRAFT", "PUBLISHED", "ARCHIVED"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-sm sm:col-span-2">توضیح محصول<textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={!editable} rows={4} className="mt-2 w-full rounded-xl border border-ink/20 bg-canvas p-3 text-sm" /></label><fieldset className="sm:col-span-2"><legend className="mb-3 text-sm">دسته‌بندی‌ها</legend><div className="flex flex-wrap gap-3">{overview.categories.map((item) => <label key={item.id} className="flex items-center gap-2 rounded-full border border-ink/20 px-3 py-2 text-xs"><input type="checkbox" checked={categoryIds.includes(item.id)} disabled={!editable} onChange={(event) => setCategoryIds(event.target.checked ? [...categoryIds, item.id] : categoryIds.filter((id) => id !== item.id))} />{item.nameFa}</label>)}</div></fieldset><div className="flex flex-wrap items-center gap-3 sm:col-span-2">{editable && <><button type="submit" className={actionClass}>ذخیره محصول</button>{editing && <button type="button" onClick={archive} className="min-h-11 rounded-full border border-ink/25 px-5 text-sm">بایگانی</button>}</>}<p role="status" className="text-xs text-muted">{message}</p></div></form></div></section>;
}

export function AdminCatalogEditor({ overview, editable, owner }: Props) {
  const [section, setSection] = useState<"categories" | "rails" | "products" | "variants" | "media" | "taxonomy" | "pages" | "guides" | "audit">("categories");
  return <div className="mt-10"><div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="بخش مدیریت کاتالوگ">{(["categories", "rails", "products", "variants", "media", "taxonomy", "pages", "guides", ...(owner ? ["audit" as const] : [])] as const).map((item) => <button key={item} type="button" onClick={() => setSection(item)} aria-pressed={section === item} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm aria-pressed:bg-ink aria-pressed:text-canvas">{{ categories: "دسته‌بندی‌ها", rails: "ریل‌ها", products: "محصولات", variants: "تنوع، رنگ و سایز", media: "تصاویر", taxonomy: "برند و خانواده", pages: "صفحه‌ها", guides: "نگهداری و اندازه", audit: "سوابق تغییرات" }[item]}</button>)}</div>{section === "categories" ? <CategoriesPanel overview={overview} editable={editable} /> : section === "rails" ? <RailsPanel overview={overview} editable={editable} /> : section === "products" ? <ProductsPanel overview={overview} editable={editable} /> : section === "media" ? <><AdminMediaEditor overview={overview} editable={editable} />{owner && <AdminOwnerUpload overview={overview} />}</> : section === "taxonomy" ? <div><AdminTaxonomyEditor overview={overview} editable={editable} /><AdminBrandPresentationEditor overview={overview} editable={editable} /><AdminStylingSettingsEditor overview={overview} editable={editable} /><AdminVariantStylingEditor overview={overview} editable={editable} /><AdminBrandIdentityEditor overview={overview} editable={editable} owner={Boolean(owner)} /></div> : section === "pages" ? <AdminPageEditor overview={overview} editable={editable} /> : section === "guides" ? <AdminGuidesEditor overview={overview} editable={editable} /> : section === "audit" && owner ? <AdminAuditViewer /> : <AdminVariantEditor overview={overview} editable={editable} />}</div>;
}
