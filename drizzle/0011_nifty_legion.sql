PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bills` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`amount` integer NOT NULL,
	`amount_due` integer DEFAULT 0 NOT NULL,
	`due_date` integer NOT NULL,
	`frequency` text DEFAULT 'monthly' NOT NULL,
	`is_auto_pay` integer DEFAULT false NOT NULL,
	`is_variable` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`notes` text,
	`category_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `bill_categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_bills`("id", "title", "amount", "amount_due", "due_date", "frequency", "is_auto_pay", "is_variable", "status", "is_archived", "notes", "category_id", "created_at", "updated_at") SELECT "id", "title", "amount", "amount_due", "due_date", "frequency", "is_auto_pay", "is_variable", "status", "is_archived", "notes", "category_id", "created_at", "updated_at" FROM `bills`;--> statement-breakpoint
DROP TABLE `bills`;--> statement-breakpoint
ALTER TABLE `__new_bills` RENAME TO `bills`;--> statement-breakpoint
PRAGMA foreign_keys=ON;