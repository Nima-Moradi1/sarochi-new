"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RailDTO } from "@/features/catalog/types";
import { atelierMotion } from "@/design-system/motion";
import { boundedDragOffset, clampIndex, nextIndexAfterDrag } from "./gesture";
import { selectRackMedia } from "./media";
import styles from "./GarmentRack.module.css";

type Props = { rails: RailDTO[] };

function Hanger() {
  return (
    <svg viewBox="0 0 130 52" aria-hidden="true" className={styles.hanger}>
      <path d="M65 17c-8 0-8-12 0-12 6 0 9 4 8 9-1 5-8 8-8 14" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
      <path d="M62 24 14 45Q10 48 17 48h96q7 0 3-3L68 24q-3-2-6 0Z" fill="var(--hanger-wood)" stroke="var(--text-primary)" strokeWidth="1.2" />
    </svg>
  );
}

function RackStage({ rail }: { rail: RailDTO }) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [active, setActive] = useState(() => Math.floor(rail.items.filter((item) => item.media.length || item.cutoutUrl).length / 2));
  const [hovered, setHovered] = useState<number | null>(null);
  const [isolated, setIsolated] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [enteringMirror, setEnteringMirror] = useState(false);
  const itemButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();
  const slot = Math.max(85, Math.min(135, width * 0.14));
  const items = rail.items.filter((item) => item.media.length || item.cutoutUrl);
  const trackX = useSpring(-(active + 0.5) * slot, atelierMotion.trackSpring);
  const pointer = useRef<{ id: number; startX: number; startY: number; lastX: number; lastTime: number; velocityX: number; horizontal: boolean } | null>(null);
  const suppressClickUntil = useRef(0);
  const wheelAmount = useRef(0);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => setWidth(entries[0]?.contentRect.width ?? 900));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = -(active + 0.5) * slot;
    if (reduceMotion) trackX.jump(target);
    else trackX.set(target);
  }, [active, slot, reduceMotion, trackX]);

  const move = (step: number) => { setHovered(null); setShowBack(false); setActive((current) => clampIndex(current + step, items.length)); };
  const activeItem = items[active];
  const activeMedia = activeItem ? selectRackMedia(activeItem.media) : null;
  useEffect(() => {
    if (!enteringMirror || !activeItem) return;
    const timeout = window.setTimeout(() => router.push(`/style/${encodeURIComponent(activeItem.slug)}?from=rack`), reduceMotion ? 0 : atelierMotion.mirror * 1000);
    return () => window.clearTimeout(timeout);
  }, [enteringMirror, activeItem, reduceMotion, router]);
  const closeIsolation = () => {
    setEnteringMirror(false);
    setIsolated(false);
    setShowBack(false);
    requestAnimationFrame(() => itemButtons.current[active]?.focus());
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastTime: event.timeStamp, velocityX: 0, horizontal: false };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = pointer.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.horizontal) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { pointer.current = null; return; }
      if (Math.abs(dx) <= 8 || Math.abs(dx) <= Math.abs(dy)) return;
      gesture.horizontal = true;
      setHovered(null);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    gesture.velocityX = (event.clientX - gesture.lastX) / Math.max(1, event.timeStamp - gesture.lastTime) * 1000;
    gesture.lastX = event.clientX;
    gesture.lastTime = event.timeStamp;
    const base = -(active + 0.5) * slot;
    trackX.jump(base + boundedDragOffset(active, items.length, dx));
  };
  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const gesture = pointer.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    pointer.current = null;
    if (!gesture.horizontal) return;
    suppressClickUntil.current = event.timeStamp + 450;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const dx = event.clientX - gesture.startX;
    const velocity = event.timeStamp - gesture.lastTime < 80 ? gesture.velocityX : 0;
    const target = cancelled ? active : nextIndexAfterDrag(active, items.length, slot, dx, velocity);
    setActive(target);
    const targetX = -(target + 0.5) * slot;
    if (reduceMotion) trackX.jump(targetX);
    else trackX.set(targetX);
  };
  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 3) return;
    wheelAmount.current += event.deltaX;
    if (Math.abs(wheelAmount.current) >= 60) {
      move(Math.sign(wheelAmount.current));
      wheelAmount.current = 0;
    }
  };

  return (
    <div>
      <div ref={stageRef} className={styles.stage} data-isolated={isolated} onPointerDown={isolated ? undefined : onPointerDown} onPointerMove={isolated ? undefined : onPointerMove} onPointerUp={isolated ? undefined : (event) => finishPointer(event, false)} onPointerCancel={isolated ? undefined : (event) => finishPointer(event, true)} onClickCapture={(event) => { if (event.timeStamp < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); suppressClickUntil.current = 0; } }} onWheel={isolated ? undefined : onWheel} onKeyDown={(event) => {
        if (event.key === "Escape" && isolated) { event.preventDefault(); closeIsolation(); return; }
        if (isolated) return;
        if (event.key === "ArrowLeft") { event.preventDefault(); move(1); }
        if (event.key === "ArrowRight") { event.preventDefault(); move(-1); }
        if (event.key === "Home") { event.preventDefault(); setActive(0); }
        if (event.key === "End") { event.preventDefault(); setActive(items.length - 1); }
      }}>
        <div className={styles.rod} aria-hidden="true" />
        <motion.div className={styles.track} style={{ x: trackX, pointerEvents: isolated ? "none" : "auto" }} animate={{ opacity: isolated ? 0.12 : 1 }} transition={{ duration: reduceMotion ? 0 : atelierMotion.fade }} aria-hidden={isolated} inert={isolated}>
          {items.map((item, index) => {
            const media = selectRackMedia(item.media).front;
            const selected = index === hovered;
            const clearance = hovered === null || index === hovered ? 0 : (index < hovered ? -1 : 1) * (width < 600 ? 68 : 95);
            return (
              <motion.div key={item.id} className={styles.slot} style={{ width: slot, zIndex: selected ? 4 : 1 }} animate={{ x: clearance }} transition={reduceMotion ? { duration: 0 } : atelierMotion.garmentSpring}>
                <button ref={(element) => { itemButtons.current[index] = element; }} type="button" className={styles.garmentControl} data-product-id={item.id} data-facing={selected ? "front" : "side"} aria-label={`${item.nameFa}، ${index + 1} از ${items.length}`} aria-current={index === active ? "true" : undefined} onPointerEnter={(event) => { if (event.pointerType === "mouse" && !pointer.current?.horizontal) setHovered(index); }} onPointerLeave={() => setHovered((current) => current === index ? null : current)} onPointerDown={(event) => { if (event.pointerType !== "mouse") setHovered(index); }} onPointerUp={(event) => { if (event.pointerType !== "mouse") setHovered(null); }} onPointerCancel={() => setHovered(null)} onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) { setActive(index); setHovered(index); } }} onBlur={() => setHovered(null)} onClick={(event) => { setActive(index); if (event.detail === 0) setIsolated(true); }}>
                  <motion.span className={styles.hangingAssembly} animate={{ rotateY: selected ? 0 : 72, rotateZ: selected ? 0 : -2, z: selected ? 38 : 0 }} transition={reduceMotion ? { duration: 0 } : atelierMotion.garmentSpring}>
                    <Hanger />
                    <span className={styles.garment}><Image src={item.cutoutUrl ?? media!.url} alt={item.nameFa} fill sizes="(max-width: 767px) 200px, 285px" unoptimized draggable={false} className={styles.productImage} /></span>
                  </motion.span>
                </button>
                <span className={styles.garmentLabel}>{selected || index === active ? item.nameFa : ""}</span>
              </motion.div>
            );
          })}
        </motion.div>
        <div className={`${styles.fadeEdge} ${styles.fadeStart}`} aria-hidden="true" />
        <div className={`${styles.fadeEdge} ${styles.fadeEnd}`} aria-hidden="true" />
        <AnimatePresence>
          {isolated && activeItem && (
            <motion.div className={styles.isolation} role="region" aria-label={`نمای نزدیک ${activeItem.nameFa}`} initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }} transition={{ duration: reduceMotion ? 0 : atelierMotion.isolate }}>
              <button type="button" autoFocus onClick={closeIsolation} aria-label="بازگشت به ریل" className="absolute top-5 right-5 z-10 grid h-11 w-11 place-items-center rounded-full border border-ink/30 bg-canvas text-xl">×</button>
              <motion.div className={styles.mirrorThreshold} aria-hidden="true" initial={false} animate={{ opacity: enteringMirror ? 1 : 0, scale: enteringMirror ? 1 : 0.75 }} transition={{ duration: reduceMotion ? 0 : atelierMotion.mirror }} />
              <motion.div className={styles.isolatedHanger} animate={{ y: enteringMirror ? -35 : 0, opacity: enteringMirror ? 0 : 1 }} transition={{ duration: reduceMotion ? 0 : atelierMotion.mirror }}><Hanger /></motion.div>
              <motion.div className={styles.flipPerspective} animate={{ y: enteringMirror ? -18 : 0, scale: enteringMirror ? 0.72 : 1, opacity: enteringMirror ? 0.18 : 1 }} transition={{ duration: reduceMotion ? 0 : atelierMotion.mirror }}>
                <motion.div className={styles.flipCard} animate={{ rotateY: showBack ? 180 : 0 }} transition={{ duration: reduceMotion ? 0 : atelierMotion.flip }}>
                  <div className={styles.flipFace}>
                    {(activeItem.cutoutUrl || activeMedia?.front) && <Image src={activeItem.cutoutUrl ?? activeMedia!.front!.url} alt={activeItem.nameFa} fill sizes="(max-width: 767px) 260px, 400px" unoptimized draggable={false} className={styles.productImage} />}
                  </div>
                  {activeMedia?.back && <div className={`${styles.flipFace} ${styles.flipBack}`}><Image src={activeMedia.back.url} alt={`نمای پشت ${activeItem.nameFa}`} fill sizes="(max-width: 767px) 260px, 400px" unoptimized draggable={false} className={styles.productImage} /></div>}
                </motion.div>
              </motion.div>
              <div className={styles.isolationDetails}>
                <div><p className="font-medium">{activeItem.nameFa}</p></div>
                <div className="flex flex-wrap gap-2">{activeMedia?.back && <button type="button" onClick={() => setShowBack((value) => !value)} disabled={enteringMirror} className="min-h-11 rounded-full border border-ink/30 bg-canvas px-5 disabled:opacity-60">{showBack ? "نمای جلو" : "نمای پشت"}</button>}<Link href={`/products/${encodeURIComponent(activeItem.slug)}`} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-canvas">مشاهده محصول</Link><button type="button" disabled={enteringMirror} onClick={() => setEnteringMirror(true)} className="min-h-11 rounded-full border border-ink/30 bg-canvas px-5 disabled:opacity-60">{enteringMirror ? "ورود به اتاق استایل…" : "ورود به اتاق استایل"}</button></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 py-5">
        <div className="flex items-center gap-3" dir="ltr">
          <button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label="پوشاک قبلی" className="grid h-11 w-11 place-items-center rounded-full border border-ink/25 text-lg disabled:opacity-30">←</button>
          <span className="min-w-16 text-center text-xs tabular-nums" aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => move(1)} disabled={active === items.length - 1} aria-label="پوشاک بعدی" className="grid h-11 w-11 place-items-center rounded-full border border-ink/25 text-lg disabled:opacity-30">→</button>
        </div>
        <div className="flex flex-wrap items-center gap-4"><p className="text-sm text-muted" aria-live="polite">{activeItem?.nameFa ?? "محصولی روی این ریل نیست"}</p><button type="button" onClick={() => setIsolated(true)} className="min-h-11 rounded-full border border-ink/30 px-5 text-sm">نمای نزدیک</button></div>
      </div>
    </div>
  );
}

