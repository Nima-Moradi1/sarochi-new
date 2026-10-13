"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CartItemInput } from "../schemas";
import type { CartQuote, CartQuoteLine } from "../quote";
import { readCartItems, writeCartItems } from "./storage";

async function fetchQuote(items: CartItemInput[], signal?: AbortSignal): Promise<CartQuote> {
  const response = await fetch("/api/v1/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(items), cache: "no-store", signal });
  if (!response.ok) throw new Error("QUOTE_UNAVAILABLE");
  return response.json() as Promise<CartQuote>;
}

function lineStatus(line: CartQuoteLine) {
  if (line.status === "MISSING") return "این تنوع دیگر منتشر نشده است";
  if (line.status === "PRICE_UNAVAILABLE") return "قیمت معتبر ثبت نشده است";
  if (line.status === "STOCK_UNKNOWN") return "موجودی قابل تأیید نیست";
  if (line.status === "INSUFFICIENT_STOCK") return "موجودی برای این تعداد کافی نیست";
  return "موجودی تأیید شد";
}

export function CartView() {
  const [items, setItems] = useState<CartItemInput[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const currentItems = useRef("");
  useEffect(() => { currentItems.current = JSON.stringify(items); }, [items]);
  useEffect(() => {
    const sync = () => { const next = readCartItems(); currentItems.current = JSON.stringify(next); setItems(next); setLoaded(true); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sarochi-cart-update", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("sarochi-cart-update", sync); };
  }, []);
  useEffect(() => {
    if (!loaded || items.length === 0) return;
    const controller = new AbortController();
    const signature = JSON.stringify(items);
    fetchQuote(items, controller.signal).then((result) => { if (currentItems.current === signature) { setQuote(result); setError(false); } }).catch((reason) => { if (reason?.name !== "AbortError" && currentItems.current === signature) { setQuote(null); setError(true); } });
    return () => controller.abort();
  }, [items, loaded]);
  const update = (next: CartItemInput[]) => { if (!writeCartItems(next)) { setMessage("ذخیره سبد در این مرورگر ممکن نشد."); return; } currentItems.current = JSON.stringify(next); setItems(next); setQuote(null); setMessage(""); };
  const setQuantity = (variantId: number, quantity: number) => update(items.map((item) => item.variantId === variantId ? { ...item, quantity } : item));
  const checkout = async () => {
    if (checking) return;
    setChecking(true); setMessage("");
    const signature = JSON.stringify(items);
    try {
      const fresh = await fetchQuote(items);
      if (currentItems.current !== signature) return;
      setQuote(fresh);
      setError(false);
      setMessage(fresh.canDemoCheckout ? "این فقط پیش‌نمایش سبد خرید است. هیچ سفارش یا پرداختی ثبت نشد." : "قیمت و موجودی یک یا چند قلم تأیید نشد. سبد خرید را بازبینی کنید.");
    } catch { if (currentItems.current === signature) { setError(true); setMessage("بررسی دوباره قیمت و موجودی ممکن نشد. لطفاً بعداً تلاش کنید."); } }
    finally { setChecking(false); }
  };

  if (!loaded) return <p role="status" className="rounded-2xl bg-rack p-7 text-muted">در حال بارگذاری سبد خرید…</p>;
  if (items.length === 0) return <div className="rounded-2xl bg-rack p-8"><p className="text-muted">سبد خرید خالی است.</p><Link href="/shop" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-canvas">دیدن پوشاک</Link></div>;
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
    <div className="space-y-3">{items.map((item) => {
      const line = quote?.lines.find((entry) => entry.variantId === item.variantId);
      return <article key={item.variantId} className="rounded-2xl border border-ink/15 bg-rack p-5 sm:p-7"><div className="flex flex-wrap justify-between gap-5"><div><h2 className="text-lg font-medium">{line?.slug ? <Link href={`/products/${encodeURIComponent(line.slug)}`} className="underline-offset-4 hover:underline">{line.nameFa}</Link> : "در حال بررسی محصول…"}</h2><p className="mt-2 text-xs text-muted">{[line?.colorNameFa, line?.sizeLabel].filter(Boolean).join(" / ")}</p>{line && <p className="mt-4 text-sm text-muted">{lineStatus(line)}</p>}</div><div className="text-left"><p className="text-sm">{line?.lineTotalToman === null || line?.lineTotalToman === undefined ? "قیمت نامشخص" : `${line.lineTotalToman.toLocaleString("fa-IR")} تومان`}</p><div className="mt-4 flex items-center gap-3" dir="ltr"><button type="button" disabled={item.quantity <= 1} onClick={() => setQuantity(item.variantId, item.quantity - 1)} aria-label="کم کردن تعداد" className="grid h-10 w-10 place-items-center rounded-full border border-ink/25 disabled:opacity-30">−</button><span className="min-w-5 text-center text-sm">{item.quantity.toLocaleString("fa-IR")}</span><button type="button" disabled={item.quantity >= 10} onClick={() => setQuantity(item.variantId, item.quantity + 1)} aria-label="افزودن تعداد" className="grid h-10 w-10 place-items-center rounded-full border border-ink/25 disabled:opacity-30">+</button></div><button type="button" onClick={() => update(items.filter((entry) => entry.variantId !== item.variantId))} className="mt-4 text-xs text-muted underline">حذف از سبد</button></div></div></article>;
    })}</div>
    <aside className="h-fit rounded-2xl border border-ink/15 p-7"><h2 className="text-xl font-medium">خلاصه سبد</h2><div className="mt-7 flex justify-between border-b border-ink/15 pb-5 text-sm"><span>جمع کالاها</span><span>{quote?.subtotalToman === null || quote?.subtotalToman === undefined ? "قابل محاسبه نیست" : `${quote.subtotalToman.toLocaleString("fa-IR")} تومان`}</span></div><p className="mt-5 text-xs leading-6 text-muted">هزینه ارسال و مالیات محاسبه نشده است. این نسخه سفارش یا پرداخت واقعی ندارد.</p>{error && <p role="alert" className="mt-4 text-sm text-muted">اتصال به کاتالوگ برای بررسی قیمت و موجودی برقرار نیست.</p>}<button type="button" disabled={!quote?.canDemoCheckout || error || checking} onClick={checkout} className="mt-7 min-h-12 w-full rounded-full bg-ink px-5 text-sm text-canvas disabled:cursor-not-allowed disabled:opacity-40">{checking ? "در حال بررسی…" : "بررسی نهایی آزمایشی"}</button><p role="status" aria-live="polite" className="mt-4 text-xs leading-6 text-muted">{message}</p></aside>
  </div>;
}
