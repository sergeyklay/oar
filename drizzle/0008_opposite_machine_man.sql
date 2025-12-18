CREATE TABLE `settings_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_categories_slug_unique` ON `settings_categories` (`slug`);--> statement-breakpoint
CREATE TABLE `settings_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `settings_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_slug_unique` ON `settings_sections` (`category_id`,`slug`);--> statement-breakpoint
ALTER TABLE `settings` ADD `section_id` text REFERENCES settings_sections(id);