import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import Stripe from 'stripe'

import { payments, reservations } from '@/lib/db/schema'
import type { ConfirmationEmailMessage } from '@/lib/public-booking/confirmation-email'
import { handleStripeWebhookEvent } from '@/lib/public-booking/webhooks'

process.env.TURSO_DATABASE_URL ??= 'file::memory:'
process.env.STRIPE_SECRET_KEY ??= 'sk_test_webhook_unit'
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_webhook_unit'

type Row = Record<string, unknown>

const pendingPayment = {
  id: 'payment-1',
  reservationId: 'reservation-1',
  amountUsdCents: 7500,
  status: 'pending',
  provider: 'stripe',
  providerPaymentId: null,
  providerCheckoutId: 'cs_test_123',
  paidAt: null,
  refundedAt: null,
  createdAt: new Date('2026-07-14T09:05:00.000Z'),
  updatedAt: new Date('2026-07-14T09:05:00.000Z'),
}

const pendingReservation = {
  id: 'reservation-1',
  reference: 'PG-TEST-0001',
  bikeTypeId: 'bike-type-mvp-city-bike',
  bikeId: 'bike-1',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '+1 555 123 4567',
  pickupAt: new Date('2026-07-14T10:00:00.000Z'),
  returnAt: new Date('2026-07-16T11:00:00.000Z'),
  rentalDays: 3,
  dailyRateUsdCents: 2500,
  totalUsdCents: 7500,
  status: 'pending',
  notes: null,
  createdAt: new Date('2026-07-14T09:00:00.000Z'),
  updatedAt: new Date('2026-07-14T09:00:00.000Z'),
}

function checkoutEvent(type: 'checkout.session.completed' | 'checkout.session.expired'): Stripe.Event {
  return {
    id: `evt_${type}`,
    object: 'event',
    api_version: '2026-06-24.dahlia',
    created: 1784039700,
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        amount_total: 7500,
        currency: 'usd',
        metadata: {
          reservationId: 'reservation-1',
          reservationReference: 'PG-TEST-0001',
          paymentId: 'payment-1',
        },
        payment_intent: 'pi_test_123',
        payment_status: type === 'checkout.session.completed' ? 'paid' : 'unpaid',
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type,
  } as unknown as Stripe.Event
}

