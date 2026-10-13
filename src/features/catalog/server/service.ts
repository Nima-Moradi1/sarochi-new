import "server-only";
import { selectPublishedRails } from "./repository";
import type { RailQuery } from "../schemas";
import type { RailDTO, RailItemDTO } from "../types";
import { safeAssetUrl } from "./media";

export async function getPublishedRails(query: RailQuery): Promise<RailDTO[]> {
  const { railRows, categoryRows, itemRows, mediaRows } = await selectPublishedRails(query);
  const categoriesById = new Map(categoryRows.map((category) => [category.id, category]));
  const mediaByProduct = new Map<number, RailItemDTO["media"]>();
  for (const media of mediaRows) {
    const safeUrl = safeAssetUrl(media.url);
    if (!safeUrl) continue;
    const list = mediaByProduct.get(media.productId) ?? [];
    list.push({ url: safeUrl, angle: media.angle, confidence: media.confidence });
    mediaByProduct.set(media.productId, list);
  }
  const itemsByRail = new Map<number, RailItemDTO[]>();
  for (const item of itemRows) {
    const items = itemsByRail.get(item.railId) ?? [];
    items.push({
      id: item.id,
      slug: item.slug,
      nameFa: item.nameFa,
      garmentClass: item.garmentClass,
      sourceType: item.sourceType,
      position: item.position,
      media: mediaByProduct.get(item.id) ?? [],
    });
    itemsByRail.set(item.railId, items);
  }
  return railRows.map(({ categoryId, ...rail }) => {
    const categoryPath: RailDTO["categoryPath"] = [];
    const visited = new Set<number>();
    let category = categoryId === null ? undefined : categoriesById.get(categoryId);
    while (category && !visited.has(category.id)) {
      visited.add(category.id);
      categoryPath.unshift({ id: category.id, slug: category.slug, nameFa: category.nameFa });
      category = category.parentId === null ? undefined : categoriesById.get(category.parentId);
    }
    return { ...rail, themeId: rail.themeId === "CHALK" ? "CHALK" : rail.themeId === "PORCELAIN" ? "PORCELAIN" : null, categoryPath, items: itemsByRail.get(rail.id) ?? [] };
  });
}
