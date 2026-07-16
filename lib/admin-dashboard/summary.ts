import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { availabilityBlocks, bikeTypes, bikes, payments, reservations } from "@/lib/db/schema";

type CountRow = {
  count: number | string | bigint | null;
};

type RevenueRow = {
  totalUsdCents: number | string | bigint | null;
};

function toNumber(value: number | string | bigint | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value) || 0;

  return 0;
}

async function countFrom(table: typeof reservations | typeof payments | typeof availabilityBlocks | typeof bikeTypes | typeof bikes) {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(table);

  return toNumber((row as CountRow | undefined)?.count);
}

export type AdminDashboardSummary = {
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  pendingPayments: number;
  activeAvailabilityBlocks: number;
  activeBikeTypes: number;
  physicalBikes: number;
  confirmedRevenueUsdCents: number;
};

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const now = new Date();

  const [
    totalReservations,
    pendingReservationsResult,
    confirmedReservationsResult,
    pendingPaymentsResult,
    activeAvailabilityBlocksResult,
    activeBikeTypesResult,
    physicalBikes,
    confirmedRevenueResult,
  ] = await Promise.all([
    countFrom(reservations),
    db.select({ count: sql<number>`count(*)` }).from(reservations).where(sql`${reservations.status} = 'pending'`),
    db.select({ count: sql<number>`count(*)` }).from(reservations).where(sql`${reservations.status} = 'confirmed'`),
    db.select({ count: sql<number>`count(*)` }).from(payments).where(sql`${payments.status} = 'pending'`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(availabilityBlocks)
      .where(sql`${availabilityBlocks.endsAt} >= ${now}`),
    db.select({ count: sql<number>`count(*)` }).from(bikeTypes).where(sql`${bikeTypes.isActive} = 1`),
    countFrom(bikes),
    db
      .select({ totalUsdCents: sql<number>`coalesce(sum(${payments.amountUsdCents}), 0)` })
      .from(payments)
      .where(sql`${payments.status} = 'confirmed'`),
  ]);

  return {
    totalReservations,
    pendingReservations: toNumber((pendingReservationsResult[0] as CountRow | undefined)?.count),
    confirmedReservations: toNumber((confirmedReservationsResult[0] as CountRow | undefined)?.count),
    pendingPayments: toNumber((pendingPaymentsResult[0] as CountRow | undefined)?.count),
    activeAvailabilityBlocks: toNumber((activeAvailabilityBlocksResult[0] as CountRow | undefined)?.count),
    activeBikeTypes: toNumber((activeBikeTypesResult[0] as CountRow | undefined)?.count),
    physicalBikes,
    confirmedRevenueUsdCents: toNumber((confirmedRevenueResult[0] as RevenueRow | undefined)?.totalUsdCents),
  };
}
