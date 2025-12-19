CREATE TABLE `bill_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `bill_category_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bill_categories_slug_unique` ON `bill_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `bill_category_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bill_category_groups_slug_unique` ON `bill_category_groups` (`slug`);--> statement-breakpoint
ALTER TABLE `bills` ADD `category_id` text REFERENCES bill_categories(id);