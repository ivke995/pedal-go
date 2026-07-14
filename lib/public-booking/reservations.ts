import { randomUUID } from 'node:crypto'

import { reservations } from '@/lib/db/schema'
import { getBikeAvailability } from '@/lib/domain/availability'
import { quoteRentalPrice } from '@/lib/domain/pricing'
import type { BookingDraft } from '@/lib/types'
import {
  FEATURED_BIKE_TYPE_ID,
  type AvailabilityQuoteInput,
  validateAvailabilityQuoteInput,
} from './availability'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HOLD_MINUTES = 30

export type CreatePendingReservationInput = AvailabilityQuoteInput & {
  fullName: string
  email: string
  phone: string
}

export type PendingReservationFieldErrors = {
  pickupAt?: string
  returnAt?: string
  fullName?: string
  email?: string
  phone?: string
}

export type PendingReservationSummary = {
  id: string
  reference: string
  bikeTypeId: string
  bikeName: string
  bikeId: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupAt: string
  returnAt: string
  rentalDays: number
  dailyRateUsdCents: number
  totalUsdCents: number
  status: 'pending'
  holdExpiresAt: string
  draft: BookingDraft
}

export type CreatePendingReservationResult =
  | {
      status: 'created'
      reservation: PendingReservationSummary
    }
  | {
      status: 'unavailable'
      message: string
    }
  | {
      status: 'error'
      message: string
      fieldErrors: PendingReservationFieldErrors
    }

type ReservationDatabase = Parameters<typeof getBikeAvailability>[1] & {
  insert: (table: typeof reservations) => {
    values: (row: typeof reservations.$inferInsert) => {
      returning: () => Promise<(typeof reservations.$inferSelect)[]>
    }
  }
}

type CreatePendingReservationOptions = {
  now?: Date
  idFactory?: () => string
  referenceFactory?: (now: Date) => string
}

function validateCustomerDetails(input: CreatePendingReservationInput): PendingReservationFieldErrors {
  const fieldErrors: PendingReservationFieldErrors = {}

  if (input.fullName.trim().length < 2) {
    fieldErrors.fullName = 'Please enter your full name.'
  }

  if (!EMAIL_RE.test(input.email.trim())) {
    fieldErrors.email = 'Please enter a valid email address.'
  }

  if (input.phone.trim().replace(/[^\d]/g, '').length < 6) {
    fieldErrors.phone = 'Please enter a valid phone number.'
  }

  return fieldErrors
}

function generateReservationReference(now: Date): string {
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '')
  const randomPart = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()

  return `PG-${datePart}-${randomPart}`
}

function toPublicSummary(
  row: typeof reservations.$inferSelect,
  bikeName: string,
  holdExpiresAt: Date,
): PendingReservationSummary {
  return {
    id: row.id,
    reference: row.reference,
    bikeTypeId: row.bikeTypeId,
    bikeName,
    bikeId: row.bikeId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    pickupAt: row.pickupAt.toISOString(),
    returnAt: row.returnAt.toISOString(),
    rentalDays: row.rentalDays,
    dailyRateUsdCents: row.dailyRateUsdCents,
    totalUsdCents: row.totalUsdCents,
    status: 'pending',
    holdExpiresAt: holdExpiresAt.toISOString(),
    draft: {
      pickupAt: row.pickupAt.toISOString(),
      returnAt: row.returnAt.toISOString(),
      days: row.rentalDays,
      dailyRate: row.dailyRateUsdCents / 100,
      total: row.totalUsdCents / 100,
    },
  }
}

export async function createPendingReservation(
  input: CreatePendingReservationInput,
  database: ReservationDatabase,
  options: CreatePendingReservationOptions = {},
): Promise<CreatePendingReservationResult> {
  const dateValidation = validateAvailabilityQuoteInput(input)
  const customerFieldErrors = validateCustomerDetails(input)

  if (!dateValidation.ok || Object.keys(customerFieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Please fix the highlighted fields before continuing.',
      fieldErrors: {
        ...(!dateValidation.ok ? dateValidation.fieldErrors : {}),
        ...customerFieldErrors,
      },
    }
  }

  const availability = await getBikeAvailability(
    {
      bikeTypeId: FEATURED_BIKE_TYPE_ID,
      pickupAt: dateValidation.pickupAt,
      returnAt: dateValidation.returnAt,
    },
    database,
  )

  if (!availability.bikeType || !availability.isAvailable) {
    return {
      status: 'unavailable',
      message: 'No PedalGo City Bikes are available for the selected dates. Please choose another time.',
    }
  }

  const quote = quoteRentalPrice(
    dateValidation.pickupAt,
    dateValidation.returnAt,
    availability.bikeType.dailyRateUsdCents,
  )
  const now = options.now ?? new Date()
  const holdExpiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000)
  const selectedBike = availability.availableBikes[0] ?? null
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
      pickupAt: dateValidation.pickupAt,
      returnAt: dateValidation.returnAt,
      rentalDays: quote.rentalDays,
      dailyRateUsdCents: quote.dailyRateUsdCents,
      totalUsdCents: quote.totalUsdCents,
      status: 'pending',
      notes: JSON.stringify({
        source: 'public_booking',
        holdStrategy: selectedBike ? 'assigned_bike' : 'capacity_hold',
        holdExpiresAt: holdExpiresAt.toISOString(),
      }),
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return {
    status: 'created',
    reservation: toPublicSummary(created, availability.bikeType.name, holdExpiresAt),
  }
}
