import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { bikeTypes, reservations, type ReservationStatus } from "@/lib/db/schema";
import { getBikeAvailability } from "@/lib/domain/availability";
import { quoteRentalPrice } from "@/lib/domain/pricing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_CREATE_RESERVATION_STATUSES = ["confirmed", "pending"] as const satisfies readonly ReservationStatus[];

export type AdminCreateReservationStatus = (typeof ADMIN_CREATE_RESERVATION_STATUSES)[number];

export type AdminReservationFormBikeType = {
  id: string;
  name: string;
  dailyRateUsdCents: number;
};

export type CreateManualReservationInput = {
  bikeTypeId: string;
  fullName: string;
  email: string;
  phone: string;
  pickupAt: string;
  returnAt: string;
  status?: string;
  notes?: string;
};

export type ManualReservationFieldErrors = Partial<Record<keyof CreateManualReservationInput, string>>;

export type ManualReservationSummary = {
  id: string;
  reference: string;
  status: AdminCreateReservationStatus;
};

export type CreateManualReservationResult =
  | { status: "created"; reservation: ManualReservationSummary }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string; fieldErrors: ManualReservationFieldErrors };

type ManualReservationDatabase = Parameters<typeof getBikeAvailability>[1] & {
  insert: (table: typeof reservations) => {
    values: (row: typeof reservations.$inferInsert) => {
      returning: () => Promise<(typeof reservations.$inferSelect)[]>;
    };
  };
};

type CreateManualReservationOptions = {
  now?: Date;
  idFactory?: () => string;
  referenceFactory?: (now: Date) => string;
};

function generateReservationReference(now: Date): string {
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `PG-ADM-${datePart}-${randomPart}`;
}

function parseDateTime(value: string): Date | null {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseAdminReservationStatus(value: string | undefined): AdminCreateReservationStatus {
  return ADMIN_CREATE_RESERVATION_STATUSES.includes(value as AdminCreateReservationStatus)
    ? (value as AdminCreateReservationStatus)
    : "confirmed";
}

function validateManualReservationInput(input: CreateManualReservationInput):
  | { ok: true; pickupAt: Date; returnAt: Date; status: AdminCreateReservationStatus }
  | { ok: false; fieldErrors: ManualReservationFieldErrors } {
  const fieldErrors: ManualReservationFieldErrors = {};
  const pickupAt = parseDateTime(input.pickupAt);
  const returnAt = parseDateTime(input.returnAt);

  if (!input.bikeTypeId.trim()) {
    fieldErrors.bikeTypeId = "Choose a bike type.";
  }

  if (input.fullName.trim().length < 2) {
    fieldErrors.fullName = "Enter the customer's full name.";
  }

  if (!EMAIL_RE.test(input.email.trim())) {
    fieldErrors.email = "Enter a valid customer email address.";
  }

  if (input.phone.trim().replace(/[^\d]/g, "").length < 6) {
    fieldErrors.phone = "Enter a valid customer phone number.";
  }

  if (!pickupAt) {
    fieldErrors.pickupAt = "Choose a valid pickup date and time.";
  }

  if (!returnAt) {
    fieldErrors.returnAt = "Choose a valid return date and time.";
  }

  if (pickupAt && returnAt && returnAt <= pickupAt) {
    fieldErrors.returnAt = "Return must be after pickup.";
  }

  if (Object.keys(fieldErrors).length > 0 || !pickupAt || !returnAt) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, pickupAt, returnAt, status: parseAdminReservationStatus(input.status) };
}

export async function getAdminReservationFormBikeTypes(): Promise<AdminReservationFormBikeType[]> {
  return db
    .select({
      id: bikeTypes.id,
      name: bikeTypes.name,
      dailyRateUsdCents: bikeTypes.dailyRateUsdCents,
    })
    .from(bikeTypes)
    .where(eq(bikeTypes.isActive, true))
    .orderBy(asc(bikeTypes.sortOrder), asc(bikeTypes.name));
}

export function getAdminCreateReservationStatuses(): readonly AdminCreateReservationStatus[] {
  return ADMIN_CREATE_RESERVATION_STATUSES;
}

export async function createManualReservation(
  input: CreateManualReservationInput,
  database: ManualReservationDatabase = db,
  options: CreateManualReservationOptions = {},
): Promise<CreateManualReservationResult> {
  const validation = validateManualReservationInput(input);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields before creating the reservation.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const availability = await getBikeAvailability(
    {
      bikeTypeId: input.bikeTypeId.trim(),
      pickupAt: validation.pickupAt,
      returnAt: validation.returnAt,
    },
    database,
  );

  if (!availability.bikeType || !availability.isAvailable) {
    return {
      status: "unavailable",
      message: "No bikes are available for the selected rental window.",
    };
  }

  const quote = quoteRentalPrice(validation.pickupAt, validation.returnAt, availability.bikeType.dailyRateUsdCents);
  const now = options.now ?? new Date();
  const selectedBike = availability.availableBikes[0] ?? null;
  const adminNote = input.notes?.trim();
  const [created] = await database
    .insert(reservations)
    .values({
      id: options.idFactory?.() ?? randomUUID(),
      reference: options.referenceFactory?.(now) ?? generateReservationReference(now),
      bikeTypeId: availability.bikeType.id,
      bikeId: selectedBike?.id ?? null,
      customerName: input.fullName.trim(),
      customerEmail: input.email.trim().toLowerCase(),
      customerPhone: input.phone.trim(),
      pickupAt: validation.pickupAt,
      returnAt: validation.returnAt,
      rentalDays: quote.rentalDays,
      dailyRateUsdCents: quote.dailyRateUsdCents,
      totalUsdCents: quote.totalUsdCents,
      status: validation.status,
      notes: JSON.stringify({
        source: "admin_manual",
        holdStrategy: selectedBike ? "assigned_bike" : "capacity_hold",
        ...(adminNote ? { adminNote } : {}),
      }),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return {
    status: "created",
    reservation: {
      id: created.id,
      reference: created.reference,
      status: validation.status,
    },
  };
}
