import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { reservations, type ReservationStatus } from "@/lib/db/schema";

const CANCELLABLE_RESERVATION_STATUSES = ["pending", "confirmed"] as const satisfies readonly ReservationStatus[];

export type CancelReservationInput = {
  reservationId: string;
  reason?: string;
};

export type CancelReservationResult =
  | { status: "cancelled"; reservation: { id: string; reference: string; previousStatus: ReservationStatus } }
  | { status: "not_found"; message: string }
  | { status: "invalid_transition"; message: string; currentStatus: ReservationStatus }
  | { status: "error"; message: string };

type CancellationDatabase = {
  select: typeof db.select;
  update: typeof db.update;
};

type ReservationRow = typeof reservations.$inferSelect;

export function canCancelAdminReservation(status: ReservationStatus): boolean {
  return CANCELLABLE_RESERVATION_STATUSES.includes(status as (typeof CANCELLABLE_RESERVATION_STATUSES)[number]);
}

function appendCancellationNote(existingNotes: string | null, reason: string | undefined, now: Date): string {
  const trimmedReason = reason?.trim();
  const cancellation = {
    cancelledBy: "admin",
    cancelledAt: now.toISOString(),
    ...(trimmedReason ? { reason: trimmedReason } : {}),
  };

  if (!existingNotes) {
    return JSON.stringify({ cancellation });
  }

  try {
    const parsed = JSON.parse(existingNotes) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return JSON.stringify({ ...parsed, cancellation });
    }
  } catch {
    // Preserve unstructured legacy notes instead of discarding them.
  }

  return JSON.stringify({ previousNotes: existingNotes, cancellation });
}

export async function cancelReservation(
  input: CancelReservationInput,
  database: CancellationDatabase = db,
  options: { now?: Date } = {},
): Promise<CancelReservationResult> {
  const reservationId = input.reservationId.trim();

  if (!reservationId) {
    return { status: "error", message: "Reservation id is required." };
  }

  const [reservation] = await database.select().from(reservations).where(eq(reservations.id, reservationId)).limit(1);

  if (!reservation) {
    return { status: "not_found", message: "Reservation was not found." };
  }

  if (!canCancelAdminReservation(reservation.status)) {
    return {
      status: "invalid_transition",
      message: `Reservations with status ${reservation.status} cannot be cancelled.`,
      currentStatus: reservation.status,
    };
  }

  const now = options.now ?? new Date();
  const notes = appendCancellationNote(reservation.notes, input.reason, now);
  const [updated] = await database
    .update(reservations)
    .set({
      status: "cancelled",
      notes,
      updatedAt: now,
    })
    .where(eq(reservations.id, reservation.id))
    .returning();
  const cancelledReservation = (updated ?? reservation) as ReservationRow;

  return {
    status: "cancelled",
    reservation: {
      id: cancelledReservation.id,
      reference: cancelledReservation.reference,
      previousStatus: reservation.status,
    },
  };
}
