import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { reservations, type ReservationStatus } from "@/lib/db/schema";

const VERIFIABLE_RESERVATION_STATUS = "pending_verification" as const;

export type ReservationVerificationAdmin = {
  id: string;
  email: string;
  name: string | null;
};

export type VerifyReservationInput = {
  reservationId: string;
  note?: string;
};

export type ReservationVerification = {
  verifiedAt: string;
  verifiedBy: {
    adminId: string;
    email: string;
    name: string | null;
  };
  note?: string;
};

export type VerifyReservationResult =
  | { status: "verified"; reservation: { id: string; reference: string; previousStatus: ReservationStatus } }
  | { status: "not_found"; message: string }
  | { status: "invalid_transition"; message: string; currentStatus: ReservationStatus }
  | { status: "error"; message: string };

type VerificationDatabase = {
  select: typeof db.select;
  update: typeof db.update;
};

type ReservationRow = typeof reservations.$inferSelect;

function appendVerificationNote(
  existingNotes: string | null,
  admin: ReservationVerificationAdmin,
  note: string | undefined,
  now: Date,
): string {
  const trimmedNote = note?.trim();
  const verification: ReservationVerification = {
    verifiedAt: now.toISOString(),
    verifiedBy: {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    },
    ...(trimmedNote ? { note: trimmedNote } : {}),
  };

  if (!existingNotes) {
    return JSON.stringify({ verification });
  }

  try {
    const parsed = JSON.parse(existingNotes) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return JSON.stringify({ ...parsed, verification });
    }
  } catch {
    // Preserve unstructured legacy notes instead of discarding them.
  }

  return JSON.stringify({ previousNotes: existingNotes, verification });
}

export async function verifyReservation(
  input: VerifyReservationInput,
  admin: ReservationVerificationAdmin,
  database: VerificationDatabase = db,
  options: { now?: Date } = {},
): Promise<VerifyReservationResult> {
  const reservationId = input.reservationId.trim();

  if (!reservationId) {
    return { status: "error", message: "Reservation id is required." };
  }

  const [reservation] = await database.select().from(reservations).where(eq(reservations.id, reservationId)).limit(1);

  if (!reservation) {
    return { status: "not_found", message: "Reservation was not found." };
  }

  if (reservation.status !== VERIFIABLE_RESERVATION_STATUS) {
    return {
      status: "invalid_transition",
      message: `Reservations with status ${reservation.status} cannot be verified.`,
      currentStatus: reservation.status,
    };
  }

  const now = options.now ?? new Date();
  const notes = appendVerificationNote(reservation.notes, admin, input.note, now);
  const [updated] = await database
    .update(reservations)
    .set({
      status: "confirmed",
      notes,
      updatedAt: now,
    })
    .where(and(eq(reservations.id, reservation.id), eq(reservations.status, VERIFIABLE_RESERVATION_STATUS)))
    .returning();

  if (!updated) {
    return {
      status: "invalid_transition",
      message: `Reservations with status ${reservation.status} cannot be verified.`,
      currentStatus: reservation.status,
    };
  }

  const verifiedReservation = (updated ?? reservation) as ReservationRow;

  return {
    status: "verified",
    reservation: {
      id: verifiedReservation.id,
      reference: verifiedReservation.reference,
      previousStatus: reservation.status,
    },
  };
}

export function parseReservationVerification(notes: string | null): ReservationVerification | null {
  if (!notes) return null;

  try {
    const parsed = JSON.parse(notes) as { verification?: unknown };
    const verification = parsed.verification;

    if (!verification || typeof verification !== "object" || Array.isArray(verification)) return null;

    const value = verification as Partial<ReservationVerification>;
    const verifiedBy = value.verifiedBy;

    if (
      typeof value.verifiedAt !== "string" ||
      !verifiedBy ||
      typeof verifiedBy !== "object" ||
      Array.isArray(verifiedBy)
    ) {
      return null;
    }

    const admin = verifiedBy as Partial<ReservationVerification["verifiedBy"]>;

    if (typeof admin.adminId !== "string" || typeof admin.email !== "string") return null;

    return {
      verifiedAt: value.verifiedAt,
      verifiedBy: {
        adminId: admin.adminId,
        email: admin.email,
        name: typeof admin.name === "string" ? admin.name : null,
      },
      ...(typeof value.note === "string" ? { note: value.note } : {}),
    };
  } catch {
    return null;
  }
}
