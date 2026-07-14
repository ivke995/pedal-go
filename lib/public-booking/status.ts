import { eq } from 'drizzle-orm'

import type { db as appDb } from '@/lib/db/client'
import { payments, reservations, type PaymentStatus, type ReservationStatus } from '@/lib/db/schema'

type StatusDatabase = typeof appDb
type PaymentRow = typeof payments.$inferSelect
type ReservationRow = typeof reservations.$inferSelect

export type PublicBookingStatusKind = 'processing' | 'confirmed' | 'failed' | 'cancelled'

export type PublicBookingStatusSummary = {
  kind: PublicBookingStatusKind
  reservationReference: string
  reservationStatus: ReservationStatus
  paymentStatus: PaymentStatus | null
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

function classifyReservationStatus(
  reservationStatus: ReservationStatus,
  paymentStatus: PaymentStatus | null,
): PublicBookingStatusKind {
  if (reservationStatus === 'confirmed' && paymentStatus === 'confirmed') {
    return 'confirmed'
  }

  if (reservationStatus === 'cancelled') {
    return 'cancelled'
  }

  if (reservationStatus === 'failed' || paymentStatus === 'failed') {
    return 'failed'
  }

  return 'processing'
}

function toStatusSummary(
  reservation: ReservationRow,
  payment: PaymentRow | null,
): PublicBookingStatusSummary {
  return {
    kind: classifyReservationStatus(reservation.status, payment?.status ?? null),
    reservationReference: reservation.reference,
    reservationStatus: reservation.status,
    paymentStatus: payment?.status ?? null,
    amountUsdCents: payment?.amountUsdCents ?? reservation.totalUsdCents,
    pickupAt: reservation.pickupAt.toISOString(),
    returnAt: reservation.returnAt.toISOString(),
    rentalDays: reservation.rentalDays,
  }
}

async function findReservationById(
  reservationId: string,
  database: StatusDatabase,
): Promise<ReservationRow | null> {
  const [reservation] = (await database
    .select()
    .from(reservations)
    .where(eq(reservations.id, reservationId))
    .limit(1)) as ReservationRow[]

  return reservation ?? null
}

async function findPaymentByCheckoutSession(
  checkoutSessionId: string,
  database: StatusDatabase,
): Promise<PaymentRow | null> {
  const [payment] = (await database
    .select()
    .from(payments)
    .where(eq(payments.providerCheckoutId, checkoutSessionId))
    .limit(1)) as PaymentRow[]

  return payment ?? null
}

async function findReservationByReference(
  reference: string,
  database: StatusDatabase,
): Promise<ReservationRow | null> {
  const [reservation] = (await database
    .select()
    .from(reservations)
    .where(eq(reservations.reference, reference))
    .limit(1)) as ReservationRow[]

  return reservation ?? null
}

async function findPaymentByReservationId(
  reservationId: string,
  database: StatusDatabase,
): Promise<PaymentRow | null> {
  const [payment] = (await database
    .select()
    .from(payments)
    .where(eq(payments.reservationId, reservationId))
    .limit(1)) as PaymentRow[]

  return payment ?? null
}

export async function getBookingStatusByCheckoutSession(
  checkoutSessionId: string,
  database: StatusDatabase,
): Promise<PublicBookingStatusResult> {
  const safeCheckoutSessionId = checkoutSessionId.trim()

  if (!safeCheckoutSessionId) {
    return {
      status: 'error',
      message: 'Checkout session reference is required.',
    }
  }

  const payment = await findPaymentByCheckoutSession(safeCheckoutSessionId, database)

  if (!payment) {
    return {
      status: 'not_found',
      message: 'We could not find that checkout session. If you just paid, please check your email shortly.',
    }
  }

  const reservation = await findReservationById(payment.reservationId, database)

  if (!reservation) {
    return {
      status: 'not_found',
      message: 'We could not find the reservation linked to that checkout session.',
    }
  }

  return {
    status: 'found',
    summary: toStatusSummary(reservation, payment),
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

  const payment = await findPaymentByReservationId(reservation.id, database)

  return {
    status: 'found',
    summary: toStatusSummary(reservation, payment),
  }
}
