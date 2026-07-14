import { and, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  availabilityBlocks,
  bikes,
  bikeTypes,
  reservations,
  type AvailabilityBlockStatus,
  type ReservationStatus,
} from "@/lib/db/schema";
import { calculateRentalDays, type RentalDateInput } from "./pricing";
export { rangesOverlap } from "./date-ranges";

export const BLOCKING_RESERVATION_STATUSES = ["confirmed"] as const satisfies readonly ReservationStatus[];
export const BLOCKING_AVAILABILITY_BLOCK_STATUSES = [
  "reserved",
  "maintenance",
  "inactive",
] as const satisfies readonly AvailabilityBlockStatus[];

type Database = typeof db;
type Bike = InferSelectModel<typeof bikes>;
type BikeType = InferSelectModel<typeof bikeTypes>;

export type AvailabilityRequest = {
  bikeTypeId: string;
  pickupAt: RentalDateInput;
  returnAt: RentalDateInput;
};

export type BikeAvailability = {
  bikeType: BikeType | null;
  rentalDays: number;
  availableBikes: Bike[];
  unavailableBikeIds: string[];
  isAvailable: boolean;
};

function toDate(input: RentalDateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

function unique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

export async function getBikeAvailability(
  request: AvailabilityRequest,
  database: Database = db,
): Promise<BikeAvailability> {
  const pickupAt = toDate(request.pickupAt);
  const returnAt = toDate(request.returnAt);
  const rentalDays = calculateRentalDays(pickupAt, returnAt);

  if (rentalDays <= 0) {
    return {
      bikeType: null,
      rentalDays,
      availableBikes: [],
      unavailableBikeIds: [],
      isAvailable: false,
    };
  }

  const [bikeType] = await database
    .select()
    .from(bikeTypes)
    .where(and(eq(bikeTypes.id, request.bikeTypeId), eq(bikeTypes.isActive, true)))
    .limit(1);

  if (!bikeType) {
    return {
      bikeType: null,
      rentalDays,
      availableBikes: [],
      unavailableBikeIds: [],
      isAvailable: false,
    };
  }

  const activeBikes = await database
    .select()
    .from(bikes)
    .where(and(eq(bikes.bikeTypeId, request.bikeTypeId), eq(bikes.status, "available")));

  if (activeBikes.length === 0) {
    return {
      bikeType,
      rentalDays,
      availableBikes: [],
      unavailableBikeIds: [],
      isAvailable: false,
    };
  }

  const [conflictingReservations, conflictingBlocks] = await Promise.all([
    database
      .select({ bikeId: reservations.bikeId })
      .from(reservations)
      .where(
        and(
          eq(reservations.bikeTypeId, request.bikeTypeId),
          inArray(reservations.status, BLOCKING_RESERVATION_STATUSES),
          lt(reservations.pickupAt, returnAt),
          gt(reservations.returnAt, pickupAt),
        ),
      ),
    database
      .select({ bikeId: availabilityBlocks.bikeId })
      .from(availabilityBlocks)
      .where(
        and(
          inArray(availabilityBlocks.status, BLOCKING_AVAILABILITY_BLOCK_STATUSES),
          or(eq(availabilityBlocks.bikeTypeId, request.bikeTypeId), isNull(availabilityBlocks.bikeTypeId)),
          lt(availabilityBlocks.startsAt, returnAt),
          gt(availabilityBlocks.endsAt, pickupAt),
        ),
      ),
  ]);

  const typeWideBlock = conflictingBlocks.some((block) => block.bikeId === null);
  const unavailableBikeIds = new Set<string>();

  if (typeWideBlock) {
    for (const bike of activeBikes) {
      unavailableBikeIds.add(bike.id);
    }
  }

  for (const reservation of conflictingReservations) {
    if (reservation.bikeId) {
      unavailableBikeIds.add(reservation.bikeId);
    }
  }

  for (const block of conflictingBlocks) {
    if (block.bikeId) {
      unavailableBikeIds.add(block.bikeId);
    }
  }

  const assignedConflictCount = unavailableBikeIds.size;
  const unassignedReservationCount = conflictingReservations.filter((reservation) => reservation.bikeId === null).length;
  const availableBikes = activeBikes.filter((bike) => !unavailableBikeIds.has(bike.id));
  const capacityAfterUnassignedReservations = Math.max(availableBikes.length - unassignedReservationCount, 0);

  return {
    bikeType,
    rentalDays,
    availableBikes: availableBikes.slice(0, capacityAfterUnassignedReservations),
    unavailableBikeIds: unique(unavailableBikeIds).slice(0, assignedConflictCount),
    isAvailable: capacityAfterUnassignedReservations > 0,
  };
}

export async function isBikeTypeAvailable(request: AvailabilityRequest, database: Database = db): Promise<boolean> {
  const availability = await getBikeAvailability(request, database);

  return availability.isAvailable;
}
