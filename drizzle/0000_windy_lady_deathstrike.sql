CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`path_or_url` varchar(2048) NOT NULL,
	`mime` varchar(100) NOT NULL,
	`source_url` varchar(2048),
	`provenance` varchar(32) NOT NULL,
	`license` varchar(160),
	`verification_status` varchar(32) NOT NULL DEFAULT 'UNVERIFIED',
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name_fa` varchar(160) NOT NULL,
	`name_en` varchar(160),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `brands_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parent_id` int,
	`slug` varchar(160) NOT NULL,
	`name_fa` varchar(160) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT false,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `colors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name_fa` varchar(80) NOT NULL,
	`hex` varchar(7),
	CONSTRAINT `colors_id` PRIMARY KEY(`id`),
	CONSTRAINT `colors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`product_id` int NOT NULL,
	`category_id` int NOT NULL,
	CONSTRAINT `product_categories_product_id_category_id_pk` PRIMARY KEY(`product_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `product_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`variant_id` int,
	`asset_id` int NOT NULL,
	`view_angle` varchar(24) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_primary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `product_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`sku` varchar(120),
	`color_id` int,
	`size_id` int,
	`regular_price_toman` int,
	`sale_price_toman` int,
	`stock_qty` int,
	`stock_status` varchar(24) NOT NULL DEFAULT 'UNKNOWN',
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(200) NOT NULL,
	`name_fa` varchar(240) NOT NULL,
	`description` text,
	`garment_class` varchar(48) NOT NULL,
	`status` varchar(24) NOT NULL DEFAULT 'DRAFT',
	`source_type` varchar(24) NOT NULL DEFAULT 'DEMO',
	`source_url` varchar(1024),
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `rail_items` (
	`rail_id` int NOT NULL,
	`product_id` int NOT NULL,
	`position` int NOT NULL,
	CONSTRAINT `rail_items_rail_id_product_id_pk` PRIMARY KEY(`rail_id`,`product_id`),
	CONSTRAINT `rail_position_unique` UNIQUE(`rail_id`,`position`)
);
--> statement-breakpoint
CREATE TABLE `rails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`title_fa` varchar(160) NOT NULL,
	`category_id` int,
	`sort_order` int NOT NULL DEFAULT 0,
	`is_published` boolean NOT NULL DEFAULT false,
	CONSTRAINT `rails_id` PRIMARY KEY(`id`),
	CONSTRAINT `rails_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(24) NOT NULL,
	`sort_order` int NOT NULL,
	CONSTRAINT `sizes_id` PRIMARY KEY(`id`),
	CONSTRAINT `sizes_label_unique` UNIQUE(`label`)
);
--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_media` ADD CONSTRAINT `product_media_asset_id_assets_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_color_id_colors_id_fk` FOREIGN KEY (`color_id`) REFERENCES `colors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_size_id_sizes_id_fk` FOREIGN KEY (`size_id`) REFERENCES `sizes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rail_items` ADD CONSTRAINT `rail_items_rail_id_rails_id_fk` FOREIGN KEY (`rail_id`) REFERENCES `rails`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rail_items` ADD CONSTRAINT `rail_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rails` ADD CONSTRAINT `rails_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `media_product_idx` ON `product_media` (`product_id`);--> statement-breakpoint
CREATE INDEX `variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);