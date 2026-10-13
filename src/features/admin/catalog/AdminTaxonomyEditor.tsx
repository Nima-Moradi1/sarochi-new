"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminListPagination, useAdminListPage } from "./AdminListPagination";
import type { getAdminCatalogOverview } from "./server/service";

type Overview = Awaited<ReturnType<typeof getAdminCatalogOverview>>;
type Props = { overview: Overview; editable: boolean };
const field = "mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm";
const action = "min-h-11 rounded-full bg-ink px-5 text-sm text-canvas";

async function request(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  const response = await fetch(url, { method, headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; throw new Error(data.error ?? "SAVE_FAILED"); }
}

export function AdminTaxonomyEditor({ overview, editable }: Props) {
  const router = useRouter();
  const brandList = useAdminListPage("brands", overview.brands);
  const familyList = useAdminListPage("families", overview.families);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brandCode, setBrandCode] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandEnglish, setBrandEnglish] = useState("");
  const [familyId, setFamilyId] = useState<number | null>(null);
  const [familyCode, setFamilyCode] = useState("");
  const [familyTitle, setFamilyTitle] = useState("");
  const [reviewStatus, setReviewStatus] = useState("PENDING");
  const [productId, setProductId] = useState(overview.products[0]?.id ?? 0);
  const [assignedBrand, setAssignedBrand] = useState(overview.products[0]?.brandId ? String(overview.products[0].brandId) : "");
  const [assignedFamily, setAssignedFamily] = useState(overview.products[0]?.familyId ? String(overview.products[0].familyId) : "");
  const [message, setMessage] = useState("");
  const chooseProduct = (id: number) => { const product = overview.products.find((item) => item.id === id); setProductId(id); setAssignedBrand(product?.brandId ? String(product.brandId) : ""); setAssignedFamily(product?.familyId ? String(product.familyId) : ""); };
  const saveBrand = async (event: FormEvent) => {
    event.preventDefault();
    try { await request(brandId ? `/api/v1/admin/brands/${brandId}` : "/api/v1/admin/brands", brandId ? "PATCH" : "POST", { code: brandCode, nameFa: brandName, nameEn: brandEnglish || null }); setMessage("برند ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره نشد"); }
  };
  const saveFamily = async (event: FormEvent) => {
    event.preventDefault();
    try { await request(familyId ? `/api/v1/admin/families/${familyId}` : "/api/v1/admin/families", familyId ? "PATCH" : "POST", { code: familyCode, titleFa: familyTitle, reviewStatus }); setMessage("خانواده محصول ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره نشد"); }
  };
  const assign = async (event: FormEvent) => {
    event.preventDefault();
    const product = overview.products.find((item) => item.id === productId);
    if (!product) return;
    try { await request(`/api/v1/admin/products/${product.id}`, "PATCH", { slug: product.slug, nameFa: product.nameFa, description: product.description, garmentClass: product.garmentClass, status: product.status, categoryIds: product.categoryIds, brandId: assignedBrand ? Number(assignedBrand) : null, familyId: assignedFamily ? Number(assignedFamily) : null }); setMessage("ارتباط محصول ذخیره شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "ذخیره نشد"); }
  };
  const remove = async (kind: "brands" | "families", id: number | null) => {
    if (!id || !window.confirm("این مورد حذف شود؟")) return;
    try { await request(`/api/v1/admin/${kind}/${id}`, "DELETE"); setMessage("حذف شد."); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "حذف نشد"); }
  };
  return <section aria-labelledby="taxonomy-title"><h2 id="taxonomy-title" className="text-2xl font-medium">برند و خانواده محصول</h2><p className="mt-3 text-sm leading-7 text-muted">خانواده‌ها تنها پس از تأیید دستی به محصولات پیوند می‌خورند؛ شباهت نام یا رنگ به‌تنهایی کافی نیست.</p><div className="mt-7 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-ink/15 p-5"><h3 className="font-medium">برندها</h3><div className="my-5 flex flex-wrap gap-2">{brandList.items.map((item) => <button key={item.id} type="button" onClick={() => { setBrandId(item.id); setBrandCode(item.code); setBrandName(item.nameFa); setBrandEnglish(item.nameEn ?? ""); }} className="min-h-10 rounded-full border border-ink/20 px-3 text-xs">{item.nameFa}</button>)}</div><AdminListPagination {...brandList} label="صفحه‌های برندها" /><form onSubmit={saveBrand} className="space-y-4"><label className="block text-sm">کد برند<input required value={brandCode} onChange={(event) => setBrandCode(event.target.value)} disabled={!editable} dir="ltr" className={field} /></label><label className="block text-sm">نام فارسی<input required value={brandName} onChange={(event) => setBrandName(event.target.value)} disabled={!editable} className={field} /></label><label className="block text-sm">نام انگلیسی<input value={brandEnglish} onChange={(event) => setBrandEnglish(event.target.value)} disabled={!editable} dir="ltr" className={field} /></label>{editable && <div className="flex flex-wrap gap-3"><button type="submit" className={action}>ذخیره برند</button><button type="button" onClick={() => { setBrandId(null); setBrandCode(""); setBrandName(""); setBrandEnglish(""); }} className="text-sm underline">تازه</button>{brandId && <button type="button" onClick={() => remove("brands", brandId)} className="text-sm underline">حذف</button>}</div>}</form></div><div className="rounded-2xl border border-ink/15 p-5"><h3 className="font-medium">خانواده‌ها</h3><div className="my-5 flex flex-wrap gap-2">{familyList.items.map((item) => <button key={item.id} type="button" onClick={() => { setFamilyId(item.id); setFamilyCode(item.code); setFamilyTitle(item.titleFa); setReviewStatus(item.reviewStatus); }} className="min-h-10 rounded-full border border-ink/20 px-3 text-xs">{item.titleFa} · {item.reviewStatus}</button>)}</div><AdminListPagination {...familyList} label="صفحه‌های خانواده‌ها" /><form onSubmit={saveFamily} className="space-y-4"><label className="block text-sm">کد خانواده<input required value={familyCode} onChange={(event) => setFamilyCode(event.target.value)} disabled={!editable} dir="ltr" className={field} /></label><label className="block text-sm">عنوان فارسی<input required value={familyTitle} onChange={(event) => setFamilyTitle(event.target.value)} disabled={!editable} className={field} /></label><label className="block text-sm">بررسی<select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} disabled={!editable} className={field}><option value="PENDING">در انتظار بررسی</option><option value="APPROVED">تأیید دستی</option><option value="REJECTED">رد شده</option></select></label>{editable && <div className="flex flex-wrap gap-3"><button type="submit" className={action}>ذخیره خانواده</button><button type="button" onClick={() => { setFamilyId(null); setFamilyCode(""); setFamilyTitle(""); setReviewStatus("PENDING"); }} className="text-sm underline">تازه</button>{familyId && <button type="button" onClick={() => remove("families", familyId)} className="text-sm underline">حذف</button>}</div>}</form></div></div><form onSubmit={assign} className="mt-6 grid gap-4 rounded-2xl border border-ink/15 p-5 sm:grid-cols-3"><h3 className="sm:col-span-3 font-medium">پیوند محصول</h3><label className="text-sm">محصول در این صفحه<select value={productId} onChange={(event) => chooseProduct(Number(event.target.value))} className={field}>{overview.products.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label><label className="text-sm">برند<select value={assignedBrand} onChange={(event) => setAssignedBrand(event.target.value)} disabled={!editable} className={field}><option value="">ثبت نشده</option>{overview.brands.map((item) => <option key={item.id} value={item.id}>{item.nameFa}</option>)}</select></label><label className="text-sm">خانواده تأییدشده<select value={assignedFamily} onChange={(event) => setAssignedFamily(event.target.value)} disabled={!editable} className={field}><option value="">ثبت نشده</option>{overview.families.filter((item) => item.reviewStatus === "APPROVED").map((item) => <option key={item.id} value={item.id}>{item.titleFa}</option>)}</select></label>{editable && <button type="submit" disabled={!productId} className={`${action} sm:col-span-3 sm:justify-self-start disabled:opacity-40`}>ذخیره پیوند</button>}</form><p role="status" className="mt-4 text-sm text-muted">{message}</p></section>;
}
