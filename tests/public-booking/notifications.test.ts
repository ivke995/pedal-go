import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildReservationNotificationMessages } from '@/lib/public-booking/confirmation-email'
import type {
  ManualPaymentInstructions,
  PendingReservationSummary,
} from '@/lib/public-booking/reservations'

const reservation: PendingReservationSummary = {
  id: 'reservation-1',
  reference: 'PG-TEST-0001',
  bikeTypeId: 'bike-type-mvp-city-bike',
  bikeName: 'White Mountains City Bike',
  bikeId: 'bike-1',
  customerName: '<Jane Doe>',
  customerEmail: 'jane@example.test',
  customerPhone: '+1 555 123 4567',
  pickupAt: '2026-07-14T10:00:00.000Z',
  returnAt: '2026-07-16T11:00:00.000Z',
  rentalDays: 3,
  dailyRateUsdCents: 4800,
  totalUsdCents: 14400,
  status: 'pending_verification',
  paymentMethod: 'venmo',
  paymentInstructions: {
    method: 'venmo',
    recipient: '@white-mountains',
    instructions: 'Send $144.00 via Venmo to @white-mountains.',
  },
  holdExpiresAt: '2026-07-14T10:30:00.000Z',
  draft: {
    pickupAt: '2026-07-14T10:00:00.000Z',
    returnAt: '2026-07-16T11:00:00.000Z',
    days: 3,
    dailyRate: 48,
    total: 144,
  },
}

describe('manual payment reservation notifications', () => {
  it('builds separate customer and owner messages without confirmation language', () => {
    const instructions: ManualPaymentInstructions = {
      method: 'venmo',
      recipient: '@white-mountains',
      instructions: 'Send $144.00 via Venmo to @white-mountains.',
    }
    const messages = buildReservationNotificationMessages(reservation, instructions, {
      emailFrom: 'White Mountains <bookings@example.test>',
      ownerNotificationEmail: 'owner@example.test',
    })

    assert.equal(messages.customer.to, 'jane@example.test')
    assert.equal(messages.owner.to, 'owner@example.test')
    assert.equal(messages.customer.from, 'White Mountains <bookings@example.test>')
    assert.match(messages.customer.text, /PG-TEST-0001/)
    assert.match(messages.customer.text, /\$144\.00/)
    assert.match(messages.customer.text, /Payment pending manual confirmation/)
    assert.match(messages.owner.text, /Customer phone: \+1 555 123 4567/)
    assert.doesNotMatch(messages.customer.text, /Your reservation is confirmed|payment was confirmed|total paid/i)
  })

  it('escapes customer-controlled values in HTML', () => {
    const messages = buildReservationNotificationMessages(
      reservation,
      reservation.paymentInstructions,
      {
        emailFrom: 'White Mountains <bookings@example.test>',
        ownerNotificationEmail: 'owner@example.test',
      },
    )

    assert.match(messages.customer.html, /&lt;Jane Doe&gt;/)
    assert.doesNotMatch(messages.customer.html, /<Jane Doe>/)
  })
})
