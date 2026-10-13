import "server-only";
import type { CartItemInput } from "../schemas";
import { buildCartQuote } from "../quote";
import { selectCartVariants } from "./repository";

export async function getCartQuote(items: CartItemInput[]) {
  const records = await selectCartVariants(items.map((item) => item.variantId));
  return buildCartQuote(items, records);
}
