// Presentation only: keep original source records and URLs intact.
export function storefrontCopy(text: string): string {
  return text.replace(/ساروچی/g, "فروشگاه").replace(/sarochi/gi, "Store");
}
