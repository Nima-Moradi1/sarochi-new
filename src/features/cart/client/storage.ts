import type { CartItemInput } from "../schemas";

const key = "sarochi-demo-cart-v1";

export function readCartItems(): CartItemInput[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<number>();
    return parsed.flatMap((value): CartItemInput[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      if (!Number.isInteger(item.variantId) || Number(item.variantId) <= 0 || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 10 || seen.has(Number(item.variantId)) || seen.size >= 20) return [];
      const variantId = Number(item.variantId);
      seen.add(variantId);
      return [{ variantId, quantity: Number(item.quantity) }];
    });
  } catch { return []; }
}

export function writeCartItems(items: CartItemInput[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new Event("sarochi-cart-update"));
    return true;
  } catch { return false; }
}

export function addCartItem(variantId: number) {
  const items = readCartItems();
  const existing = items.find((item) => item.variantId === variantId);
  if (existing) {
    if (existing.quantity >= 10) return false;
    existing.quantity += 1;
  } else {
    if (items.length >= 20) return false;
    items.push({ variantId, quantity: 1 });
  }
  return writeCartItems(items);
}
