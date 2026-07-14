import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const BIKE_STATUSES = ["available", "reserved", "rented", "maintenance", "inactive"] as const;
export type BikeStatus = (typeof BIKE_STATUSES)[number];

export const RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "failed",
  "refunded",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "confirmed", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const AVAILABILITY_BLOCK_STATUSES = ["reserved", "maintenance", "inactive"] as const;
export type AvailabilityBlockStatus = (typeof AVAILABILITY_BLOCK_STATUSES)[number];

export const ADMIN_USER_STATUSES = ["active", "disabled"] as const;
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

const timestampMs = (name: string) =>
  integer(name, { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`);

const statusCheck = (columnName: string, values: readonly string[]) =>
  sql.raw(`${columnName} in (${values.map((value) => `'${value}'`).join(", ")})`);

export const bikeTypes = sqliteTable(
  "bike_types",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    dailyRateBamCents: integer("daily_rate_bam_cents").notNull(),
    imagePath: text("image_path"),
    featuresJson: text("features_json", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestampMs("created_at"),
    updatedAt: timestampMs("updated_at"),
  },
  (table) => [
    uniqueIndex("bike_types_slug_unique").on(table.slug),
    index("bike_types_active_sort_idx").on(table.isActive, table.sortOrder),
    check("bike_types_daily_rate_positive", sql`${table.dailyRateBamCents} > 0`),
  ],
);

export const bikes = sqliteTable(
  "bikes",
  {
    id: text("id").primaryKey(),
    bikeTypeId: text("bike_type_id")
      .notNull()
      .references(() => bikeTypes.id, { onDelete: "restrict", onUpdate: "cascade" }),
    code: text("code").notNull(),
    status: text("status", { enum: BIKE_STATUSES }).notNull().default("available"),
    notes: text("notes"),
    lastServicedAt: integer("last_serviced_at", { mode: "timestamp_ms" }),
    createdAt: timestampMs("created_at"),
    updatedAt: timestampMs("updated_at"),
  },
  (table) => [
    uniqueIndex("bikes_code_unique").on(table.code),
    index("bikes_type_status_idx").on(table.bikeTypeId, table.status),
    check("bikes_status_check", statusCheck("status", BIKE_STATUSES)),
  ],
);

export const reservations = sqliteTable(
  "reservations",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    bikeTypeId: text("bike_type_id")
      .notNull()
      .references(() => bikeTypes.id, { onDelete: "restrict", onUpdate: "cascade" }),
    bikeId: text("bike_id").references(() => bikes.id, { onDelete: "set null", onUpdate: "cascade" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    pickupAt: integer("pickup_at", { mode: "timestamp_ms" }).notNull(),
    returnAt: integer("return_at", { mode: "timestamp_ms" }).notNull(),
    rentalDays: integer("rental_days").notNull(),
    dailyRateBamCents: integer("daily_rate_bam_cents").notNull(),
    totalBamCents: integer("total_bam_cents").notNull(),
    status: text("status", { enum: RESERVATION_STATUSES }).notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestampMs("created_at"),
    updatedAt: timestampMs("updated_at"),
  },
  (table) => [
    uniqueIndex("reservations_reference_unique").on(table.reference),
    index("reservations_bike_dates_idx").on(table.bikeId, table.pickupAt, table.returnAt),
    index("reservations_type_dates_idx").on(table.bikeTypeId, table.pickupAt, table.returnAt),
    index("reservations_status_pickup_idx").on(table.status, table.pickupAt),
    index("reservations_customer_email_idx").on(table.customerEmail),
    check("reservations_status_check", statusCheck("status", RESERVATION_STATUSES)),
    check("reservations_date_order_check", sql`${table.returnAt} > ${table.pickupAt}`),
    check("reservations_rental_days_positive", sql`${table.rentalDays} > 0`),
    check("reservations_daily_rate_positive", sql`${table.dailyRateBamCents} > 0`),
    check("reservations_total_positive", sql`${table.totalBamCents} > 0`),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    reservationId: text("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    amountBamCents: integer("amount_bam_cents").notNull(),
    status: text("status", { enum: PAYMENT_STATUSES }).notNull().default("pending"),
    provider: text("provider"),
    providerPaymentId: text("provider_payment_id"),
    providerCheckoutId: text("provider_checkout_id"),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    refundedAt: integer("refunded_at", { mode: "timestamp_ms" }),
    createdAt: timestampMs("created_at"),
    updatedAt: timestampMs("updated_at"),
  },
  (table) => [
    index("payments_reservation_idx").on(table.reservationId),
    index("payments_status_idx").on(table.status),
    uniqueIndex("payments_provider_payment_unique").on(table.provider, table.providerPaymentId),
    check("payments_status_check", statusCheck("status", PAYMENT_STATUSES)),
    check("payments_amount_positive", sql`${table.amountBamCents} > 0`),
  ],
);

export const availabilityBlocks = sqliteTable(
  "availability_blocks",
  {
    id: text("id").primaryKey(),
    bikeTypeId: text("bike_type_id").references(() => bikeTypes.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    bikeId: text("bike_id").references(() => bikes.id, { onDelete: "cascade", onUpdate: "cascade" }),
    label: text("label").notNull(),
    status: text("status", { enum: AVAILABILITY_BLOCK_STATUSES }).notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
    note: text("note"),
    createdAt: timestampMs("created_at"),
    updatedAt: timestampMs("updated_at"),
  },
  (table) => [
    index("availability_blocks_type_dates_idx").on(table.bikeTypeId, table.startsAt, table.endsAt),
    index("availability_blocks_bike_dates_idx").on(table.bikeId, table.startsAt, table.endsAt),
    index("availability_blocks_status_idx").on(table.status),
    check("availability_blocks_status_check", statusCheck("status", AVAILABILITY_BLOCK_STATUSES)),
    check("availability_blocks_date_order_check", sql`${table.endsAt} >= ${table.startsAt}`),
  ],
);

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    status: text("status", { enum: ADMIN_USER_STATUSES }).notNull().default("active"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    createdAt: timestampMs("created_at"),
    updatedAt: timestampMs("updated_at"),
  },
  (table) => [
    uniqueIndex("admin_users_email_unique").on(table.email),
    index("admin_users_status_idx").on(table.status),
    check("admin_users_status_check", statusCheck("status", ADMIN_USER_STATUSES)),
  ],
);

export const bikeTypesRelations = relations(bikeTypes, ({ many }) => ({
  bikes: many(bikes),
  reservations: many(reservations),
  availabilityBlocks: many(availabilityBlocks),
}));

export const bikesRelations = relations(bikes, ({ one, many }) => ({
  bikeType: one(bikeTypes, {
    fields: [bikes.bikeTypeId],
    references: [bikeTypes.id],
  }),
  reservations: many(reservations),
  availabilityBlocks: many(availabilityBlocks),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  bikeType: one(bikeTypes, {
    fields: [reservations.bikeTypeId],
    references: [bikeTypes.id],
  }),
  bike: one(bikes, {
    fields: [reservations.bikeId],
    references: [bikes.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  reservation: one(reservations, {
    fields: [payments.reservationId],
    references: [reservations.id],
  }),
}));

export const availabilityBlocksRelations = relations(availabilityBlocks, ({ one }) => ({
  bikeType: one(bikeTypes, {
    fields: [availabilityBlocks.bikeTypeId],
    references: [bikeTypes.id],
  }),
  bike: one(bikes, {
    fields: [availabilityBlocks.bikeId],
    references: [bikes.id],
  }),
}));
