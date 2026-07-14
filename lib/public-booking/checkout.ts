import { randomUUID } from 'node:crypto'

import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

import type { db as appDb } from '@/lib/db/client'
import { payments, reservations } from '@/lib/db/schema'

const STRIPE_API_VERSION = '2026-06-24.dahlia'

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

type CheckoutReservation = typeof reservations.$inferSelect
type CheckoutPayment = typeof payments.$inferSelect

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

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`)
  }

  return value
}

function getAppUrl(options: CreateCheckoutSessionOptions): string {
  return (options.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

function getStripeCheckoutSessionCreator(): StripeCheckoutSessionCreator {
  const stripe = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
    apiVersion: STRIPE_API_VERSION,
  })

  return (params) => stripe.checkout.sessions.create(params)
}

function checkoutSessionParams(
  reservation: CheckoutReservation,
  payment: CheckoutPayment,
  appUrl: string,
): Stripe.Checkout.SessionCreateParams {
  return {
    mode: 'payment',
    customer_email: reservation.customerEmail,
    success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/booking/cancel?reservation=${encodeURIComponent(reservation.reference)}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: reservation.totalUsdCents,
          product_data: {
            name: `PedalGo City Bike reservation ${reservation.reference}`,
            description: `${reservation.rentalDays} day rental`,
          },
        },
      },
    ],
    metadata: {
      reservationId: reservation.id,
      reservationReference: reservation.reference,
      paymentId: payment.id,
    },
    payment_intent_data: {
      metadata: {
        reservationId: reservation.id,
        reservationReference: reservation.reference,
        paymentId: payment.id,
      },
    },
  }
}

export async function createReservationCheckoutSession(
  input: CreateCheckoutSessionInput,
  database: CheckoutDatabase,
  options: CreateCheckoutSessionOptions = {},
): Promise<CreateCheckoutSessionResult> {
  if (!input.reservationId.trim()) {
    return {
      status: 'error',
      message: 'Reservation is required before checkout can start.',
    }
  }

  const [reservation] = (await database
    .select()
    .from(reservations)
    .where(eq(reservations.id, input.reservationId))
    .limit(1)) as CheckoutReservation[]

  if (!reservation) {
    return {
      status: 'error',
      message: 'We could not find that pending reservation. Please start again.',
    }
  }

  if (reservation.status !== 'pending') {
    return {
      status: 'error',
      message: 'This reservation is no longer pending payment.',
    }
  }

  const now = options.now ?? new Date()
  const [payment] = await database
    .insert(payments)
    .values({
      id: options.idFactory?.() ?? randomUUID(),
      reservationId: reservation.id,
      amountUsdCents: reservation.totalUsdCents,
      status: 'pending',
      provider: 'stripe',
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const createStripeCheckoutSession = options.createStripeCheckoutSession ?? getStripeCheckoutSessionCreator()
  const session = await createStripeCheckoutSession(
    checkoutSessionParams(reservation, payment, getAppUrl(options)),
  )

  if (!session.url) {
    return {
      status: 'error',
      message: 'Stripe did not return a checkout URL. Please try again.',
    }
  }

  await database
    .update(payments)
    .set({
      providerCheckoutId: session.id,
      updatedAt: now,
    })
    .where(eq(payments.id, payment.id))

  return {
    status: 'created',
    checkoutUrl: session.url,
    checkoutSessionId: session.id,
    paymentId: payment.id,
  }
}
