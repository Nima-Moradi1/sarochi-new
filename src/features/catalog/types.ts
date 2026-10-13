export type RailItemDTO = {
  id: number;
  slug: string;
  nameFa: string;
  garmentClass: string;
  sourceType: string;
  position: number;
  media: Array<{ url: string; angle: string; confidence: string }>;
};

export type RailDTO = {
  id: number;
  slug: string;
  titleFa: string;
  categoryPath: Array<{ id: number; slug: string; nameFa: string }>;
  themeId: "PORCELAIN" | "CHALK" | null;
  editorialCopy: string | null;
  items: RailItemDTO[];
};

export type ProductCardDTO = {
  id: number;
  slug: string;
  nameFa: string;
  garmentClass: string;
  sourceType: string;
  minPriceToman: number | null;
  stock: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
  imageUrl: string | null;
  imageAngleVerified: boolean;
};

export type ProductPageDTO = { items: ProductCardDTO[]; nextCursor: number | string | null };

export type CatalogFacetsDTO = {
  categories: Array<{ slug: string; label: string; count: number }>;
  colors: Array<{ slug: string; label: string; count: number }>;
  sizes: Array<{ label: string; count: number }>;
};

export type ProductDetailDTO = {
  id: number;
  slug: string;
  nameFa: string;
  description: string | null;
  garmentClass: string;
  sourceType: string;
  categories: Array<{ slug: string; nameFa: string }>;
  variants: Array<{
    id: number;
    sku: string | null;
    color: { slug: string; nameFa: string; hex: string | null } | null;
    size: { label: string; sortOrder: number } | null;
    regularPriceToman: number | null;
    salePriceToman: number | null;
    stockQty: number | null;
  }>;
  media: Array<{ id: number; url: string; angle: string; confidence: string; provenance: string }>;
  care: Array<{ titleFa: string; instructionsFa: string }>;
  sizeGuide: { titleFa: string; toleranceCm: string | null; measurements: Array<{ size: string; metric: string; valueCm: string }> } | null;
  related: Array<{ id: number; slug: string; nameFa: string }>;
};
