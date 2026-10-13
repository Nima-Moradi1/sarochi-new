import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPage } from "@/features/content/server/repository";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return { title: "ساروچی" };
  try { const page = await getPublishedPage(slug); return { title: page ? `${page.title} | ساروچی` : "ساروچی" }; }
  catch { return { title: "ساروچی" }; }
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) notFound();
  let page;
  try { page = await getPublishedPage(slug); }
  catch { return <main className="mx-auto max-w-3xl px-5 py-16"><p role="status" className="rounded-2xl bg-rack p-8 text-muted">این صفحه اکنون در دسترس نیست.</p></main>; }
  if (!page) notFound();
  return <main className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-9"><header className="flex items-center justify-between border-b border-ink/15 pb-6"><Link href="/" className="font-serif text-2xl tracking-[0.16em]" dir="ltr">SAROCHI</Link><Link href="/shop" className="text-sm underline-offset-4 hover:underline">پوشاک</Link></header><article className="pt-16"><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">SAROCHI / INFORMATION</p><h1 className="text-4xl font-medium leading-snug sm:text-5xl">{page.title}</h1><div className="mt-10 whitespace-pre-line text-base leading-9 text-ink">{page.body}</div></article></main>;
}
