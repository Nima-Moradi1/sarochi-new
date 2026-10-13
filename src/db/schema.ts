import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  primaryKey,
  text,
  uniqueIndex,
  varchar,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";

export const brands = mysqlTable("brands", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  nameFa: varchar("name_fa", { length: 160 }).notNull(),
  nameEn: varchar("name_en", { length: 160 }),
  settings: json("settings"),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const securityRateLimits = mysqlTable("security_rate_limits", {
  keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
  attempts: int("attempts").notNull(),
  resetAt: datetime("reset_at").notNull(),
}, (table) => [index("security_rate_limits_expiry_idx").on(table.resetAt)]);

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 24 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminSessions = mysqlTable("admin_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => adminUsers.id),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: datetime("expires_at").notNull(),
  revokedAt: datetime("revoked_at"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("admin_sessions_user_idx").on(table.userId)]);

export const adminAuditEvents = mysqlTable("admin_audit_events", {
  id: int("id").primaryKey().autoincrement(),
  actorUserId: int("actor_user_id").references(() => adminUsers.id),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 160 }),
  details: json("details"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("admin_audit_actor_idx").on(table.actorUserId), index("admin_audit_entity_idx").on(table.entityType, table.entityId)]);

export const cmsPages = mysqlTable("cms_pages", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 160 }).notNull(),
  locale: varchar("locale", { length: 12 }).notNull().default("fa-IR"),
  title: varchar("title", { length: 240 }).notNull(),
  body: text("body").notNull(),
  visibility: varchar("visibility", { length: 24 }).notNull().default("DRAFT"),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("cms_pages_slug_locale_unique").on(table.slug, table.locale)]);

export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  parentId: int("parent_id").references((): AnyMySqlColumn => categories.id, { onDelete: "set null" }),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  nameFa: varchar("name_fa", { length: 160 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  externalSourceId: varchar("external_source_id", { length: 160 }),
}, (table) => [index("categories_parent_idx").on(table.parentId)]);

export const collections = mysqlTable("collections", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  titleFa: varchar("title_fa", { length: 160 }).notNull(),
  editorialCopy: text("editorial_copy"),
  isPublished: boolean("is_published").notNull().default(false),
});

export const productFamilies = mysqlTable("product_families", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 160 }).notNull().unique(),
  titleFa: varchar("title_fa", { length: 200 }).notNull(),
  reviewStatus: varchar("review_status", { length: 24 }).notNull().default("PENDING"),
});

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  brandId: int("brand_id").references(() => brands.id),
  familyId: int("family_id").references(() => productFamilies.id, { onDelete: "set null" }),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  nameFa: varchar("name_fa", { length: 240 }).notNull(),
  description: text("description"),
  garmentClass: varchar("garment_class", { length: 48 }).notNull(),
  audience: varchar("audience", { length: 24 }).notNull().default("MEN"),
  status: varchar("status", { length: 24 }).notNull().default("DRAFT"),
  sourceType: varchar("source_type", { length: 24 }).notNull().default("DEMO"),
  sourceId: varchar("source_id", { length: 160 }),
  sourceUrl: varchar("source_url", { length: 1024 }),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("products_status_idx").on(table.status),
  uniqueIndex("products_source_unique").on(table.sourceType, table.sourceId),
]);

export const productCategories = mysqlTable("product_categories", {
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  categoryId: int("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.productId, table.categoryId] }),
  index("product_categories_category_idx").on(table.categoryId),
]);

export const productCollections = mysqlTable("product_collections", {
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  collectionId: int("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.productId, table.collectionId] })]);

export const colors = mysqlTable("colors", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  nameFa: varchar("name_fa", { length: 80 }).notNull(),
  hex: varchar("hex", { length: 7 }),
});

export const sizes = mysqlTable("sizes", {
  id: int("id").primaryKey().autoincrement(),
  label: varchar("label", { length: 24 }).notNull().unique(),
  sortOrder: int("sort_order").notNull(),
});

export const productVariants = mysqlTable("product_variants", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 120 }).unique(),
  colorId: int("color_id").references(() => colors.id),
  sizeId: int("size_id").references(() => sizes.id),
  regularPriceToman: int("regular_price_toman"),
  salePriceToman: int("sale_price_toman"),
  stockQty: int("stock_qty"),
  stockStatus: varchar("stock_status", { length: 24 }).notNull().default("UNKNOWN"),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("variants_product_idx").on(table.productId),
  index("variants_stock_price_idx").on(table.stockStatus, table.salePriceToman, table.regularPriceToman),
]);

