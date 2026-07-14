import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { payments, reservations } from '@/lib/db/schema'
import { createReservationCheckoutSession } from '@/lib/public-booking/checkout'
import type Stripe from 'stripe'

process.env.TURSO_DATABASE_URL ??= 'file::memory:'

type Row = Record<string, unknown>

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

function fakeDatabase(reservationRows: Row[]) {
  const insertedPayments: Row[] = []
  const updatedPayments: Row[] = []

  return {
    insertedPayments,
    updatedPayments,
    select() {
      return {
        from(table: unknown) {
          assert.equal(table, reservations)

          return {
            where() {
              return {
                limit(count: number) {
                  return Promise.resolve(reservationRows.slice(0, count))
                },
              }
            },
          }
        },
      }
    },
    insert(table: unknown) {
      assert.equal(table, payments)

      return {
        values(row: Row) {
          insertedPayments.push(row)

          return {
            returning() {
              return Promise.resolve([row])
            },
          }
        },
      }
    },
    update(table: unknown) {
      assert.equal(table, payments)

      return {
        set(row: Row) {
          updatedPayments.push(row)

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

describe('public booking Stripe checkout', () => {
  it('creates a pending Stripe payment and checkout session with reservation metadata', async () => {
    const database = fakeDatabase([pendingReservation])
    const sessionParams: Stripe.Checkout.SessionCreateParams[] = []

    const result = await createReservationCheckoutSession(
      { reservationId: 'reservation-1' },
      database as never,
      {
        now: new Date('2026-07-14T09:05:00.000Z'),
        idFactory: () => 'payment-1',
        appUrl: 'https://pedalgo.example',
        createStripeCheckoutSession: async (params) => {
          sessionParams.push(params)
          return {
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/c/pay/cs_test_123',
          }
        },
      },
    )

    assert.equal(result.status, 'created')
    assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_123')
    assert.equal(result.checkoutSessionId, 'cs_test_123')
    assert.equal(result.paymentId, 'payment-1')

    assert.equal(database.insertedPayments.length, 1)
    assert.deepEqual(database.insertedPayments[0], {
      id: 'payment-1',
      reservationId: 'reservation-1',
      amountUsdCents: 7500,
      status: 'pending',
      provider: 'stripe',
      createdAt: new Date('2026-07-14T09:05:00.000Z'),
      updatedAt: new Date('2026-07-14T09:05:00.000Z'),
    })
    assert.deepEqual(database.updatedPayments[0], {
      providerCheckoutId: 'cs_test_123',
      updatedAt: new Date('2026-07-14T09:05:00.000Z'),
    })

    assert.equal(sessionParams[0].mode, 'payment')
    assert.equal(sessionParams[0].customer_email, 'jane@example.com')
    assert.equal(sessionParams[0].success_url, 'https://pedalgo.example/booking/success?session_id={CHECKOUT_SESSION_ID}')
    assert.equal(sessionParams[0].cancel_url, 'https://pedalgo.example/booking/cancel?reservation=PG-TEST-0001')
    assert.equal(sessionParams[0].line_items?.[0]?.price_data?.currency, 'usd')
    assert.equal(sessionParams[0].line_items?.[0]?.price_data?.unit_amount, 7500)
    assert.deepEqual(sessionParams[0].metadata, {
      reservationId: 'reservation-1',
      reservationReference: 'PG-TEST-0001',
      paymentId: 'payment-1',
    })
    assert.deepEqual(sessionParams[0].payment_intent_data?.metadata, {
      reservationId: 'reservation-1',
      reservationReference: 'PG-TEST-0001',
      paymentId: 'payment-1',
    })
  })

  it('does not create checkout for non-pending reservations', async () => {
    const database = fakeDatabase([{ ...pendingReservation, status: 'confirmed' }])

    const result = await createReservationCheckoutSession(
      { reservationId: 'reservation-1' },
      database as never,
      {
        createStripeCheckoutSession: async () => {
          throw new Error('Stripe should not be called')
        },
      },
    )

    assert.equal(result.status, 'error')
    assert.equal(result.message, 'This reservation is no longer pending payment.')
    assert.equal(database.insertedPayments.length, 0)
  })
})
