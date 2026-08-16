import { eq } from 'drizzle-orm'

import type { db as appDb } from '@/lib/db/client'
import { reservations, type ReservationStatus } from '@/lib/db/schema'

type StatusDatabase = typeof appDb
type ReservationRow = typeof reservations.$inferSelect

export type PublicBookingStatusKind = 'processing' | 'confirmed' | 'failed' | 'cancelled'

export type PublicBookingStatusSummary = {
  kind: PublicBookingStatusKind
  reservationReference: string
  reservationStatus: ReservationStatus
  paymentStatus: null
  amountUsdCents: number
  pickupAt: string
  returnAt: string
  rentalDays: number
}

export type PublicBookingStatusResult =
  | {
      status: 'found'
      summary: PublicBookingStatusSummary
    }
  | {
      status: 'not_found'
      message: string
    }
  | {
      status: 'error'
      message: string
    }

function classifyReservationStatus(reservationStatus: ReservationStatus): PublicBookingStatusKind {
  if (reservationStatus === 'confirmed') return 'confirmed'
  if (reservationStatus === 'cancelled') return 'cancelled'
  if (reservationStatus === 'failed') return 'failed'

  return 'processing'
}

function toStatusSummary(reservation: ReservationRow): PublicBookingStatusSummary {
  return {
    kind: classifyReservationStatus(reservation.status),
    reservationReference: reservation.reference,
    reservationStatus: reservation.status,
    paymentStatus: null,
    amountUsdCents: reservation.totalUsdCents,
    pickupAt: reservation.pickupAt.toISOString(),
    returnAt: reservation.returnAt.toISOString(),
    rentalDays: reservation.rentalDays,
  }
}

async function findReservationByReference(reference: string, database: StatusDatabase): Promise<ReservationRow | null> {
  const [reservation] = (await database
    .select()
    .from(reservations)
    .where(eq(reservations.reference, reference))
    .limit(1)) as ReservationRow[]

  return reservation ?? null
}

export async function getBookingStatusByCheckoutSession(
  _checkoutSessionId: string,
  _database: StatusDatabase,
): Promise<PublicBookingStatusResult> {
  void _checkoutSessionId
  void _database

  return {
    status: 'not_found',
    message: 'Provider checkout status is no longer available. Use the reservation reference from your submission.',
  }
}

export async function getBookingStatusByReservationReference(
  reference: string,
  database: StatusDatabase,
): Promise<PublicBookingStatusResult> {
  const safeReference = reference.trim()

  if (!safeReference) {
    return {
      status: 'error',
      message: 'Reservation reference is required.',
    }
  }

  const reservation = await findReservationByReference(safeReference, database)

  if (!reservation) {
    return {
      status: 'not_found',
      message: 'We could not find that reservation reference.',
    }
  }

  return {
    status: 'found',
    summary: toStatusSummary(reservation),
  }
}
