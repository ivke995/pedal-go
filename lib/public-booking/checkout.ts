import Stripe from 'stripe'

import type { db as appDb } from '@/lib/db/client'

export type CreateCheckoutSessionInput = {
  reservationId: string
}

export type CreateCheckoutSessionResult =
  | {
      status: 'created'
      checkoutUrl: string
      checkoutSessionId: string
      paymentId: string
    }
  | {
      status: 'error'
      message: string
    }

type CheckoutDatabase = typeof appDb

export type StripeCheckoutSessionCreator = (params: Stripe.Checkout.SessionCreateParams) => Promise<{
  id: string
  url: string | null
}>

export type CreateCheckoutSessionOptions = {
  now?: Date
  idFactory?: () => string
  appUrl?: string
  createStripeCheckoutSession?: StripeCheckoutSessionCreator
}

/**
 * Transitional boundary kept until the booking flow is replaced by manual payment submission.
 * T01 removes provider persistence first; T03/T05 remove this provider route entirely.
 */
export async function createReservationCheckoutSession(
  input: CreateCheckoutSessionInput,
  _database: CheckoutDatabase,
  options: CreateCheckoutSessionOptions = {},
): Promise<CreateCheckoutSessionResult> {
  void options

  if (!input.reservationId.trim()) {
    return {
      status: 'error',
      message: 'Reservation is required before checkout can start.',
    }
  }

  return {
    status: 'error',
    message: 'External payment submission is replacing card checkout. Please start the booking again.',
  }
}
