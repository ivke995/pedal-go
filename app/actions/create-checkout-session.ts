'use server'

import { db } from '@/lib/db/client'
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
} from '@/lib/public-booking/checkout'

export async function createCheckoutSessionAction(
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> {
  try {
    const { createReservationCheckoutSession } = await import(
      '@/lib/public-booking/checkout'
    )

    return createReservationCheckoutSession(input, db)
  } catch (error) {
    console.error('Unable to create Stripe Checkout session', error)

    return {
      status: 'error',
      message: 'Checkout is temporarily unavailable. Please try again in a moment.',
    }
  }
}
