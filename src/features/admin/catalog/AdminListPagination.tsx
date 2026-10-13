"use client";

import { useEffect, useState } from "react";
import type { AdminResourceKind } from "./server/pagination";

type Page<T> = { items: T[]; page: number; hasNext: boolean };

export function useAdminListPage<T>(kind: AdminResourceKind, initialItems: T[]) {
  const [requestedPage, setRequestedPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState<Page<T>>(() => ({ items: initialItems.slice(0, 50), page: 1, hasNext: initialItems.length > 50 }));
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/admin/${kind}?page=${requestedPage}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("دریافت فهرست انجام نشد. دوباره تلاش کنید.");
        return response.json() as Promise<Page<T>>;
      })
      .then((next) => {
        if (controller.signal.aborted) return;
        setError("");
        if (!next.items.length && next.page > 1) { setRequestedPage(next.page - 1); return; }
        setData(next);
      })
      .catch(() => { if (!controller.signal.aborted) setError("دریافت فهرست انجام نشد. دوباره تلاش کنید."); });
    return () => controller.abort();
  }, [kind, requestedPage, retry, initialItems]);
  const changePage = (page: number) => { setError(""); setRequestedPage(page); };
  return { ...data, error, loading: !error && requestedPage !== data.page, changePage, retry: () => { setError(""); setRetry((value) => value + 1); } };
}

type NavigationProps = { page: number; hasNext: boolean; error: string; loading: boolean; changePage: (page: number) => void; retry: () => void; label: string };

export function AdminListPagination({ page, hasNext, error, loading, changePage, retry, label }: NavigationProps) {
  return <div className="my-5"><nav aria-label={label} aria-busy={loading} className="flex items-center justify-between gap-3 text-sm"><button type="button" onClick={() => changePage(page - 1)} disabled={page === 1 || loading} className="min-h-11 rounded-full border border-ink/20 px-5 disabled:opacity-30">قبلی</button><span>{page.toLocaleString("fa-IR")}</span><button type="button" onClick={() => changePage(page + 1)} disabled={!hasNext || loading || page >= 10000} className="min-h-11 rounded-full border border-ink/20 px-5 disabled:opacity-30">بعدی</button></nav>{error && <p role="status" className="mt-3 text-xs text-muted">{error} <button type="button" onClick={retry} className="min-h-10 px-2 underline">تلاش دوباره</button></p>}</div>;
}