function failedPaymentIntentEvent(): Stripe.Event {
  return {
    id: 'evt_payment_intent.payment_failed',
    object: 'event',
    api_version: '2026-06-24.dahlia',
    created: 1784039700,
    data: {
      object: {
        id: 'pi_test_123',
        object: 'payment_intent',
        amount: 7500,
        currency: 'usd',
        metadata: {
          reservationId: 'reservation-1',
          reservationReference: 'PG-TEST-0001',
          paymentId: 'payment-1',
        },
        status: 'requires_payment_method',
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: 'payment_intent.payment_failed',
  } as unknown as Stripe.Event
}

function fakeDatabase(selectRows: Row[][]) {
  const updatedPayments: Row[] = []
  const updatedReservations: Row[] = []

  return {
    updatedPayments,
    updatedReservations,
    select() {
      return {
        from(table: unknown) {
          assert.ok(table === payments || table === reservations)

          return {
            where() {
              return {
                limit() {
                  return Promise.resolve(selectRows.shift() ?? [])
                },
              }
            },
          }
        },
      }
    },
    update(table: unknown) {
      return {
        set(row: Row) {
          if (table === payments) {
            updatedPayments.push(row)
          } else if (table === reservations) {
            updatedReservations.push(row)
          } else {
            assert.fail('Unexpected table update')
          }

          return {
            where() {
              return Promise.resolve()
            },
          }
        },
      }
    },
  }
}

describe('public booking Stripe webhooks', () => {
  it('confirms pending reservation from verified paid checkout session event', async () => {
    const now = new Date('2026-07-14T09:20:00.000Z')
    const database = fakeDatabase([[pendingPayment], [pendingReservation]])
    const sentEmails: ConfirmationEmailMessage[] = []

    const result = await handleStripeWebhookEvent(checkoutEvent('checkout.session.completed'), database as never, {
      now,
      sendConfirmationEmail: async (message) => {
        sentEmails.push(message)
      },
    })

    assert.equal(result.status, 'handled')
    assert.deepEqual(database.updatedPayments[0], {
      status: 'confirmed',
      providerCheckoutId: 'cs_test_123',
      providerPaymentId: 'pi_test_123',
      paidAt: new Date('2026-07-14T14:35:00.000Z'),
      updatedAt: now,
    })
    assert.deepEqual(database.updatedReservations[0], {
      status: 'confirmed',
      updatedAt: now,
    })
    assert.equal(sentEmails.length, 1)
    assert.equal(sentEmails[0]?.to, 'jane@example.com')
    assert.equal(sentEmails[0]?.subject, 'PedalGo reservation confirmed: PG-TEST-0001')
    assert.match(sentEmails[0]?.text ?? '', /Reservation number: PG-TEST-0001/)
    assert.match(sentEmails[0]?.text ?? '', /Pickup: Jul 14, 2026, 10:00 AM UTC/)
    assert.match(sentEmails[0]?.text ?? '', /Return: Jul 16, 2026, 11:00 AM UTC/)
    assert.match(sentEmails[0]?.text ?? '', /Total paid: \$75\.00/)
    assert.match(sentEmails[0]?.text ?? '', /Pickup location: PedalGo, Obala Kulina bana 12, Sarajevo/)
    assert.match(sentEmails[0]?.text ?? '', /Contact: hello@pedalgo\.example · \+387 33 000 000/)
    assert.match(sentEmails[0]?.text ?? '', /Pickup instructions: Bring your reservation number and a valid photo ID/)
  })

  it('keeps duplicate successful webhook deliveries idempotent for already confirmed reservations', async () => {
    const now = new Date('2026-07-14T09:20:00.000Z')
    const database = fakeDatabase([
      [{ ...pendingPayment, status: 'confirmed', paidAt: new Date('2026-07-14T09:15:00.000Z') }],
      [{ ...pendingReservation, status: 'confirmed' }],
    ])
    const sentEmails: ConfirmationEmailMessage[] = []

    const result = await handleStripeWebhookEvent(checkoutEvent('checkout.session.completed'), database as never, {
      now,
      sendConfirmationEmail: async (message) => {
        sentEmails.push(message)
      },
    })

    assert.equal(result.status, 'handled')
    assert.equal(database.updatedPayments.length, 1)
    assert.equal(database.updatedReservations.length, 0)
    assert.equal(sentEmails.length, 0)
  })

  it('does not confirm the reservation when confirmation email sending fails', async () => {
    const now = new Date('2026-07-14T09:20:00.000Z')
    const database = fakeDatabase([[pendingPayment], [pendingReservation]])

    await assert.rejects(
      handleStripeWebhookEvent(checkoutEvent('checkout.session.completed'), database as never, {
        now,
        sendConfirmationEmail: async () => {
          throw new Error('Email provider rejected sender')
        },
      }),
      /Email provider rejected sender/,
    )

    assert.deepEqual(database.updatedPayments[0], {
      status: 'confirmed',
      providerCheckoutId: 'cs_test_123',
      providerPaymentId: 'pi_test_123',
      paidAt: new Date('2026-07-14T14:35:00.000Z'),
      updatedAt: now,
    })
    assert.equal(database.updatedReservations.length, 0)
  })

  it('marks pending reservation failed when checkout session expires', async () => {
    const now = new Date('2026-07-14T09:35:00.000Z')
    const database = fakeDatabase([[pendingPayment], [pendingReservation]])

    const result = await handleStripeWebhookEvent(checkoutEvent('checkout.session.expired'), database as never, { now })

    assert.equal(result.status, 'handled')
    assert.deepEqual(database.updatedPayments[0], {
      status: 'failed',
      providerPaymentId: 'pi_test_123',
      updatedAt: now,
    })
    assert.deepEqual(database.updatedReservations[0], {
      status: 'failed',
      updatedAt: now,
    })
  })

  it('marks pending reservation failed when payment intent fails', async () => {
    const now = new Date('2026-07-14T09:35:00.000Z')
    const database = fakeDatabase([[pendingPayment], [pendingReservation]])

    const result = await handleStripeWebhookEvent(failedPaymentIntentEvent(), database as never, { now })

    assert.equal(result.status, 'handled')
    assert.deepEqual(database.updatedPayments[0], {
      status: 'failed',
      providerPaymentId: 'pi_test_123',
      updatedAt: now,
    })
    assert.deepEqual(database.updatedReservations[0], {
      status: 'failed',
      updatedAt: now,
    })
  })

  it('rejects webhook route requests with invalid Stripe signatures', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route')
    const payload = JSON.stringify({ id: 'evt_bad', object: 'event', type: 'checkout.session.completed' })
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: 'whsec_wrong_secret',
    })

    const response = await POST(
      new Request('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: payload,
        headers: {
          'stripe-signature': signature,
        },
      }),
    )

    assert.equal(response.status, 400)
  })
})
