import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { getCatalogFacets, getProductPage } from "@/features/catalog/server/products";
import { productQueryKeys, productQuerySchema } from "@/features/catalog/schemas";
import { ShopFilters } from "@/features/catalog/ShopFilters";
import { GarmentSilhouette } from "@/features/rack/GarmentSilhouette";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "پوشاک | ساروچی", description: "جستجو و مشاهده پوشاک ساروچی" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ShopPage({ searchParams }: Props) {
  const raw = await searchParams;
  const params = Object.fromEntries(productQueryKeys.flatMap((key) => typeof raw[key] === "string" ? [[key, raw[key]]] : []));
  const parsed = productQuerySchema.safeParse(params);
  let catalog;
  if (parsed.success) {
    try {
      const [page, facets] = await Promise.all([getProductPage(parsed.data), getCatalogFacets()]);
      catalog = { page, facets };
    } catch {
      // The unavailable state below keeps the storefront usable while MySQL recovers.
    }
  }
  const nextParams = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  if (catalog?.page.nextCursor) nextParams.set("cursor", String(catalog.page.nextCursor));

  return <main className="mx-auto max-w-[1680px] px-5 pb-24 sm:px-9 lg:px-16">
    <header className="flex min-h-21 items-center justify-between border-b border-ink/15 py-4"><Link href="/" className="font-serif text-2xl tracking-[0.16em]" dir="ltr">SAROCHI</Link><nav className="flex gap-5 text-sm"><Link href="/#rack" className="underline-offset-4 hover:underline">آتلیه زنده</Link><Link href="/cart" className="underline-offset-4 hover:underline">سبد خرید</Link></nav></header>
    <div className="py-10 sm:py-14"><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">THE EDIT / CATALOG</p><h1 className="text-4xl font-medium sm:text-6xl">پوشاک ساروچی</h1><p className="mt-5 max-w-xl text-sm leading-8 text-muted">در میان پوشاک جستجو کنید و رنگ، سایز و قیمت ثبت‌شده را ببینید.</p></div>
    {!parsed.success ? <div role="alert" className="rounded-2xl bg-rack p-7 text-sm">فیلترهای نشانی معتبر نیستند. <Link href="/shop" className="underline">بازگشت به همه پوشاک</Link></div> : !catalog ? <p role="status" className="rounded-2xl bg-rack p-7 text-sm text-muted">کاتالوگ اکنون در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.</p> : <>
      <Suspense fallback={<p className="text-sm text-muted">در حال بارگذاری فیلترها…</p>}><ShopFilters key={new URLSearchParams(params).toString()} facets={catalog.facets} /></Suspense>
      <div className="mt-8 flex items-center justify-between border-b border-ink/15 pb-4"><h2 className="text-lg font-medium">نتایج</h2><span className="text-xs text-muted">{catalog.page.items.length.toLocaleString("fa-IR")} پوشاک در این صفحه</span></div>
      {catalog.page.items.length === 0 ? <p className="py-16 text-center text-muted">پوشاکی با این فیلترها پیدا نشد.</p> : <div className="grid gap-x-4 gap-y-10 py-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{catalog.page.items.map((item) => <Link key={item.id} href={`/products/${encodeURIComponent(item.slug)}`} className="group block rounded-2xl focus-visible:outline-2"><div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-rack p-6">{item.imageUrl ? <Image src={item.imageUrl} alt={item.nameFa} fill sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 24vw" unoptimized className="object-contain p-5 transition-transform group-hover:scale-105" /> : <div className="h-[85%] w-[85%]"><GarmentSilhouette garmentClass={item.garmentClass} /></div>}</div><div className="pt-4"><h3 className="text-sm font-medium leading-6">{item.nameFa}</h3><p className="mt-2 text-sm text-muted">{item.minPriceToman === null ? "قیمت ثبت نشده" : `از ${item.minPriceToman.toLocaleString("fa-IR")} تومان`}</p><p className="mt-1 text-xs text-muted">{item.stock === "IN_STOCK" ? "موجود" : item.stock === "OUT_OF_STOCK" ? "ناموجود" : "موجودی نامشخص"}</p>{!item.imageUrl && <p className="mt-2 text-[11px] text-muted">نمای مفهومی — تصویر محصول نیست</p>}{item.imageUrl && !item.imageAngleVerified && <p className="mt-2 text-[11px] text-muted">زاویه تصویر تأیید نشده است</p>}{item.sourceType === "DEMO" && <p className="mt-1 text-[11px] text-moss">نمونه نمایشی</p>}</div></Link>)}</div>}
      {catalog.page.nextCursor && <div className="flex justify-center"><Link href={`/shop?${nextParams}`} className="inline-flex min-h-11 items-center rounded-full border border-ink/25 px-7 text-sm">پوشاک بیشتر</Link></div>}
    </>}
  </main>;
}
