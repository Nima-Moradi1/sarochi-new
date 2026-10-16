"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductDetailDTO } from "@/features/catalog/types";

/** Show only actual photographs of this exact product. No generic body/outfit substitution. */
export function SourceStyleRoom({ product, wardrobe }: { product: ProductDetailDTO; wardrobe: { slug: string; nameFa: string; imageUrl: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const variants = product.variants;
  const selectedVariant = variants.find((item) => item.id === Number(params.get("variant"))) ?? variants[0];
  const onModel = product.media.filter((image) => image.angle === "LIFESTYLE" && image.confidence === "VERIFIED");
  const photos = onModel.length ? onModel : product.media;
  const [selectedId, setSelectedId] = useState((photos.find((photo) => photo.isPrimary) ?? photos[0])?.id);
  const selected = photos.find((image) => image.id === selectedId) ?? photos[0];
  const index = photos.findIndex((image) => image.id === selected?.id);
  const changePhoto = (step: number) => setSelectedId(photos[(index + step + photos.length) % photos.length]?.id);
  const chooseVariant = (id: string) => {
    const next = new URLSearchParams(params.toString()); next.set("variant", id);
    router.replace(`/style/${product.slug}?${next}`, { scroll: false });
  };
  return <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px]">
    <section aria-label={`عکس‌های استایل ${product.nameFa}`}>
      <div className="relative flex min-h-[460px] h-[min(76svh,850px)] items-center justify-center overflow-hidden rounded-3xl bg-canvas">
        {selected ? <Image src={selected.url} alt={onModel.length ? `${product.nameFa} بر تن مدل، عکس اصلی فروشگاه` : product.nameFa} fill sizes="(max-width: 1023px) 94vw, 65vw" unoptimized className="object-contain" /> : <p className="text-sm text-muted">عکسی برای این محصول ثبت نشده است.</p>}
        {photos.length > 1 && <><button type="button" onClick={() => changePhoto(-1)} aria-label="عکس قبلی" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full border border-ink/20 bg-canvas/90">←</button><button type="button" onClick={() => changePhoto(1)} aria-label="عکس بعدی" className="absolute right-3 grid h-11 w-11 place-items-center rounded-full border border-ink/20 bg-canvas/90">→</button></>}
      </div>
      {photos.length > 1 && <div role="group" aria-label="انتخاب عکس استایل" className="mt-4 flex gap-3 overflow-x-auto pb-2">{photos.map((photo, index) => <button key={photo.id} type="button" onClick={() => setSelectedId(photo.id)} aria-pressed={selected?.id === photo.id} aria-label={`عکس استایل ${index + 1}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-ink/15 aria-pressed:ring-2 aria-pressed:ring-moss"><Image src={photo.url} alt="" fill sizes="80px" unoptimized className="object-contain" /></button>)}</div>}
    </section>
    <aside>
      <h2 className="text-2xl leading-relaxed font-medium">{product.nameFa}</h2>
      <p className="mt-4 text-sm leading-7 text-muted">{onModel.length ? "عکس اصلی همین محصول بر تن مدل، از گالری فروشگاه." : "عکس‌های اصلی همین محصول از گالری فروشگاه."}</p>
      {!onModel.length && <p className="mt-3 text-sm leading-7 text-muted">برای این محصول عکس بر تن مدل ثبت نشده است.</p>}
      {selectedVariant && <label className="mt-6 block text-sm">انتخاب سایز<select value={selectedVariant.id} onChange={(event) => chooseVariant(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-ink/20 bg-canvas px-4">{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.size?.label ?? variant.sku ?? variant.id}{variant.color ? ` · ${variant.color.nameFa}` : ""}</option>)}</select></label>}
      <Link href={`/products/${product.slug}${selectedVariant ? `?variant=${selectedVariant.id}` : ""}`} className="mt-5 inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-sm text-canvas">جزئیات و انتخاب محصول</Link>
      {wardrobe.length > 0 && <section aria-labelledby="real-wardrobe-title" className="mt-10"><h3 id="real-wardrobe-title" className="mb-4 text-lg font-medium">لباس‌های روی مدل</h3><div className="grid grid-cols-3 gap-3">{wardrobe.map((item) => <Link key={item.slug} href={`/style/${item.slug}`} aria-label={item.nameFa} className="relative block aspect-[3/4] overflow-hidden rounded-xl border border-ink/15"><Image src={item.imageUrl} alt={item.nameFa} fill sizes="110px" unoptimized className="object-cover" /></Link>)}</div></section>}
    </aside>
  </div>;
}
