PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
CREATE TABLE `__new_reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`bike_type_id` text NOT NULL,
	`bike_id` text,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`pickup_at` integer NOT NULL,
	`return_at` integer NOT NULL,
	`rental_days` integer NOT NULL,
	`daily_rate_usd_cents` integer NOT NULL,
	`total_usd_cents` integer NOT NULL,
	`status` text DEFAULT 'pending_verification' NOT NULL,
	`payment_method` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`bike_type_id`) REFERENCES `bike_types`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`bike_id`) REFERENCES `bikes`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "reservations_status_check" CHECK(status in ('pending_verification', 'confirmed', 'cancelled', 'completed', 'failed', 'refunded')),
	CONSTRAINT "reservations_date_order_check" CHECK("__new_reservations"."return_at" > "__new_reservations"."pickup_at"),
	CONSTRAINT "reservations_rental_days_positive" CHECK("__new_reservations"."rental_days" > 0),
	CONSTRAINT "reservations_daily_rate_positive" CHECK("__new_reservations"."daily_rate_usd_cents" > 0),
	CONSTRAINT "reservations_total_positive" CHECK("__new_reservations"."total_usd_cents" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_reservations`("id", "reference", "bike_type_id", "bike_id", "customer_name", "customer_email", "customer_phone", "pickup_at", "return_at", "rental_days", "daily_rate_usd_cents", "total_usd_cents", "status", "payment_method", "notes", "created_at", "updated_at") SELECT "id", "reference", "bike_type_id", "bike_id", "customer_name", "customer_email", "customer_phone", "pickup_at", "return_at", "rental_days", "daily_rate_usd_cents", "total_usd_cents", CASE "status" WHEN 'pending' THEN 'pending_verification' ELSE "status" END, NULL, "notes", "created_at", "updated_at" FROM `reservations`;--> statement-breakpoint
DROP TABLE `reservations`;--> statement-breakpoint
ALTER TABLE `__new_reservations` RENAME TO `reservations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_reference_unique` ON `reservations` (`reference`);--> statement-breakpoint
CREATE INDEX `reservations_bike_dates_idx` ON `reservations` (`bike_id`,`pickup_at`,`return_at`);--> statement-breakpoint
CREATE INDEX `reservations_type_dates_idx` ON `reservations` (`bike_type_id`,`pickup_at`,`return_at`);--> statement-breakpoint
CREATE INDEX `reservations_status_pickup_idx` ON `reservations` (`status`,`pickup_at`);--> statement-breakpoint
CREATE INDEX `reservations_customer_email_idx` ON `reservations` (`customer_email`);
