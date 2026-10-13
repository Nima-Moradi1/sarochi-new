"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CatalogFacetsDTO } from "./types";

type Props = { facets: CatalogFacetsDTO };

export function ShopFilters({ facets }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setQuery(searchParams.get("q") ?? "");
      setMinPrice(searchParams.get("minPrice") ?? "");
      setMaxPrice(searchParams.get("maxPrice") ?? "");
    });
    return () => cancelAnimationFrame(frame);
    // Browser history changes the URL without remounting this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const replace = (updates: Record<string, string>) => {
    const params = new URLSearchParams(queryString);
    for (const [key, value] of Object.entries({ q: query, minPrice, maxPrice, ...updates })) {
      if (value.trim()) params.set(key, value.trim()); else params.delete(key);
    }
    params.delete("cursor");
    const next = params.toString();
    if (next !== queryString) router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(queryString);
      const changed = (params.get("q") ?? "") !== query.trim()
        || (params.get("minPrice") ?? "") !== minPrice.trim()
        || (params.get("maxPrice") ?? "") !== maxPrice.trim();
      if (changed) replace({ q: query, minPrice, maxPrice });
    }, 350);
    return () => window.clearTimeout(timer);
    // Draft fields intentionally drive this debounce; URL navigation remounts this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minPrice, maxPrice, queryString]);

  return <form role="search" onSubmit={(event) => { event.preventDefault(); replace({ q: query, minPrice, maxPrice }); }} className="grid gap-4 rounded-2xl border border-ink/15 bg-rack p-5 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
    <label className="block text-xs text-muted lg:col-span-2">جستجو در پوشاک<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام پوشاک" className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm text-ink outline-none focus:border-moss" /></label>
    <label className="block text-xs text-muted">دسته‌بندی<select value={searchParams.get("category") ?? ""} onChange={(event) => replace({ category: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm text-ink"><option value="">همه</option>{facets.categories.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
    <label className="block text-xs text-muted">رنگ<select value={searchParams.get("color") ?? ""} onChange={(event) => replace({ color: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm text-ink"><option value="">همه</option>{facets.colors.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}</select></label>
    <label className="block text-xs text-muted">سایز<select value={searchParams.get("size") ?? ""} onChange={(event) => replace({ size: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm text-ink"><option value="">همه</option>{facets.sizes.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-muted">از قیمت<input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-2 text-sm text-ink" /></label><label className="block text-xs text-muted">تا قیمت<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-2 text-sm text-ink" /></label></div>
    <label className="block text-xs text-muted lg:col-span-2">مرتب‌سازی<select value={searchParams.get("sort") ?? "newest"} onChange={(event) => replace({ sort: event.target.value === "newest" ? "" : event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm text-ink"><option value="newest">جدیدترین</option><option value="price_asc">قیمت: کم به زیاد</option><option value="price_desc">قیمت: زیاد به کم</option></select></label>
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm lg:col-span-2"><input type="checkbox" checked={["true", "1"].includes(searchParams.get("inStock") ?? "")} onChange={(event) => replace({ inStock: event.target.checked ? "true" : "" })} className="h-5 w-5 accent-moss" />فقط پوشاک موجود</label>
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm lg:col-span-2"><input type="checkbox" checked={["true", "1"].includes(searchParams.get("onSale") ?? "")} onChange={(event) => replace({ onSale: event.target.checked ? "true" : "" })} className="h-5 w-5 accent-moss" />فقط دارای تخفیف</label>
    <button type="submit" className="sr-only">اعمال فیلترها</button>
  </form>;
}
