"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function AdminProductSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const urlQuery = search.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setQuery(urlQuery));
    return () => cancelAnimationFrame(frame);
  }, [urlQuery]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.trim() === urlQuery) return;
      const params = new URLSearchParams(search.toString());
      if (query.trim()) params.set("q", query.trim()); else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params}`, { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, urlQuery, search, router, pathname]);
  const changeStatus = (value: string) => {
    const params = new URLSearchParams(search.toString());
    if (value) params.set("status", value); else params.delete("status");
    if (query.trim()) params.set("q", query.trim()); else params.delete("q");
    params.delete("page");
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  return <div className="mb-5 grid gap-3 rounded-2xl bg-rack p-4 sm:grid-cols-2"><label className="text-sm">جستجوی محصول<input type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام یا نشانی محصول" className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm" /></label><label className="text-sm">وضعیت انتشار<select value={search.get("status") ?? ""} onChange={(event) => changeStatus(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-ink/20 bg-canvas px-3 text-sm"><option value="">همه وضعیت‌ها</option><option value="DRAFT">پیش‌نویس</option><option value="PUBLISHED">منتشرشده</option><option value="ARCHIVED">بایگانی</option></select></label></div>;
}
