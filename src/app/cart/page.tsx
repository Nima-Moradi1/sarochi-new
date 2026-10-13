import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/features/cart/client/CartView";

export const metadata: Metadata = { title: "سبد خرید آزمایشی | ساروچی" };

export default function CartPage() {
  return <main className="mx-auto max-w-[1500px] px-5 pb-24 sm:px-9 lg:px-16"><header className="flex min-h-21 items-center justify-between border-b border-ink/15 py-4"><Link href="/" className="font-serif text-2xl tracking-[0.16em]" dir="ltr">SAROCHI</Link><Link href="/shop" className="text-sm underline-offset-4 hover:underline">ادامه دیدن پوشاک</Link></header><div className="py-12"><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">DEMO CART</p><h1 className="text-4xl font-medium sm:text-6xl">سبد خرید</h1><p className="mt-5 text-sm leading-7 text-muted">قیمت و موجودی هر بار از کاتالوگ بررسی می‌شود. ثبت سفارش و پرداخت در این نسخه فعال نیست.</p></div><CartView /></main>;
}
