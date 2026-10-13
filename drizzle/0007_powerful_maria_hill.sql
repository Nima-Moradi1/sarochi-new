CREATE TABLE `variant_styling_mappings` (
	`variant_id` int NOT NULL,
	`garment_class` varchar(48) NOT NULL,
	`preset_id` varchar(40) NOT NULL,
	`color_hex` varchar(7),
	`fidelity` varchar(24) NOT NULL DEFAULT 'CONCEPTUAL',
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `variant_styling_mappings_variant_id` PRIMARY KEY(`variant_id`)
);
--> statement-breakpoint
ALTER TABLE `variant_styling_mappings` ADD CONSTRAINT `variant_styling_mappings_variant_id_product_variants_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE cascade ON UPDATE no action;