import "server-only";

import { and, desc, eq, isNull, like, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  bikeTypes,
  bikes,
  payments,
  reservations,
  PAYMENT_STATUSES,
  RESERVATION_STATUSES,
  type PaymentStatus,
  type ReservationStatus,
} from "@/lib/db/schema";

export const ADMIN_RESERVATION_LIST_LIMIT = 100;

export type AdminReservationPaymentStatus = PaymentStatus | "none";

export type AdminReservationFilters = {
  search?: string;
  reservationStatus?: ReservationStatus | "all";
  paymentStatus?: AdminReservationPaymentStatus | "all";
};

export type AdminReservationListItem = {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAt: Date;
  returnAt: Date;
  rentalDays: number;
  totalUsdCents: number;
  reservationStatus: ReservationStatus;
  bikeTypeName: string;
  bikeCode: string | null;
  paymentStatus: AdminReservationPaymentStatus;
  paymentProvider: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminReservationListResult = {
  reservations: AdminReservationListItem[];
  totalShown: number;
  limit: number;
};

export function parseReservationStatus(value: string | undefined): ReservationStatus | "all" {
  return RESERVATION_STATUSES.includes(value as ReservationStatus) ? (value as ReservationStatus) : "all";
}

export function parsePaymentStatus(value: string | undefined): AdminReservationPaymentStatus | "all" {
  if (value === "none") return "none";

  return PAYMENT_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : "all";
}

export function normalizeAdminReservationFilters(filters: AdminReservationFilters): Required<AdminReservationFilters> {
  return {
    search: filters.search?.trim() ?? "",
    reservationStatus: filters.reservationStatus ?? "all",
    paymentStatus: filters.paymentStatus ?? "all",
  };
}

export async function getAdminReservations(
  filters: AdminReservationFilters = {},
): Promise<AdminReservationListResult> {
  const normalized = normalizeAdminReservationFilters(filters);
  const conditions: SQL[] = [];

  if (normalized.reservationStatus !== "all") {
    conditions.push(eq(reservations.status, normalized.reservationStatus));
  }

  if (normalized.paymentStatus === "none") {
    conditions.push(isNull(payments.id));
  } else if (normalized.paymentStatus !== "all") {
    conditions.push(eq(payments.status, normalized.paymentStatus));
  }

  if (normalized.search) {
    const searchPattern = `%${normalized.search}%`;

    conditions.push(
      or(
        like(reservations.reference, searchPattern),
        like(reservations.customerName, searchPattern),
        like(reservations.customerEmail, searchPattern),
        like(reservations.customerPhone, searchPattern),
      )!,
    );
  }

  const rows = await db
    .select({
      reservation: reservations,
      bikeTypeName: bikeTypes.name,
      bikeCode: bikes.code,
      paymentStatus: payments.status,
      paymentProvider: payments.provider,
    })
    .from(reservations)
    .innerJoin(bikeTypes, eq(reservations.bikeTypeId, bikeTypes.id))
    .leftJoin(bikes, eq(reservations.bikeId, bikes.id))
    .leftJoin(payments, eq(payments.reservationId, reservations.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reservations.createdAt), desc(payments.updatedAt))
    .limit(ADMIN_RESERVATION_LIST_LIMIT);

  const reservationsById = new Map<string, AdminReservationListItem>();

  for (const row of rows) {
    if (reservationsById.has(row.reservation.id)) continue;

    reservationsById.set(row.reservation.id, {
      id: row.reservation.id,
      reference: row.reservation.reference,
      customerName: row.reservation.customerName,
      customerEmail: row.reservation.customerEmail,
      customerPhone: row.reservation.customerPhone,
      pickupAt: row.reservation.pickupAt,
      returnAt: row.reservation.returnAt,
      rentalDays: row.reservation.rentalDays,
      totalUsdCents: row.reservation.totalUsdCents,
      reservationStatus: row.reservation.status,
      bikeTypeName: row.bikeTypeName,
      bikeCode: row.bikeCode,
      paymentStatus: row.paymentStatus ?? "none",
      paymentProvider: row.paymentProvider,
      createdAt: row.reservation.createdAt,
      updatedAt: row.reservation.updatedAt,
    });
  }

  return {
    reservations: [...reservationsById.values()],
    totalShown: reservationsById.size,
    limit: ADMIN_RESERVATION_LIST_LIMIT,
  };
}
