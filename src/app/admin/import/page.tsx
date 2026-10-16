import { StoreMark } from "@/features/content/StoreMark";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/features/admin/auth/server/service";
import { roleAllows } from "@/features/admin/auth/rules";
import { getImportReviewDashboard } from "@/features/import/server/review";
import { AdminImportReview } from "@/features/import/AdminImportReview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "بررسی ورود داده | فروشگاه", robots: { index: false, follow: false } };

export default async function AdminImportPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  let admin;
  try { admin = await getCurrentAdmin(); }
  catch { return <main className="mx-auto max-w-4xl px-5 py-16 text-muted">مدیریت اکنون در دسترس نیست.</main>; }
  if (!admin) redirect("/admin/login");
  let dashboard;
  try { dashboard = await getImportReviewDashboard(Number((await searchParams).page ?? "1")); }
  catch { return <main className="mx-auto max-w-4xl px-5 py-16 text-muted">فهرست ورود داده اکنون در دسترس نیست.</main>; }
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-9"><header className="flex items-center justify-between border-b border-ink/15 pb-6"><Link href="/admin" className="font-serif text-2xl tracking-[0.16em]" dir="ltr"><StoreMark /></Link><Link href="/admin" className="text-sm underline">بازگشت به مدیریت</Link></header><div className="pt-14"><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">CATALOG REVIEW</p><h1 className="text-4xl font-medium">بررسی ورود داده</h1><p className="mt-4 text-sm leading-7 text-muted">داده‌های منبع پیش از ورود به کاتالوگ بررسی می‌شوند. قیمت و موجودی نامشخص ساخته نمی‌شود و تصویر پشت تا تأیید واقعی نمایش داده نمی‌شود.</p></div><AdminImportReview dashboard={dashboard} editable={roleAllows(admin.role, "EDIT")} owner={admin.role === "OWNER"} /></main>;
}
