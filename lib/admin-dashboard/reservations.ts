import "server-only";

import { and, desc, eq, isNull, like, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  bikeTypes,
  bikes,
  reservations,
  PAYMENT_METHODS,
  RESERVATION_STATUSES,
  type PaymentMethod,
  type ReservationStatus,
} from "@/lib/db/schema";

export const ADMIN_RESERVATION_LIST_LIMIT = 100;

export type AdminReservationPaymentMethod = PaymentMethod | "none";

export type AdminReservationFilters = {
  search?: string;
  reservationStatus?: ReservationStatus | "all";
  paymentMethod?: AdminReservationPaymentMethod | "all";
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
  paymentMethod: AdminReservationPaymentMethod;
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

export function parsePaymentMethod(value: string | undefined): AdminReservationPaymentMethod | "all" {
  if (value === "none") return "none";

  return PAYMENT_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : "all";
}

export function normalizeAdminReservationFilters(filters: AdminReservationFilters): Required<AdminReservationFilters> {
  return {
    search: filters.search?.trim() ?? "",
    reservationStatus: filters.reservationStatus ?? "all",
    paymentMethod: filters.paymentMethod ?? "all",
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

  if (normalized.paymentMethod === "none") {
    conditions.push(isNull(reservations.paymentMethod));
  } else if (normalized.paymentMethod !== "all") {
    conditions.push(eq(reservations.paymentMethod, normalized.paymentMethod));
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
      paymentMethod: reservations.paymentMethod,
    })
    .from(reservations)
    .innerJoin(bikeTypes, eq(reservations.bikeTypeId, bikeTypes.id))
    .leftJoin(bikes, eq(reservations.bikeId, bikes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reservations.createdAt))
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
      paymentMethod: row.paymentMethod ?? "none",
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
