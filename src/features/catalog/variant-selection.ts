import type { ProductDetailDTO } from "./types";

type Variant = ProductDetailDTO["variants"][number];

export function variantForColor(variants: Variant[], colorSlug: string, currentSize: string | null) {
  const sameColor = variants.filter((item) => item.color?.slug === colorSlug);
  return sameColor.find((item) => item.size?.label === currentSize) ?? sameColor[0] ?? null;
}

export function variantForSize(variants: Variant[], sizeLabel: string, currentColor: string | null) {
  return variants.find((item) => item.size?.label === sizeLabel && item.color?.slug === currentColor) ?? null;
}
