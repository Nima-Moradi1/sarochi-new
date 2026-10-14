"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductDetailDTO } from "./types";
import { variantForColor, variantForSize } from "./variant-selection";
import { addCartItem } from "@/features/cart/client/storage";

type Variant = ProductDetailDTO["variants"][number];

function formatToman(value: number) { return `${value.toLocaleString("fa-IR")} تومان`; }

export function VariantSelector({ variants, slug }: { variants: Variant[]; slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartMessage, setCartMessage] = useState("");
  const fromUrl = Number(searchParams.get("variant"));
  const selected = variants.find((item) => item.id === fromUrl) ?? variants[0];
  const colors = [...new Map(variants.filter((item) => item.color).map((item) => [item.color!.slug, item.color!])).values()];
  const sizes = [...new Map(variants.filter((item) => item.size).map((item) => [item.size!.label, item.size!])).values()].sort((a, b) => a.sortOrder - b.sortOrder);
  const choose = (variant: Variant) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", String(variant.id));
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  if (!selected) return <p className="rounded-xl bg-rack p-5 text-muted">برای این محصول هنوز تنوعی ثبت نشده است.</p>;
  const price = selected.salePriceToman ?? selected.regularPriceToman;
  const stockText = selected.stockQty === null ? "موجودی نامشخص" : selected.stockQty > 0 ? `${selected.stockQty.toLocaleString("fa-IR")} عدد موجود` : "ناموجود";
  const canAdd = price !== null && selected.stockQty !== null && selected.stockQty > 0;

  return <div className="space-y-7">
    {colors.length > 0 && <fieldset><legend className="mb-3 text-sm font-medium">انتخاب رنگ <span className="font-normal text-muted">— {selected.color?.nameFa ?? "نامشخص"}</span></legend><div className="flex flex-wrap gap-2">{colors.map((color) => {
      const match = variantForColor(variants, color.slug, selected.size?.label ?? null);
      return <button key={color.slug} type="button" onClick={() => { if (match) choose(match); }} aria-pressed={selected.color?.slug === color.slug} className="min-h-11 rounded-full border border-ink/25 px-4 text-sm aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-canvas">{color.nameFa}</button>;
    })}</div></fieldset>}
    {sizes.length > 0 && <fieldset><legend className="mb-3 text-sm font-medium">انتخاب سایز <span className="font-normal text-muted">— {selected.size?.label ?? "نامشخص"}</span></legend><div className="flex flex-wrap gap-2">{sizes.map((size) => {
      const match = variantForSize(variants, size.label, selected.color?.slug ?? null);
      return <button key={size.label} type="button" disabled={!match} onClick={() => { if (match) choose(match); }} aria-pressed={selected.size?.label === size.label} className="min-h-11 min-w-14 rounded-full border border-ink/25 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-35 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-canvas">{size.label}</button>;
    })}</div></fieldset>}
    <div className="border-t border-ink/15 pt-6"><p className="text-sm text-muted">قیمت</p>{price === null ? <p className="mt-2 text-lg">قیمت ثبت نشده است</p> : <p className="mt-2 text-2xl font-medium">{formatToman(price)}{selected.salePriceToman !== null && selected.regularPriceToman !== null && <span className="mr-3 text-sm font-normal text-muted line-through">{formatToman(selected.regularPriceToman)}</span>}</p>}<p className="mt-4 text-sm text-muted">{stockText}</p>{selected.sku && <p className="mt-2 text-xs text-muted">شناسه: <bdi dir="ltr">{selected.sku}</bdi></p>}<div className="mt-7 flex flex-wrap gap-3"><button type="button" disabled={!canAdd} onClick={() => setCartMessage(addCartItem(selected.id) ? "به سبد خرید آزمایشی افزوده شد." : "افزودن به سبد ممکن نشد؛ ظرفیت سبد یا ذخیره مرورگر را بررسی کنید.")} className="min-h-12 rounded-full bg-ink px-7 text-sm text-canvas disabled:cursor-not-allowed disabled:opacity-40">افزودن به سبد</button><Link href="/cart" className="inline-flex min-h-12 items-center rounded-full border border-ink/25 px-6 text-sm">مشاهده سبد</Link><Link href={`/style/${encodeURIComponent(slug)}?variant=${selected.id}`} className="inline-flex min-h-12 items-center rounded-full border border-ink/25 px-6 text-sm">نمایش استایل</Link></div><p role="status" aria-live="polite" className="mt-3 text-xs text-muted">{cartMessage}</p></div>
  </div>;
}