export function GarmentRack({ rails }: Props) {
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [railId, setRailId] = useState(rails[0]?.id);
  const selectedRail = rails.find((rail) => rail.id === railId) ?? rails[0];
  if (!selectedRail) return null;
  const categoryGroups = new Map<number, { nameFa: string; rails: RailDTO[] }>();
  for (const rail of rails) {
    const root = rail.categoryPath[0];
    const group = categoryGroups.get(root?.id ?? 0) ?? { nameFa: root?.nameFa ?? "کالکشن‌های منتخب", rails: [] };
    group.rails.push(rail);
    categoryGroups.set(root?.id ?? 0, group);
  }
  const selectedGroupId = selectedRail.categoryPath[0]?.id ?? 0;
  const hasHierarchy = rails.some((rail) => rail.categoryPath.length > 1);
  const groupRails = hasHierarchy ? categoryGroups.get(selectedGroupId)?.rails ?? rails : rails;
  return (
    <section data-theme={selectedRail.themeId ?? undefined} id="rack" aria-labelledby="rack-title" data-hydrated={hydrated} className="bg-rack py-16 sm:py-24">
      <div className="mx-auto max-w-[1680px] px-5 sm:px-9 lg:px-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6"><div><p className="mb-4 text-xs tracking-[0.15em] text-moss" dir="ltr">CHAPTER 02 — THE RAIL</p><h2 id="rack-title" className="text-4xl font-medium sm:text-6xl">کالکشن در حرکت</h2></div><p className="max-w-sm text-sm leading-7 text-muted">برای دیدن هر پوشاک، آن را انتخاب کنید یا از دکمه‌های کنار ریل کمک بگیرید.</p></div>
        {hasHierarchy && categoryGroups.size > 1 && <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="انتخاب دسته اصلی">{Array.from(categoryGroups, ([id, group]) => <button key={id} type="button" onClick={() => setRailId(group.rails[0].id)} aria-label={`دسته اصلی: ${group.nameFa}`} aria-pressed={id === selectedGroupId} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm aria-pressed:bg-ink aria-pressed:text-canvas">{group.nameFa}</button>)}</div>}
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="انتخاب کالکشن">
          {groupRails.map((rail) => <button key={rail.id} type="button" onClick={() => setRailId(rail.id)} aria-pressed={rail.id === selectedRail.id} aria-label={[...rail.categoryPath.map((category) => category.nameFa), rail.titleFa].join(" / ")} className="min-h-11 rounded-full border border-ink/20 px-5 text-sm aria-pressed:bg-ink aria-pressed:text-canvas">{rail.titleFa}</button>)}
        </div>
        {selectedRail.categoryPath.length > 0 && <nav aria-label="مسیر دسته‌بندی کالکشن" className="mb-6 text-xs text-muted"><ol className="flex flex-wrap items-center gap-2">{selectedRail.categoryPath.map((category, index) => <li key={category.id} className="flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}<span aria-current={index === selectedRail.categoryPath.length - 1 ? "location" : undefined}>{category.nameFa}</span></li>)}</ol></nav>}
        {selectedRail.editorialCopy && <p className="mb-6 max-w-2xl text-sm leading-7 text-muted">{selectedRail.editorialCopy}</p>}
        {selectedRail.items.length > 0 ? <RackStage key={selectedRail.id} rail={selectedRail} /> : <p className="rounded-2xl border border-ink/15 p-8 text-muted">هنوز پوشاکی روی این ریل منتشر نشده است.</p>}
        {selectedRail.items.some((item) => item.sourceType === "DEMO") && <p className="mt-3 text-xs leading-6 text-muted">بخشی از پوشاک این ریل نمونه نمایشی است و تصویر مفهومی آن نمای محصول واقعی نیست.</p>}
      </div>
    </section>
  );
}
