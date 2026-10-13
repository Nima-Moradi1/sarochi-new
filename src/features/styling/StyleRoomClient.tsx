"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { motion } from "motion/react";
import { GarmentSilhouette } from "@/features/rack/GarmentSilhouette";
import type { ProductDetailDTO } from "@/features/catalog/types";
import { variantForColor, variantForSize } from "@/features/catalog/variant-selection";
import type { StylingPreset } from "@/features/content/brand-settings";
import { previewColor, previewSizeScale, visualClass } from "./preview";
import type { StylingMappingDTO } from "./mapping";
import { atelierMotion } from "@/design-system/motion";

const AvatarScene = dynamic(() => import("./AvatarScene"), { ssr: false, loading: () => <div role="status" className="grid h-full place-items-center text-sm text-muted">در حال آماده‌سازی صحنه سه‌بعدی…</div> });

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Fallback({ garmentClass }: { garmentClass: string }) {
  return <div className="grid h-full place-items-center bg-rack p-8 text-center"><div><div className="mx-auto h-70 w-56"><GarmentSilhouette garmentClass={garmentClass} /></div><p className="mt-4 text-sm text-muted">نمای سه‌بعدی در این دستگاه در دسترس نیست. این تصویر فقط نمادین است.</p></div></div>;
}

type Variant = ProductDetailDTO["variants"][number];