export const assets = mysqlTable("assets", {
  id: int("id").primaryKey().autoincrement(),
  pathOrUrl: varchar("path_or_url", { length: 2048 }).notNull(),
  mime: varchar("mime", { length: 100 }).notNull(),
  sha256: varchar("sha256", { length: 64 }),
  width: int("width"),
  height: int("height"),
  sourceUrl: varchar("source_url", { length: 2048 }),
  provenance: varchar("provenance", { length: 32 }).notNull(),
  license: varchar("license", { length: 160 }),
  verificationStatus: varchar("verification_status", { length: 32 }).notNull().default("UNVERIFIED"),
  createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const productMedia = mysqlTable("product_media", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: int("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  assetId: int("asset_id").notNull().references(() => assets.id),
  viewAngle: varchar("view_angle", { length: 24 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  confidence: varchar("confidence", { length: 24 }).notNull().default("UNVERIFIED"),
}, (table) => [index("media_product_idx").on(table.productId)]);

export const rails = mysqlTable("rails", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  titleFa: varchar("title_fa", { length: 160 }).notNull(),
  categoryId: int("category_id").references(() => categories.id),
  collectionId: int("collection_id").references(() => collections.id),
  editorialCopy: text("editorial_copy"),
  themeId: varchar("theme_id", { length: 80 }),
  sortOrder: int("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
});

export const railItems = mysqlTable("rail_items", {
  railId: int("rail_id").notNull().references(() => rails.id, { onDelete: "cascade" }),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  position: int("position").notNull(),
  overrideAssetId: int("override_asset_id").references(() => assets.id, { onDelete: "set null" }),
}, (table) => [
  primaryKey({ columns: [table.railId, table.productId] }),
  uniqueIndex("rail_position_unique").on(table.railId, table.position),
]);

export const careGuides = mysqlTable("care_guides", {
  id: int("id").primaryKey().autoincrement(),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
  productId: int("product_id").references(() => products.id, { onDelete: "cascade" }),
  titleFa: varchar("title_fa", { length: 200 }).notNull(),
  instructionsFa: text("instructions_fa").notNull(),
  sourceUrl: varchar("source_url", { length: 1024 }),
});

export const sizeGuides = mysqlTable("size_guides", {
  id: int("id").primaryKey().autoincrement(),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "set null" }),
  productId: int("product_id").references(() => products.id, { onDelete: "cascade" }),
  titleFa: varchar("title_fa", { length: 200 }).notNull(),
  toleranceCm: decimal("tolerance_cm", { precision: 4, scale: 1 }),
  sourceUrl: varchar("source_url", { length: 1024 }),
});

export const sizeMeasurements = mysqlTable("size_measurements", {
  id: int("id").primaryKey().autoincrement(),
  guideId: int("guide_id").notNull().references(() => sizeGuides.id, { onDelete: "cascade" }),
  sizeId: int("size_id").notNull().references(() => sizes.id),
  metric: varchar("metric", { length: 80 }).notNull(),
  valueCm: decimal("value_cm", { precision: 6, scale: 1 }).notNull(),
}, (table) => [uniqueIndex("size_measurement_unique").on(table.guideId, table.sizeId, table.metric)]);

export const importJobs = mysqlTable("import_jobs", {
  id: int("id").primaryKey().autoincrement(),
  sourceKind: varchar("source_kind", { length: 24 }).notNull(),
  state: varchar("state", { length: 32 }).notNull().default("CREATED"),
  cursor: varchar("cursor", { length: 255 }),
  counters: json("counters"),
  startedAt: datetime("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importCandidates = mysqlTable("import_candidates", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id").notNull().references(() => importJobs.id, { onDelete: "cascade" }),
  sourceUrl: varchar("source_url", { length: 1024 }).notNull(),
  sourceUrlHash: varchar("source_url_hash", { length: 64 }).notNull(),
  sourceId: varchar("source_id", { length: 160 }),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull(),
  payload: json("payload").notNull(),
  issues: json("issues").notNull(),
  reviewStatus: varchar("review_status", { length: 32 }).notNull().default("PENDING_REVIEW"),
  collectedAt: datetime("collected_at").notNull(),
  approvedAt: datetime("approved_at"),
  reviewOverrides: json("review_overrides"),
  reviewedById: int("reviewed_by_id").references(() => adminUsers.id),
  committedProductId: int("committed_product_id").references(() => products.id, { onDelete: "set null" }),
}, (table) => [
  uniqueIndex("import_candidate_version_unique").on(table.jobId, table.sourceUrlHash, table.fingerprint),
  index("import_candidates_review_idx").on(table.jobId, table.reviewStatus),
]);

export const sourceObservations = mysqlTable("source_observations", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").references(() => products.id, { onDelete: "set null" }),
  sourceType: varchar("source_type", { length: 24 }).notNull(),
  sourceUrl: varchar("source_url", { length: 1024 }).notNull(),
  sourceUrlHash: varchar("source_url_hash", { length: 64 }).notNull(),
  field: varchar("field", { length: 64 }).notNull(),
  value: json("value").notNull(),
  confidence: varchar("confidence", { length: 24 }).notNull(),
  collectedAt: datetime("collected_at").notNull(),
  approvedAt: datetime("approved_at"),
}, (table) => [index("source_observations_source_idx").on(table.sourceUrlHash, table.field, table.collectedAt)]);

export const variantStylingMappings = mysqlTable("variant_styling_mappings", {
  variantId: int("variant_id").primaryKey().references(() => productVariants.id, { onDelete: "cascade" }),
  garmentClass: varchar("garment_class", { length: 48 }).notNull(),
  presetId: varchar("preset_id", { length: 40 }).notNull(),
  colorHex: varchar("color_hex", { length: 7 }),
  fidelity: varchar("fidelity", { length: 24 }).notNull().default("CONCEPTUAL"),
  updatedAt: datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
