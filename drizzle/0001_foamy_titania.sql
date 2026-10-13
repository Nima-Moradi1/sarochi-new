CREATE TABLE `care_guides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int,
	`product_id` int,
	`title_fa` varchar(200) NOT NULL,
	`instructions_fa` text NOT NULL,
	`source_url` varchar(1024),
	CONSTRAINT `care_guides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cms_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`locale` varchar(12) NOT NULL DEFAULT 'fa-IR',
	`title` varchar(240) NOT NULL,
	`body` text NOT NULL,
	`visibility` varchar(24) NOT NULL DEFAULT 'DRAFT',
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `cms_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_pages_slug_locale_unique` UNIQUE(`slug`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title_fa` varchar(160) NOT NULL,
	`editorial_copy` text,
	`is_published` boolean NOT NULL DEFAULT false,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `collections_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_collections` (
	`product_id` int NOT NULL,
	`collection_id` int NOT NULL,
	CONSTRAINT `product_collections_product_id_collection_id_pk` PRIMARY KEY(`product_id`,`collection_id`)
);
--> statement-breakpoint
CREATE TABLE `product_families` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(160) NOT NULL,
	`title_fa` varchar(200) NOT NULL,
	`review_status` varchar(24) NOT NULL DEFAULT 'PENDING',
	CONSTRAINT `product_families_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_families_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `size_guides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int,
	`product_id` int,
	`title_fa` varchar(200) NOT NULL,
	`tolerance_cm` decimal(4,1),
	`source_url` varchar(1024),
	CONSTRAINT `size_guides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `size_measurements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guide_id` int NOT NULL,
	`size_id` int NOT NULL,
	`metric` varchar(80) NOT NULL,
	`value_cm` decimal(6,1) NOT NULL,
	CONSTRAINT `size_measurements_id` PRIMARY KEY(`id`),
	CONSTRAINT `size_measurement_unique` UNIQUE(`guide_id`,`size_id`,`metric`)
);
--> statement-breakpoint
ALTER TABLE `assets` ADD `sha256` varchar(64);--> statement-breakpoint
ALTER TABLE `assets` ADD `width` int;--> statement-breakpoint
ALTER TABLE `assets` ADD `height` int;--> statement-breakpoint
ALTER TABLE `assets` ADD `created_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `brands` ADD `settings` json;--> statement-breakpoint
ALTER TABLE `categories` ADD `external_source_id` varchar(160);--> statement-breakpoint
ALTER TABLE `product_media` ADD `confidence` varchar(24) DEFAULT 'UNVERIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE `product_variants` ADD `updated_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `brand_id` int;--> statement-breakpoint
ALTER TABLE `products` ADD `family_id` int;--> statement-breakpoint
ALTER TABLE `products` ADD `audience` varchar(24) DEFAULT 'MEN' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `source_id` varchar(160);--> statement-breakpoint
ALTER TABLE `rail_items` ADD `override_asset_id` int;--> statement-breakpoint
ALTER TABLE `rails` ADD `collection_id` int;--> statement-breakpoint
ALTER TABLE `rails` ADD `editorial_copy` text;--> statement-breakpoint
ALTER TABLE `rails` ADD `theme_id` varchar(80);--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_source_unique` UNIQUE(`source_type`,`source_id`);--> statement-breakpoint
ALTER TABLE `care_guides` ADD CONSTRAINT `care_guides_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `care_guides` ADD CONSTRAINT `care_guides_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_collections` ADD CONSTRAINT `product_collections_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_collections` ADD CONSTRAINT `product_collections_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `size_guides` ADD CONSTRAINT `size_guides_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `size_guides` ADD CONSTRAINT `size_guides_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `size_measurements` ADD CONSTRAINT `size_measurements_guide_id_size_guides_id_fk` FOREIGN KEY (`guide_id`) REFERENCES `size_guides`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `size_measurements` ADD CONSTRAINT `size_measurements_size_id_sizes_id_fk` FOREIGN KEY (`size_id`) REFERENCES `sizes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_categories_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_brand_id_brands_id_fk` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_family_id_product_families_id_fk` FOREIGN KEY (`family_id`) REFERENCES `product_families`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rail_items` ADD CONSTRAINT `rail_items_override_asset_id_assets_id_fk` FOREIGN KEY (`override_asset_id`) REFERENCES `assets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rails` ADD CONSTRAINT `rails_collection_id_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON DELETE no action ON UPDATE no action;