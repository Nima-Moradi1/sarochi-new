import { storefrontCopy } from "@/features/content/storefront-copy";
import { StoreMark } from "@/features/content/StoreMark";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductDetail } from "@/features/catalog/server/detail";
import { ProductGallery } from "@/features/catalog/ProductGallery";
import { VariantSelector } from "@/features/catalog/VariantSelector";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductDetail(slug);
    if (!product) return { title: "محصول پیدا نشد | فروشگاه" };
    return { title: `${product.nameFa} | فروشگاه`, description: (product.description ? storefrontCopy(product.description).slice(0, 155) : null) ?? `مشاهده ${product.nameFa} در فروشگاه` };
  } catch {
    return { title: "فروشگاه | محصول" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) notFound();
  let product;
  try {
    product = await getProductDetail(slug);
  } catch {
    return <main className="mx-auto max-w-6xl px-5 py-16"><Link href="/" className="text-sm underline">بازگشت به فروشگاه</Link><p role="status" className="mt-12 rounded-2xl bg-rack p-8 text-muted">اطلاعات محصول اکنون در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.</p></main>;
  }
  if (!product) notFound();
  return <main className="mx-auto max-w-[1500px] px-5 pb-20 sm:px-9 lg:px-16">
    <header className="flex min-h-21 items-center justify-between border-b border-ink/15 py-4"><Link href="/" className="font-serif text-2xl tracking-[0.16em]" dir="ltr"><StoreMark /></Link><nav className="flex gap-5 text-sm"><Link href="/shop" className="underline-offset-4 hover:underline">همه پوشاک</Link><Link href="/cart" className="underline-offset-4 hover:underline">سبد خرید</Link></nav></header>
    <nav aria-label="مسیر صفحه" className="my-7 flex flex-wrap gap-2 text-xs text-muted"><Link href="/">خانه</Link><span aria-hidden="true">/</span><Link href="/shop">پوشاک</Link>{product.categories[0] && <><span aria-hidden="true">/</span><Link href={`/shop?category=${encodeURIComponent(product.categories[0].slug)}`}>{product.categories[0].nameFa}</Link></>}<span aria-hidden="true">/</span><span aria-current="page">{product.nameFa}</span></nav>
    {product.sourceType === "DEMO" && <p className="mb-6 rounded-xl border border-moss/25 bg-rack p-4 text-xs leading-6 text-moss">این محصول نمونه نمایشی است؛ تصویر، قیمت و موجودی اصلی فروشگاه برای آن ثبت نشده است.</p>}
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)] lg:gap-16">
      <ProductGallery nameFa={product.nameFa} garmentClass={product.garmentClass} media={product.media} />
      <div className="lg:py-6"><p className="mb-4 text-xs tracking-[0.17em] text-moss" dir="ltr">STORE / PRODUCT</p><h1 className="text-3xl font-medium leading-snug sm:text-5xl">{product.nameFa}</h1>{product.description && <p className="mt-6 whitespace-pre-line text-sm leading-8 text-muted">{storefrontCopy(product.description)}</p>}<div className="mt-9"><Suspense fallback={<p className="text-sm text-muted">در حال بارگذاری انتخاب‌ها…</p>}><VariantSelector variants={product.variants} slug={product.slug} /></Suspense></div>{product.variants.length === 0 && <Link href={`/style/${encodeURIComponent(product.slug)}`} className="mt-8 inline-flex min-h-11 items-center rounded-full border border-ink/25 px-5 text-sm">نمایش استایل</Link>}</div>
    </div>
    <div className="mt-14 grid gap-5 border-t border-ink/15 pt-8 md:grid-cols-2">
      <details className="rounded-2xl bg-rack p-6"><summary className="cursor-pointer text-lg font-medium">راهنمای سایز</summary>{product.sizeGuide ? <div className="mt-5"><p className="mb-4 text-sm text-muted">{storefrontCopy(product.sizeGuide.titleFa)}</p>{product.sizeGuide.toleranceCm && <p className="mb-4 text-xs text-muted">تلرانس ثبت‌شده: {product.sizeGuide.toleranceCm} سانتی‌متر</p>}<div className="overflow-x-auto"><table className="w-full min-w-75 text-right text-sm"><thead><tr><th className="py-2">سایز</th><th>اندازه</th><th>سانتی‌متر</th></tr></thead><tbody>{product.sizeGuide.measurements.map((row, index) => <tr key={`${row.size}-${row.metric}-${index}`} className="border-t border-ink/10"><td className="py-2" dir="ltr">{row.size}</td><td>{row.metric}</td><td>{row.valueCm}</td></tr>)}</tbody></table></div></div> : <p className="mt-5 text-sm text-muted">راهنمای اندازه برای این محصول ثبت نشده است.</p>}</details>
      <details className="rounded-2xl bg-rack p-6"><summary className="cursor-pointer text-lg font-medium">نگهداری پوشاک</summary>{product.care.length ? <div className="mt-5 space-y-5">{product.care.map((item, index) => <div key={`${storefrontCopy(item.titleFa)}-${index}`}><h2 className="text-sm font-medium">{storefrontCopy(item.titleFa)}</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">{storefrontCopy(item.instructionsFa)}</p></div>)}</div> : <p className="mt-5 text-sm text-muted">دستور نگهداری برای این محصول ثبت نشده است.</p>}</details>
    </div>
    {product.related.length > 0 && <section aria-labelledby="related-title" className="mt-20"><h2 id="related-title" className="mb-7 text-2xl font-medium">پوشاک مرتبط</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{product.related.map((item) => <Link key={item.id} href={`/products/${encodeURIComponent(item.slug)}`} className="min-h-32 rounded-2xl border border-ink/15 bg-rack p-5 text-sm hover:border-moss">{item.nameFa}</Link>)}</div></section>}
  </main>;
}
