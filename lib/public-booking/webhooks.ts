import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'

import type { db as appDb } from '@/lib/db/client'
import { payments, reservations } from '@/lib/db/schema'
import {
  buildConfirmationEmailMessage,
  createResendConfirmationEmailSender,
  type ConfirmationEmailSender,
} from './confirmation-email'

type WebhookDatabase = typeof appDb
type PaymentRow = typeof payments.$inferSelect
type ReservationRow = typeof reservations.$inferSelect

export type StripeWebhookResult = {
  status: 'handled' | 'ignored'
  message: string
}

function eventCreatedAt(event: Stripe.Event, fallback: Date): Date {
  return event.created ? new Date(event.created * 1000) : fallback
}

function checkoutSessionPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  if (typeof session.payment_intent === 'string') {
    return session.payment_intent
  }

  return session.payment_intent?.id ?? null
}

async function findPaymentForCheckoutSession(
  session: Stripe.Checkout.Session,
  database: WebhookDatabase,
): Promise<PaymentRow | null> {
  const metadataPaymentId = session.metadata?.paymentId

  if (metadataPaymentId) {
    const [payment] = (await database.select().from(payments).where(eq(payments.id, metadataPaymentId)).limit(1)) as PaymentRow[]

    if (payment) {
      return payment
    }
  }

  const [payment] = (await database
    .select()
    .from(payments)
    .where(eq(payments.providerCheckoutId, session.id))
    .limit(1)) as PaymentRow[]

  return payment ?? null
}

async function findPaymentForPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  database: WebhookDatabase,
): Promise<PaymentRow | null> {
  const metadataPaymentId = paymentIntent.metadata?.paymentId

  if (metadataPaymentId) {
    const [payment] = (await database.select().from(payments).where(eq(payments.id, metadataPaymentId)).limit(1)) as PaymentRow[]

    if (payment) {
      return payment
    }
  }

  const [payment] = (await database
    .select()
    .from(payments)
    .where(eq(payments.providerPaymentId, paymentIntent.id))
    .limit(1)) as PaymentRow[]

  return payment ?? null
}

async function findReservation(payment: PaymentRow, database: WebhookDatabase): Promise<ReservationRow | null> {
  const [reservation] = (await database
    .select()
    .from(reservations)
    .where(eq(reservations.id, payment.reservationId))
    .limit(1)) as ReservationRow[]

  return reservation ?? null
}

async function confirmPaidCheckoutSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  database: WebhookDatabase,
  now: Date,
  sendConfirmationEmail?: ConfirmationEmailSender,
): Promise<StripeWebhookResult> {
  if (session.payment_status !== 'paid') {
    return {
      status: 'ignored',
      message: 'Checkout session is not paid.',
    }
  }

  const payment = await findPaymentForCheckoutSession(session, database)

  if (!payment) {
    return {
      status: 'ignored',
      message: 'Payment record not found for checkout session.',
    }
  }

  if (session.amount_total !== null && session.amount_total !== payment.amountUsdCents) {
    return {
      status: 'ignored',
      message: 'Checkout session amount does not match payment record.',
    }
  }

  const reservation = await findReservation(payment, database)

  if (!reservation) {
    return {
      status: 'ignored',
      message: 'Reservation record not found for checkout session payment.',
    }
  }

  const paidAt = eventCreatedAt(event, now)
  const providerPaymentId = checkoutSessionPaymentIntentId(session)

  await database
    .update(payments)
    .set({
      status: 'confirmed',
      providerCheckoutId: session.id,
      providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
      paidAt,
      updatedAt: now,
    })
    .where(eq(payments.id, payment.id))

  if (reservation.status === 'pending') {
    const emailSender = sendConfirmationEmail ?? createResendConfirmationEmailSender()

    await emailSender(buildConfirmationEmailMessage({
      ...reservation,
      status: 'confirmed',
      updatedAt: now,
    }))

    await database
      .update(reservations)
      .set({
        status: 'confirmed',
        updatedAt: now,
      })
      .where(eq(reservations.id, reservation.id))
  }

  return {
    status: 'handled',
    message: 'Checkout session payment confirmed reservation.',
  }
}

async function failPaymentAndReservation(
  payment: PaymentRow,
  database: WebhookDatabase,
  now: Date,
  providerPaymentId?: string | null,
): Promise<StripeWebhookResult> {
  const reservation = await findReservation(payment, database)

  await database
    .update(payments)
    .set({
      status: 'failed',
      providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
      updatedAt: now,
    })
    .where(eq(payments.id, payment.id))

  if (reservation?.status === 'pending') {
    await database
      .update(reservations)
      .set({
        status: 'failed',
        updatedAt: now,
      })
      .where(eq(reservations.id, reservation.id))
  }

  return {
    status: 'handled',
    message: 'Payment failure recorded.',
  }
}

async function handleExpiredCheckoutSession(
  session: Stripe.Checkout.Session,
  database: WebhookDatabase,
  now: Date,
): Promise<StripeWebhookResult> {
  const payment = await findPaymentForCheckoutSession(session, database)

  if (!payment) {
    return {
      status: 'ignored',
      message: 'Payment record not found for expired checkout session.',
    }
  }

  return failPaymentAndReservation(payment, database, now, checkoutSessionPaymentIntentId(session))
}

async function handleFailedPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  database: WebhookDatabase,
  now: Date,
): Promise<StripeWebhookResult> {
  const payment = await findPaymentForPaymentIntent(paymentIntent, database)

  if (!payment) {
    return {
      status: 'ignored',
      message: 'Payment record not found for failed payment intent.',
    }
  }

  return failPaymentAndReservation(payment, database, now, paymentIntent.id)
}

export async function handleStripeWebhookEvent(
  event: Stripe.Event,
  database: WebhookDatabase,
  options: { now?: Date; sendConfirmationEmail?: ConfirmationEmailSender } = {},
): Promise<StripeWebhookResult> {
  const now = options.now ?? new Date()

  switch (event.type) {
    case 'checkout.session.completed':
      return confirmPaidCheckoutSession(
        event,
        event.data.object as Stripe.Checkout.Session,
        database,
        now,
        options.sendConfirmationEmail,
      )
    case 'checkout.session.expired':
      return handleExpiredCheckoutSession(event.data.object as Stripe.Checkout.Session, database, now)
    case 'payment_intent.payment_failed':
      return handleFailedPaymentIntent(event.data.object as Stripe.PaymentIntent, database, now)
    default:
      return {
        status: 'ignored',
        message: `Unhandled Stripe event type: ${event.type}.`,
      }
  }
}
