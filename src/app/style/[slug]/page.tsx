import { StoreMark } from "@/features/content/StoreMark";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/features/catalog/server/detail";
import { SourceStyleRoom } from "@/features/styling/SourceStyleRoom";
import { getPhotographedWardrobe } from "@/features/styling/server/wardrobe";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try { const product = await getProductDetail(slug); return { title: product ? `استایل ${product.nameFa} | فروشگاه` : "استایل | فروشگاه", robots: { index: false, follow: false } }; }
  catch { return { title: "استایل | فروشگاه", robots: { index: false, follow: false } }; }
}

export default async function StylePage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) notFound();
  let product;
  let wardrobe;
  try {
    [product, wardrobe] = await Promise.all([getProductDetail(slug), getPhotographedWardrobe()]);
  }
  catch { return <main className="mx-auto max-w-6xl px-5 py-16"><Link href="/shop" className="text-sm underline">بازگشت به پوشاک</Link><p role="status" className="mt-12 rounded-2xl bg-rack p-8 text-muted">پیش‌نمایش اکنون در دسترس نیست.</p></main>; }
  if (!product) notFound();
  return <main className="mx-auto max-w-[1500px] px-5 pb-24 sm:px-9 lg:px-16"><header className="flex min-h-21 items-center justify-between border-b border-ink/15 py-4"><Link href="/" className="font-serif text-2xl tracking-[0.16em]" dir="ltr"><StoreMark /></Link><Link href={`/products/${encodeURIComponent(product.slug)}`} className="text-sm underline-offset-4 hover:underline">بازگشت به محصول</Link></header><div className="py-10"><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">STORE / STYLE</p><h1 className="text-3xl font-medium sm:text-5xl">استایل · {product.nameFa}</h1></div><Suspense fallback={<p role="status" className="rounded-3xl bg-rack p-12 text-center text-muted">در حال آماده‌سازی تصاویر…</p>}><SourceStyleRoom key={product.id} product={product} wardrobe={wardrobe} /></Suspense></main>;
}
