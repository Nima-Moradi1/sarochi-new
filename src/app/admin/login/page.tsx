import { StoreMark } from "@/features/content/StoreMark";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminLoginForm } from "@/features/admin/auth/AdminLoginForm";

export const metadata: Metadata = { title: "ورود مدیریت | فروشگاه", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <main className="mx-auto min-h-screen max-w-md px-5 py-10"><header className="flex items-center justify-between border-b border-ink/15 pb-6"><Link href="/" className="font-serif text-2xl tracking-[0.16em]" dir="ltr"><StoreMark /></Link><span className="text-xs text-muted">مدیریت</span></header><div className="pt-16"><p className="text-xs tracking-[0.15em] text-moss" dir="ltr">ATELIER ADMIN</p><h1 className="mt-4 text-4xl font-medium">ورود مدیر</h1><p className="mt-4 text-sm leading-7 text-muted">با حساب مدیر تأییدشده وارد شوید.</p><AdminLoginForm /></div></main>;
}
