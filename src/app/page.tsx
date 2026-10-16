import { StoreMark } from "@/features/content/StoreMark";
import { getPublishedRails } from "@/features/catalog/server/service";
import type { RailDTO } from "@/features/catalog/types";
import { GarmentRack } from "@/features/rack/GarmentRack";
import Link from "next/link";
import { getBrandPresentation, getPublishedPageLinks } from "@/features/content/server/repository";
import type { BrandPresentation } from "@/features/content/brand-settings";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  let rails: RailDTO[] = [];
  let unavailable = false;
  let pageLinks: Array<{ slug: string; title: string }> = [];
  let presentation: BrandPresentation | null = null;
  try {
    [rails, pageLinks, presentation] = await Promise.all([getPublishedRails({ limit: 60 }), getPublishedPageLinks(), getBrandPresentation()]);
  } catch {
    unavailable = true;
  }
  const demo = rails.some((rail) => rail.items.some((item) => item.sourceType === "DEMO"));

  return (
    <main className="min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-[1680px] px-5 sm:px-9 lg:px-16">
        <header className="flex min-h-21 items-center justify-between gap-3 border-b border-ink/15 py-4 sm:gap-6">
          <a href="#top" className="shrink-0 font-serif text-2xl tracking-[0.16em] text-ink sm:text-3xl" dir="ltr" aria-label="فروشگاه، بازگشت به آغاز"><StoreMark /></a>
          <div className="flex items-center gap-3 text-xs sm:gap-8 sm:text-sm">
            <a href="#collections" className="underline-offset-4 hover:underline">کالکشن‌ها</a>
            <Link href="/shop" className="underline-offset-4 hover:underline">همه پوشاک</Link>
            <Link href="/cart" className="underline-offset-4 hover:underline">سبد خرید</Link>
            <span className="hidden text-muted sm:inline" dir="ltr">THE LIVING ATELIER</span>
          </div>
        </header>

        <section id="top" aria-labelledby="hero-title" className="relative grid min-h-[min(780px,85svh)] items-center gap-14 py-16 lg:grid-cols-[1fr_0.8fr] lg:py-24">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-7 flex items-center gap-3 text-xs tracking-wide text-moss sm:text-sm"><span className="h-px w-9 bg-moss" aria-hidden="true" />{presentation?.heroEyebrowFa ?? "فروشگاه پوشاک"}</p>
            <h1 id="hero-title" className="text-[clamp(3rem,6.5vw,7rem)] leading-[1.25] font-medium tracking-tight">{presentation?.heroHeadingFa ?? "فروشگاه پوشاک"} {presentation && <em className="font-normal not-italic text-moss">{presentation.heroAccentFa}</em>}</h1>
            <p className="mt-8 max-w-xl text-base leading-9 text-muted sm:text-lg">{presentation?.heroDescriptionFa ?? "کالکشن‌ها را کشف کنید، جزئیات پوشاک را ببینید و استایل خود را بسازید."}</p>
            <a href="#rack" className="mt-10 inline-flex min-h-12 items-center gap-8 rounded-full bg-ink px-7 py-3 text-sm text-canvas transition-colors hover:bg-moss focus-visible:outline-2">{presentation?.heroCtaFa ?? "کالکشن‌ها"} <span aria-hidden="true" className="text-lg">←</span></a>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.heroRing} />
            <div className={styles.heroSeam} />
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={styles.heroLetter} width="1em" height="1em"><path d="M25 20a7 7 0 1 1 10 6l-3 2v6L9 47a3 3 0 0 0 1.5 5h43a3 3 0 0 0 1.5-5L32 34" /></svg>
            <span className={styles.heroIndex} dir="ltr">01 / ATELIER</span>
          </div>
          <div className="absolute bottom-5 left-0 right-0 flex justify-between border-t border-ink/15 pt-4 text-xs text-muted" aria-hidden="true"><span>پوشاک در حرکت</span><span dir="ltr">CLOTHING STORE © 2026</span></div>
        </section>
      </div>

      {!unavailable && rails.length > 0 && <GarmentRack rails={rails} />}

      <section id="collections" aria-labelledby="collections-title" className="bg-rack py-16 sm:py-24">
        <div className="mx-auto max-w-[1680px] px-5 sm:px-9 lg:px-16">
          <div className="mb-12 grid gap-6 border-b border-ink/15 pb-9 sm:grid-cols-[1fr_auto] sm:items-end">
            <div><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">CHAPTER 01 — COLLECTIONS</p><h2 id="collections-title" className="text-4xl font-medium sm:text-6xl">روی ریل فروشگاه</h2></div>
            <p className="max-w-sm text-sm leading-7 text-muted">هر کالکشن، مسیری برای کشف پوشاک است. انتخاب‌ها از کاتالوگ فروشگاه خوانده می‌شوند.</p>
          </div>
          {unavailable ? (
            <div role="status" className="rounded-2xl border border-ink/15 bg-canvas p-8 text-muted">کاتالوگ در حال حاضر در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.</div>
          ) : rails.length === 0 ? (
            <div role="status" className="rounded-2xl border border-ink/15 bg-canvas p-8 text-muted">هنوز کالکشنی منتشر نشده است.</div>
          ) : (
            <div className="grid gap-px overflow-hidden rounded-2xl border border-ink/15 bg-ink/15 md:grid-cols-2">
              {rails.map((rail, index) => (
                <article key={rail.id} className="flex min-h-75 flex-col justify-between bg-canvas p-7 sm:p-10">
                  <div className="flex items-start justify-between"><span className="text-xs tracking-[0.18em] text-muted" dir="ltr">{String(index + 1).padStart(2, "0")} / {String(rails.length).padStart(2, "0")}</span><span className="h-9 w-9 rounded-full border border-ink/20" aria-hidden="true" /></div>
                  <div><h3 className="mb-5 text-3xl font-medium sm:text-4xl">{rail.titleFa}</h3><p className="text-sm text-muted">{rail.items.length.toLocaleString("fa-IR")} پوشاک روی ریل</p>{rail.items.length > 0 && <p className="mt-4 line-clamp-1 text-xs text-muted">{rail.items.slice(0, 3).map((item) => item.nameFa).join(" · ")}</p>}</div>
                </article>
              ))}
            </div>
          )}
          {demo && <p className="mt-6 text-xs leading-6 text-muted">این کالکشن شامل محتوای نمایشی است. قیمت، موجودی و تصاویر اصلی تا زمان ورود و تأیید داده‌ها نمایش داده نمی‌شوند.</p>}
        </div>
      </section>
      <footer className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-5 px-5 py-10 text-xs text-muted sm:px-9 lg:px-16">
        <span className="font-serif text-lg tracking-[0.16em] text-ink" dir="ltr"><StoreMark /></span>
        <nav aria-label="اطلاعات فروشگاه" className="flex flex-wrap gap-4">{pageLinks.map((page) => <Link key={page.slug} href={`/pages/${encodeURIComponent(page.slug)}`} className="underline-offset-4 hover:underline">{page.title}</Link>)}</nav>
      </footer>
    </main>
  );
}
