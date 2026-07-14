'use server'

import type {
  AvailabilityQuoteInput,
  AvailabilityQuoteResult,
} from '@/lib/public-booking/availability'

export async function checkFeaturedBikeAvailability(
  input: AvailabilityQuoteInput,
): Promise<AvailabilityQuoteResult> {
  try {
    const { getFeaturedBikeAvailabilityQuote } = await import(
      '@/lib/public-booking/availability'
    )

    return getFeaturedBikeAvailabilityQuote(input)
  } catch (error) {
    console.error('Unable to check featured bike availability', error)

    return {
      status: 'error',
      message:
        'Availability is temporarily unavailable. Please try again in a moment.',
      fieldErrors: {},
    }
  }
}
