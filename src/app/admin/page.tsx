import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/features/admin/auth/server/service";
import { AdminLogoutButton } from "@/features/admin/auth/AdminLogoutButton";
import { roleAllows } from "@/features/admin/auth/rules";
import { getAdminCatalogOverview } from "@/features/admin/catalog/server/service";
import { AdminCatalogEditor } from "@/features/admin/catalog/AdminCatalogEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مدیریت | ساروچی", robots: { index: false, follow: false } };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
  let admin;
  try { admin = await getCurrentAdmin(); }
  catch { return <main className="mx-auto max-w-4xl px-5 py-16"><p role="status" className="rounded-2xl bg-rack p-8 text-muted">مدیریت اکنون در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.</p></main>; }
  if (!admin) redirect("/admin/login");
  let overview;
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  try { overview = await getAdminCatalogOverview(page, { q: params.q ?? "", status: params.status ?? "" }); }
  catch { return <main className="mx-auto max-w-4xl px-5 py-16"><p role="status" className="rounded-2xl bg-rack p-8 text-muted">کاتالوگ مدیریت اکنون در دسترس نیست.</p></main>; }
  return <main className="mx-auto max-w-6xl px-5 py-10 sm:px-9"><header className="flex flex-wrap items-center justify-between gap-5 border-b border-ink/15 pb-6"><Link href="/" className="font-serif text-2xl tracking-[0.16em]" dir="ltr">SAROCHI</Link><div className="flex items-center gap-5"><Link href="/admin/import" className="text-sm underline-offset-4 hover:underline">بررسی ورود داده</Link><AdminLogoutButton /></div></header><div className="pt-14"><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">ATELIER ADMIN</p><h1 className="text-4xl font-medium">مدیریت ساروچی</h1><p className="mt-5 text-sm text-muted">حساب: <bdi dir="ltr">{admin.email}</bdi> · نقش: <bdi dir="ltr">{admin.role}</bdi></p></div><AdminCatalogEditor overview={overview} editable={roleAllows(admin.role, "EDIT")} owner={roleAllows(admin.role, "OWNER")} /></main>;
}
