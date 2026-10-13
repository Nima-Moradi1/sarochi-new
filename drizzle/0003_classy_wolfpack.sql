CREATE TABLE `import_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`source_url` varchar(1024) NOT NULL,
	`source_url_hash` varchar(64) NOT NULL,
	`source_id` varchar(160),
	`fingerprint` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`issues` json NOT NULL,
	`review_status` varchar(32) NOT NULL DEFAULT 'PENDING_REVIEW',
	`collected_at` datetime NOT NULL,
	`approved_at` datetime,
	CONSTRAINT `import_candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_candidate_version_unique` UNIQUE(`job_id`,`source_url_hash`,`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `import_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source_kind` varchar(24) NOT NULL,
	`state` varchar(32) NOT NULL DEFAULT 'CREATED',
	`cursor` varchar(255),
	`counters` json,
	`started_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `import_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `source_observations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int,
	`source_type` varchar(24) NOT NULL,
	`source_url` varchar(1024) NOT NULL,
	`source_url_hash` varchar(64) NOT NULL,
	`field` varchar(64) NOT NULL,
	`value` json NOT NULL,
	`confidence` varchar(24) NOT NULL,
	`collected_at` datetime NOT NULL,
	`approved_at` datetime,
	CONSTRAINT `source_observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `import_candidates` ADD CONSTRAINT `import_candidates_job_id_import_jobs_id_fk` FOREIGN KEY (`job_id`) REFERENCES `import_jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `source_observations` ADD CONSTRAINT `source_observations_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `import_candidates_review_idx` ON `import_candidates` (`job_id`,`review_status`);--> statement-breakpoint
CREATE INDEX `source_observations_source_idx` ON `source_observations` (`source_url_hash`,`field`,`collected_at`);