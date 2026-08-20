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
    profile: {
      fullName: 'Venmo Owner',
      handle: '@white-mountains',
      email: 'venmo@example.test',
      phone: '5551112222',
    },
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
      profile: {
        fullName: 'Venmo Owner',
        handle: '@white-mountains',
        email: 'venmo@example.test',
        phone: '5551112222',
      },
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
    assert.match(messages.customer.text, /Account name: Venmo Owner/)
    assert.match(messages.customer.text, /Venmo handle: @white-mountains/)
    assert.match(messages.customer.text, /Payment email: venmo@example\.test/)
    assert.match(messages.customer.text, /Payment phone: 5551112222/)
    assert.match(messages.customer.text, /Payment pending manual confirmation/)
    assert.match(messages.owner.text, /Customer phone: \+1 555 123 4567/)
    assert.doesNotMatch(messages.customer.text, /Your reservation is confirmed|payment was confirmed|total paid/i)
  })

  it('includes only the selected Zelle profile', () => {
    const zelleInstructions: ManualPaymentInstructions = {
      method: 'zelle',
      profile: {
        fullName: 'Zelle Owner',
        email: 'zelle@example.test',
        phone: '5553334444',
      },
      recipient: 'zelle@example.test',
      instructions: 'Send $144.00 via Zelle to zelle@example.test.',
    }
    const messages = buildReservationNotificationMessages(reservation, zelleInstructions, {
      emailFrom: 'White Mountains <bookings@example.test>',
      ownerNotificationEmail: 'owner@example.test',
    })

    assert.match(messages.customer.text, /Account name: Zelle Owner/)
    assert.match(messages.customer.text, /Payment email: zelle@example\.test/)
    assert.match(messages.customer.text, /Payment phone: 5553334444/)
    assert.doesNotMatch(messages.customer.text, /Venmo handle|Venmo Owner|venmo@example\.test|5551112222/)
    assert.doesNotMatch(messages.customer.html, /Venmo handle|Venmo Owner|venmo@example\.test|5551112222/)
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

  it('escapes configured payment profile values in HTML', () => {
    const hostileInstructions: ManualPaymentInstructions = {
      method: 'venmo',
      profile: {
        fullName: '<img src=x onerror=alert(1)>',
        handle: '";alert(1);//',
        email: "pay<'@example.test",
        phone: '<script>alert(1)</script>',
      },
      recipient: '<venmo-recipient>',
      instructions: 'Pay <exactly> and include "the reference".',
    }
    const messages = buildReservationNotificationMessages(reservation, hostileInstructions, {
      emailFrom: 'White Mountains <bookings@example.test>',
      ownerNotificationEmail: 'owner@example.test',
    })

    assert.match(messages.customer.html, /&lt;img src=x onerror=alert\(1\)&gt;/)
    assert.match(messages.customer.html, /&quot;;alert\(1\);\/\//)
    assert.match(messages.customer.html, /pay&lt;&#39;@example\.test/)
    assert.match(messages.customer.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
    assert.doesNotMatch(messages.customer.html, /<img|<script>/)
  })
})
