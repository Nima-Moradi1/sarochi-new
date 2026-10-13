CREATE TABLE `security_rate_limits` (
	`key_hash` varchar(64) NOT NULL,
	`attempts` int NOT NULL,
	`reset_at` datetime NOT NULL,
	CONSTRAINT `security_rate_limits_key_hash` PRIMARY KEY(`key_hash`)
);
--> statement-breakpoint
CREATE INDEX `security_rate_limits_expiry_idx` ON `security_rate_limits` (`reset_at`);