export function StyleRoomClient({ nameFa, garmentClass, variants, presets, mappings }: { nameFa: string; garmentClass: string; variants: Variant[]; presets: StylingPreset[]; mappings: StylingMappingDTO[] }) {
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = variants.find((item) => item.id === Number(searchParams.get("variant"))) ?? variants[0];
  const colors = [...new Map(variants.filter((item) => item.color).map((item) => [item.color!.slug, item.color!])).values()];
  const sizes = [...new Map(variants.filter((item) => item.size).map((item) => [item.size!.label, item.size!])).values()].sort((a, b) => a.sortOrder - b.sortOrder);
  const mapping = mappings.find((item) => item.variantId === selected?.id);
  const previewClass = mapping?.garmentClass ?? garmentClass;
  const color = previewColor(mapping?.colorHex ?? selected?.color?.hex);
  const sizeScale = previewSizeScale(selected?.size?.label);
  const choose = (variant: Variant) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", String(variant.id));
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  const [supported, setSupported] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);
  const presetId = searchParams.get("avatar") ?? mapping?.presetId;
  const preset = presets.find((item) => item.id === presetId) ?? presets.find((item) => item.id === mapping?.presetId) ?? presets[0] ?? null;
  const choosePreset = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("avatar", id);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  const [paused, setPaused] = useState(false);
  const [turn, setTurn] = useState(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
        setSupported(Boolean(context));
        context?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch { setSupported(false); }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const element = container.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const lost = (event: Event) => { event.preventDefault(); setSupported(false); };
    element.addEventListener("webglcontextlost", lost, true);
    return () => element.removeEventListener("webglcontextlost", lost, true);
  }, []);
  return <div><motion.div ref={container} role="region" aria-label={`پیش‌نمایش سه‌بعدی تقریبی ${nameFa}`} className="relative h-[min(68svh,700px)] min-h-100 overflow-hidden rounded-3xl bg-rack" initial={searchParams.get("from") === "rack" && !reduceMotion ? { opacity: 0.5, scale: 0.94 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : atelierMotion.flip }}>
    {supported === null ? <div role="status" className="grid h-full place-items-center text-sm text-muted">در حال بررسی امکان نمایش سه‌بعدی…</div> : !supported ? <Fallback garmentClass={previewClass} /> : <SceneBoundary fallback={<Fallback garmentClass={previewClass} />}><AvatarScene preset={preset} turn={turn} still={paused || Boolean(reduceMotion)} visible={visible} garmentClass={visualClass(previewClass)} garmentColor={color.hex} garmentScale={sizeScale} /></SceneBoundary>}
    <span className="absolute bottom-4 right-4 rounded-full bg-canvas/90 px-4 py-2 text-xs text-muted">مدل مفهومی، نه تصویر سه‌بعدی دقیق محصول</span>
  </motion.div><div className="mt-5 flex flex-wrap items-center justify-between gap-5"><div className="flex flex-wrap gap-2" role="group" aria-label="فرم نمایشی مدل">{presets.map((item) => <button key={item.id} type="button" aria-pressed={preset?.id === item.id} onClick={() => choosePreset(item.id)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm aria-pressed:bg-ink aria-pressed:text-canvas">{item.labelFa}</button>)}{!presets.length && <p role="status" className="text-sm text-muted">فرم‌های استایل هنوز تنظیم نشده‌اند؛ مدل پایه فقط نمادین است.</p>}{!reduceMotion && <button type="button" aria-pressed={paused} onClick={() => setPaused((value) => !value)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm">{paused ? "ادامه حرکت" : "توقف حرکت"}</button>}{reduceMotion && <p className="text-xs text-muted">حرکت خودکار غیرفعال است.</p>}</div><div className="flex gap-2" role="group" aria-label="چرخاندن مدل"><button type="button" onClick={() => setTurn((value) => value - 1)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm">چرخش به راست</button><button type="button" onClick={() => setTurn((value) => value + 1)} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm">چرخش به چپ</button></div></div>
    {selected && <div className="mt-7 grid gap-5 sm:grid-cols-2">
      {colors.length > 0 && <fieldset><legend className="mb-2 text-sm font-medium">رنگ · {selected.color?.nameFa ?? "نامشخص"}</legend><div className="flex flex-wrap gap-2">{colors.map((item) => { const match = variantForColor(variants, item.slug, selected.size?.label ?? null); return <button key={item.slug} type="button" disabled={!match} aria-pressed={selected.color?.slug === item.slug} onClick={() => { if (match) choose(match); }} className="min-h-11 rounded-full border border-ink/25 px-4 text-sm disabled:opacity-40 aria-pressed:bg-ink aria-pressed:text-canvas">{item.nameFa}</button>; })}</div></fieldset>}
      {sizes.length > 0 && <fieldset><legend className="mb-2 text-sm font-medium">سایز · {selected.size?.label ?? "نامشخص"}</legend><div className="flex flex-wrap gap-2">{sizes.map((item) => { const match = variantForSize(variants, item.label, selected.color?.slug ?? null); return <button key={item.label} type="button" disabled={!match} aria-pressed={selected.size?.label === item.label} onClick={() => { if (match) choose(match); }} className="min-h-11 min-w-12 rounded-full border border-ink/25 px-4 text-sm disabled:opacity-40 aria-pressed:bg-ink aria-pressed:text-canvas">{item.label}</button>; })}</div></fieldset>}
    </div>}
    <p role="status" className="mt-5 text-xs leading-6 text-muted">{selected ? `تنوع انتخابی: ${selected.color?.nameFa ?? "رنگ نامشخص"} / ${selected.size?.label ?? "سایز نامشخص"}.` : "تنوعی برای این محصول ثبت نشده است."} {mapping ? "نگاشت سه‌بعدی این تنوع توسط مدیر ثبت شده و فقط مفهومی است." : "نگاشت اختصاصی ثبت نشده؛ شکل کلی دسته محصول نمایش داده می‌شود."} {mapping?.colorHex ? "رنگ مدل از تنظیم مفهومی مدیر گرفته شده و تضمین رنگ واقعی نیست." : color.verified ? "رنگ نمایش از کد رنگ ثبت‌شده گرفته شده است." : "کد رنگ ثبت نشده؛ رنگ مدل خنثی و مفهومی است."} {mapping && !presets.some((item) => item.id === mapping.presetId) && "فرم ثبت‌شده دیگر فعال نیست؛ فرم پایه نمایش داده می‌شود."} تغییر سایز در این مدل فقط نسبت تصویر را عوض می‌کند و پیش‌بینی اندازه یا فیت واقعی نیست.</p>
    <p className="mt-5 text-sm leading-7 text-muted">پیش‌نمایش سه‌بعدی تقریبی است و جایگزین پرو یا راهنمای سایز نیست. مدل و پوشاک بازسازی مفهومی‌اند؛ جزئیات پارچه و اندازه واقعی را از تصویر و راهنمای محصول بررسی کنید.</p></div>;
}
