"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductDetailDTO } from "./types";
import { GarmentSilhouette } from "@/features/rack/GarmentSilhouette";

type Props = Pick<ProductDetailDTO, "nameFa" | "garmentClass" | "media">;

function angleLabel(angle: string, confidence: string) {
  if (confidence !== "VERIFIED") return "زاویه تأیید نشده";
  if (angle === "FRONT") return "نمای جلو";
  if (angle === "BACK") return "نمای پشت";
  if (angle === "SIDE") return "نمای کنار";
  return "زاویه تأیید نشده";
}

export function ProductGallery({ nameFa, garmentClass, media }: Props) {
  const preferred = media.find((item) => item.angle === "FRONT" && item.confidence === "VERIFIED") ?? media[0];
  const [selectedId, setSelectedId] = useState(preferred?.id);
  const selected = media.find((item) => item.id === selectedId) ?? preferred;
  return (
    <div>
      <div className="relative grid aspect-[4/5] max-h-[700px] place-items-center overflow-hidden rounded-3xl bg-rack p-8">
        {selected ? <Image src={selected.url} alt={`${nameFa} — ${angleLabel(selected.angle, selected.confidence)}`} fill sizes="(max-width: 1023px) 90vw, 48vw" unoptimized className="object-contain p-5 sm:p-10" /> : <div className="h-[85%] w-[85%] max-w-105"><GarmentSilhouette garmentClass={garmentClass} /></div>}
        <span className="absolute bottom-5 right-5 rounded-full bg-canvas/90 px-4 py-2 text-xs text-muted">{selected ? angleLabel(selected.angle, selected.confidence) : "نمای مفهومی — تصویر محصول نیست"}</span>
      </div>
      {media.length > 1 && <div className="mt-4 flex gap-3 overflow-x-auto pb-2" role="group" aria-label="گالری تصاویر محصول">
        {media.map((item, index) => <button key={item.id} type="button" aria-label={`تصویر ${index + 1}، ${angleLabel(item.angle, item.confidence)}`} aria-pressed={item.id === selected?.id} onClick={() => setSelectedId(item.id)} className="relative h-22 w-18 shrink-0 overflow-hidden rounded-xl border border-ink/20 bg-rack aria-pressed:ring-2 aria-pressed:ring-moss"><Image src={item.url} alt="" fill sizes="72px" unoptimized className="object-contain p-1" /></button>)}
      </div>}
    </div>
  );
}
