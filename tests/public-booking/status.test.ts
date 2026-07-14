import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { payments, reservations } from '@/lib/db/schema'
import {
  getBookingStatusByCheckoutSession,
  getBookingStatusByReservationReference,
} from '@/lib/public-booking/status'

process.env.TURSO_DATABASE_URL ??= 'file::memory:'

type Row = Record<string, unknown>

const reservation = {
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

const payment = {
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

function fakeDatabase(reservationRows: Row[], paymentRows: Row[]) {
  return {
    select() {
      return {
        from(table: unknown) {
          return {
            where() {
              return {
                limit(count: number) {
                  if (table === reservations) {
                    return Promise.resolve(reservationRows.slice(0, count))
                  }

                  assert.equal(table, payments)
                  return Promise.resolve(paymentRows.slice(0, count))
                },
              }
            },
          }
        },
      }
    },
  }
}

describe('public booking status lookup', () => {
  it('classifies a checkout session with pending payment as processing', async () => {
    const result = await getBookingStatusByCheckoutSession(
      'cs_test_123',
      fakeDatabase([reservation], [payment]) as never,
    )

    assert.equal(result.status, 'found')
    assert.equal(result.summary.kind, 'processing')
    assert.equal(result.summary.reservationReference, 'PG-TEST-0001')
    assert.equal(result.summary.paymentStatus, 'pending')
  })

  it('classifies confirmed reservation and payment as confirmed', async () => {
    const result = await getBookingStatusByCheckoutSession(
      'cs_test_123',
      fakeDatabase(
        [{ ...reservation, status: 'confirmed' }],
        [{ ...payment, status: 'confirmed' }],
      ) as never,
    )

    assert.equal(result.status, 'found')
    assert.equal(result.summary.kind, 'confirmed')
  })

  it('classifies failed payment as failed', async () => {
    const result = await getBookingStatusByCheckoutSession(
      'cs_test_123',
      fakeDatabase(
        [{ ...reservation, status: 'failed' }],
        [{ ...payment, status: 'failed' }],
      ) as never,
    )

    assert.equal(result.status, 'found')
    assert.equal(result.summary.kind, 'failed')
  })

  it('supports cancel page lookup by reservation reference without mutating status', async () => {
    const result = await getBookingStatusByReservationReference(
      'PG-TEST-0001',
      fakeDatabase([reservation], [payment]) as never,
    )

    assert.equal(result.status, 'found')
    assert.equal(result.summary.kind, 'processing')
    assert.equal(result.summary.reservationStatus, 'pending')
  })
})
