import { getBikeAvailability } from '@/lib/domain/availability'
import { quoteRentalPrice } from '@/lib/domain/pricing'
import type { BookingDraft } from '@/lib/types'

export const FEATURED_BIKE_TYPE_ID = 'bike-type-mvp-city-bike'

export type AvailabilityQuoteInput = {
  pickupAt: string
  returnAt: string
}

export type AvailabilityQuoteFieldErrors = {
  pickupAt?: string
  returnAt?: string
}

export type AvailabilityQuoteResult =
  | {
      status: 'available'
      draft: BookingDraft
      bikeTypeId: string
      bikeName: string
      availableUnits: number
      dailyRateUsdCents: number
      totalUsdCents: number
    }
  | {
      status: 'unavailable'
      message: string
      bikeTypeId: string
      bikeName?: string
      pickupAt: string
      returnAt: string
      days: number
    }
  | {
      status: 'error'
      message: string
      fieldErrors: AvailabilityQuoteFieldErrors
    }

type AvailabilityDatabase = Parameters<typeof getBikeAvailability>[1]

function parseDate(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function validateAvailabilityQuoteInput(
  input: AvailabilityQuoteInput,
):
  | { ok: true; pickupAt: Date; returnAt: Date }
  | { ok: false; fieldErrors: AvailabilityQuoteFieldErrors } {
  const fieldErrors: AvailabilityQuoteFieldErrors = {}
  const pickupAt = parseDate(input.pickupAt)
  const returnAt = parseDate(input.returnAt)

  if (!input.pickupAt) {
    fieldErrors.pickupAt = 'Please choose a pickup date and time.'
  } else if (!pickupAt) {
    fieldErrors.pickupAt = 'Please choose a valid pickup date and time.'
  }

  if (!input.returnAt) {
    fieldErrors.returnAt = 'Please choose a return date and time.'
  } else if (!returnAt) {
    fieldErrors.returnAt = 'Please choose a valid return date and time.'
  }

  if (pickupAt && returnAt && returnAt.getTime() <= pickupAt.getTime()) {
    fieldErrors.returnAt = 'Return date and time must be after the pickup.'
  }

  if (Object.keys(fieldErrors).length > 0 || !pickupAt || !returnAt) {
    return { ok: false, fieldErrors }
  }

  return { ok: true, pickupAt, returnAt }
}

export async function getFeaturedBikeAvailabilityQuote(
  input: AvailabilityQuoteInput,
  database?: AvailabilityDatabase,
): Promise<AvailabilityQuoteResult> {
  const validation = validateAvailabilityQuoteInput(input)

  if (!validation.ok) {
    return {
      status: 'error',
      message: 'Please fix the highlighted date and time fields.',
      fieldErrors: validation.fieldErrors,
    }
  }

  const availability = await getBikeAvailability(
    {
      bikeTypeId: FEATURED_BIKE_TYPE_ID,
      pickupAt: validation.pickupAt,
      returnAt: validation.returnAt,
    },
    database,
  )

  if (!availability.bikeType) {
    return {
      status: 'unavailable',
      message: 'The featured PedalGo bike is not available right now.',
      bikeTypeId: FEATURED_BIKE_TYPE_ID,
      pickupAt: input.pickupAt,
      returnAt: input.returnAt,
      days: availability.rentalDays,
    }
  }

  if (!availability.isAvailable) {
    return {
      status: 'unavailable',
      message: 'No PedalGo City Bikes are available for the selected dates.',
      bikeTypeId: availability.bikeType.id,
      bikeName: availability.bikeType.name,
      pickupAt: input.pickupAt,
      returnAt: input.returnAt,
      days: availability.rentalDays,
    }
  }

  const quote = quoteRentalPrice(
    validation.pickupAt,
    validation.returnAt,
    availability.bikeType.dailyRateUsdCents,
  )
  const dailyRate = quote.dailyRateUsdCents / 100
  const total = quote.totalUsdCents / 100

  return {
    status: 'available',
    draft: {
      pickupAt: input.pickupAt,
      returnAt: input.returnAt,
      days: quote.rentalDays,
      dailyRate,
      total,
    },
    bikeTypeId: availability.bikeType.id,
    bikeName: availability.bikeType.name,
    availableUnits: availability.availableBikes.length,
    dailyRateUsdCents: quote.dailyRateUsdCents,
    totalUsdCents: quote.totalUsdCents,
  }
}
