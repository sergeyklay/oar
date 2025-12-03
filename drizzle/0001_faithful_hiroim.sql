CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`bill_id` text NOT NULL,
	`amount` integer NOT NULL,
	`paid_at` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade
);
