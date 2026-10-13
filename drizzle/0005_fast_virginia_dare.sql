ALTER TABLE `import_candidates` ADD `review_overrides` json;--> statement-breakpoint
ALTER TABLE `import_candidates` ADD `reviewed_by_id` int;--> statement-breakpoint
ALTER TABLE `import_candidates` ADD `committed_product_id` int;--> statement-breakpoint
ALTER TABLE `import_candidates` ADD CONSTRAINT `import_candidates_reviewed_by_id_admin_users_id_fk` FOREIGN KEY (`reviewed_by_id`) REFERENCES `admin_users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_candidates` ADD CONSTRAINT `import_candidates_committed_product_id_products_id_fk` FOREIGN KEY (`committed_product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;