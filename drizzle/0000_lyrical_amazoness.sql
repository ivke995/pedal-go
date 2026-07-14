CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`password_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "admin_users_status_check" CHECK(status in ('active', 'disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE INDEX `admin_users_status_idx` ON `admin_users` (`status`);--> statement-breakpoint
CREATE TABLE `availability_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`bike_type_id` text,
	`bike_id` text,
	`label` text NOT NULL,
	`status` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`bike_type_id`) REFERENCES `bike_types`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`bike_id`) REFERENCES `bikes`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "availability_blocks_status_check" CHECK(status in ('reserved', 'maintenance', 'inactive')),
	CONSTRAINT "availability_blocks_date_order_check" CHECK("availability_blocks"."ends_at" >= "availability_blocks"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `availability_blocks_type_dates_idx` ON `availability_blocks` (`bike_type_id`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `availability_blocks_bike_dates_idx` ON `availability_blocks` (`bike_id`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE INDEX `availability_blocks_status_idx` ON `availability_blocks` (`status`);--> statement-breakpoint
CREATE TABLE `bike_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`daily_rate_bam_cents` integer NOT NULL,
	`image_path` text,
	`features_json` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "bike_types_daily_rate_positive" CHECK("bike_types"."daily_rate_bam_cents" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bike_types_slug_unique` ON `bike_types` (`slug`);--> statement-breakpoint
CREATE INDEX `bike_types_active_sort_idx` ON `bike_types` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `bikes` (
	`id` text PRIMARY KEY NOT NULL,
	`bike_type_id` text NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`notes` text,
	`last_serviced_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`bike_type_id`) REFERENCES `bike_types`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "bikes_status_check" CHECK(status in ('available', 'reserved', 'rented', 'maintenance', 'inactive'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bikes_code_unique` ON `bikes` (`code`);--> statement-breakpoint
CREATE INDEX `bikes_type_status_idx` ON `bikes` (`bike_type_id`,`status`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`reservation_id` text NOT NULL,
	`amount_bam_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`provider` text,
	`provider_payment_id` text,
	`provider_checkout_id` text,
	`paid_at` integer,
	`refunded_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`reservation_id`) REFERENCES `reservations`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "payments_status_check" CHECK(status in ('pending', 'confirmed', 'failed', 'refunded')),
	CONSTRAINT "payments_amount_positive" CHECK("payments"."amount_bam_cents" > 0)
);
--> statement-breakpoint
CREATE INDEX `payments_reservation_idx` ON `payments` (`reservation_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_provider_payment_unique` ON `payments` (`provider`,`provider_payment_id`);--> statement-breakpoint
CREATE TABLE `reservations` (
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
	`daily_rate_bam_cents` integer NOT NULL,
	`total_bam_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`bike_type_id`) REFERENCES `bike_types`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`bike_id`) REFERENCES `bikes`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "reservations_status_check" CHECK(status in ('pending', 'confirmed', 'cancelled', 'completed', 'failed', 'refunded')),
	CONSTRAINT "reservations_date_order_check" CHECK("reservations"."return_at" > "reservations"."pickup_at"),
	CONSTRAINT "reservations_rental_days_positive" CHECK("reservations"."rental_days" > 0),
	CONSTRAINT "reservations_daily_rate_positive" CHECK("reservations"."daily_rate_bam_cents" > 0),
	CONSTRAINT "reservations_total_positive" CHECK("reservations"."total_bam_cents" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reservations_reference_unique` ON `reservations` (`reference`);--> statement-breakpoint
CREATE INDEX `reservations_bike_dates_idx` ON `reservations` (`bike_id`,`pickup_at`,`return_at`);--> statement-breakpoint
CREATE INDEX `reservations_type_dates_idx` ON `reservations` (`bike_type_id`,`pickup_at`,`return_at`);--> statement-breakpoint
CREATE INDEX `reservations_status_pickup_idx` ON `reservations` (`status`,`pickup_at`);--> statement-breakpoint
CREATE INDEX `reservations_customer_email_idx` ON `reservations` (`customer_email`);