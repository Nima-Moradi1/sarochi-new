export type VisualClass = "TSHIRT" | "SHIRT" | "KNIT" | "JACKET" | "PANTS" | "OTHER";

export function visualClass(value: string): VisualClass {
  return value === "TSHIRT" || value === "SHIRT" || value === "KNIT" || value === "JACKET" || value === "PANTS" ? value : "OTHER";
}

export function previewColor(hex: string | null | undefined) {
  return hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? { hex, verified: true } : { hex: "#68766c", verified: false };
}

export function previewSizeScale(label: string | null | undefined) {
  const normalized = label?.trim().toUpperCase();
  const illustrative: Record<string, number> = { S: 0.96, M: 1, L: 1.035, XL: 1.07, XXL: 1.105, XXXL: 1.14 };
  return normalized ? illustrative[normalized] ?? 1 : 1;
}
