import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { availabilityBlocks, bikes, bikeTypes, reservations } from '@/lib/db/schema'
import { createPendingReservation, getManualPaymentConfiguration } from '@/lib/public-booking/reservations'

process.env.TURSO_DATABASE_URL ??= 'file::memory:'

type Row = Record<string, unknown>

type Fixture = {
  bikeType?: Row
  bikeRows?: Row[]
  reservationRows?: Row[]
  blockRows?: Row[]
}

const bikeType = {
  id: 'bike-type-mvp-city-bike',
  name: 'PedalGo City Bike',
  slug: 'city-bike',
  description: 'Comfortable all-purpose city bike.',
  dailyRateUsdCents: 4800,
  imagePath: null,
  featuresJson: [],
  isActive: true,
  sortOrder: 1,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
}

const validInput = {
  pickupAt: '2026-07-14T10:00:00.000Z',
  returnAt: '2026-07-16T11:00:00.000Z',
  fullName: 'Jane Doe',
  email: 'Jane@example.com',
  phone: '+1 555 123 4567',
  paymentMethod: 'venmo',
}

const paymentConfig = {
  venmo: {
    fullName: 'Venmo Owner',
    handle: '@white-mountains',
    email: 'venmo@example.test',
    phone: '5551112222',
  },
  zelle: {
    fullName: 'Zelle Owner',
    email: 'zelle@example.test',
    phone: '5553334444',
  },
  ownerNotificationEmail: 'owner@example.test',
  emailFrom: 'White Mountains <bookings@example.test>',
}

function testOptions() {
  return {
    paymentConfig,
    emailSender: async () => undefined,
  }
}

function bike(id: string): Row {
  return {
    id,
    bikeTypeId: 'bike-type-mvp-city-bike',
    code: id.toUpperCase(),
    status: 'available',
    notes: null,
    lastServicedAt: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  }
}

function fakeDatabase(fixture: Fixture) {
  const insertedRows: Row[] = []

  return {
    insertedRows,
    select() {
      return {
        from(table: unknown) {
          const rows = rowsForTable(table, fixture)

          return {
            where() {
              return {
                limit(count: number) {
                  return Promise.resolve(rows.slice(0, count))
                },
                then(
                  resolve: (value: Row[]) => void,
                  reject?: (reason: unknown) => void,
                ) {
                  return Promise.resolve(rows).then(resolve, reject)
                },
              }
            },
          }
        },
      }
    },
    insert(table: unknown) {
      assert.equal(table, reservations)

      return {
        values(row: Row) {
          insertedRows.push(row)

          return {
            returning() {
              return Promise.resolve([row])
            },
          }
        },
      }
    },
  }
}

function rowsForTable(table: unknown, fixture: Fixture): Row[] {
  if (table === bikeTypes) return fixture.bikeType ? [fixture.bikeType] : []
  if (table === bikes) return fixture.bikeRows ?? []
  if (table === reservations) return fixture.reservationRows ?? []
  if (table === availabilityBlocks) return fixture.blockRows ?? []

  throw new Error('Unexpected table requested by pending reservation')
}

describe('public booking pending reservation', () => {
  it('returns field errors and does not insert for invalid customer details', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })

    const result = await createPendingReservation(
      { ...validInput, fullName: '', email: 'bad', phone: '12' },
      database as never,
      testOptions(),
    )

    assert.equal(result.status, 'error')
    assert.equal(result.fieldErrors.fullName, 'Please enter your full name.')
    assert.equal(result.fieldErrors.email, 'Please enter a valid email address.')
    assert.equal(result.fieldErrors.phone, 'Please enter a valid phone number.')
    assert.equal(database.insertedRows.length, 0)
  })

  it('re-validates availability and does not insert when unavailable', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [] })

    const result = await createPendingReservation(validInput, database as never, testOptions())

    assert.equal(result.status, 'unavailable')
    assert.match(result.message, /No city bikes are available/)
    assert.equal(database.insertedRows.length, 0)
  })

  it('fails safely without payment configuration and does not insert', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })
    const names = [
      'VENMO_NAME',
      'VENMO_HANDLE',
      'VENMO_EMAIL',
      'VENMO_PHONE',
      'ZELLE_NAME',
      'ZELLE_EMAIL',
      'ZELLE_PHONE',
      'OWNER_NOTIFICATION_EMAIL',
      'EMAIL_FROM',
    ]
    const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]))

    try {
      for (const name of names) delete process.env[name]

      const result = await createPendingReservation(validInput, database as never, {
        emailSender: async () => undefined,
      })

      assert.equal(result.status, 'error')
      assert.match(result.message, /not configured/i)
      assert.equal(database.insertedRows.length, 0)
    } finally {
      for (const name of names) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })

  it('loads complete typed Venmo and Zelle profiles from server configuration', () => {
    const names = [
      'VENMO_NAME',
      'VENMO_HANDLE',
      'VENMO_EMAIL',
      'VENMO_PHONE',
      'ZELLE_NAME',
      'ZELLE_EMAIL',
      'ZELLE_PHONE',
      'OWNER_NOTIFICATION_EMAIL',
      'EMAIL_FROM',
    ]
    const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]))

    try {
      process.env.VENMO_NAME = 'Radomir Kalkan'
      process.env.VENMO_HANDLE = '@Radomir-Kalkan'
      process.env.VENMO_EMAIL = 'Kalkanradomir@gmail.com'
      process.env.VENMO_PHONE = '6033481320'
      process.env.ZELLE_NAME = 'Radomir Kalkan'
      process.env.ZELLE_EMAIL = 'Kalkanradomir@gmail.com'
      process.env.ZELLE_PHONE = '6033481320'
      process.env.OWNER_NOTIFICATION_EMAIL = 'owner@example.test'
      process.env.EMAIL_FROM = 'White Mountains <bookings@example.test>'

      assert.deepEqual(getManualPaymentConfiguration(), {
        venmo: {
          fullName: 'Radomir Kalkan',
          handle: '@Radomir-Kalkan',
          email: 'Kalkanradomir@gmail.com',
          phone: '6033481320',
        },
        zelle: {
          fullName: 'Radomir Kalkan',
          email: 'Kalkanradomir@gmail.com',
          phone: '6033481320',
        },
        ownerNotificationEmail: 'owner@example.test',
        emailFrom: 'White Mountains <bookings@example.test>',
      })
    } finally {
      for (const name of names) {
        if (previous[name] === undefined) delete process.env[name]
        else process.env[name] = previous[name]
      }
    }
  })

  it('returns only the selected Venmo profile in the public summary', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })
    const result = await createPendingReservation(validInput, database as never, testOptions())

    assert.equal(result.status, 'created')
    assert.deepEqual(result.reservation.paymentInstructions.profile, paymentConfig.venmo)
    assert.equal('zelle' in result.reservation.paymentInstructions, false)
  })

  it('returns only the selected Zelle profile in the public summary', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })
    const result = await createPendingReservation(
      { ...validInput, paymentMethod: 'zelle' },
      database as never,
      testOptions(),
    )

    assert.equal(result.status, 'created')
    assert.deepEqual(result.reservation.paymentInstructions.profile, paymentConfig.zelle)
    assert.equal('venmo' in result.reservation.paymentInstructions, false)
  })

  it('fails safely for an incomplete selected payment profile and does not insert', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })

    const result = await createPendingReservation(validInput, database as never, {
      ...testOptions(),
      paymentConfig: {
        ...paymentConfig,
        venmo: { ...paymentConfig.venmo, phone: ' ' },
      },
    })

    assert.equal(result.status, 'error')
    assert.match(result.message, /not configured/i)
    assert.equal(database.insertedRows.length, 0)
  })

  it('creates a pending reservation with customer, price, bike hold, and expiry metadata', async () => {
    const now = new Date('2026-07-14T09:00:00.000Z')
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })

    const result = await createPendingReservation(validInput, database as never, {
      now,
      idFactory: () => 'reservation-1',
      referenceFactory: () => 'PG-TEST-0001',
      ...testOptions(),
    })

    assert.equal(result.status, 'created')
    assert.equal(result.reservation.reference, 'PG-TEST-0001')
    assert.equal(result.reservation.customerName, 'Jane Doe')
    assert.equal(result.reservation.customerEmail, 'jane@example.com')
    assert.equal(result.reservation.bikeId, 'bike-1')
    assert.equal(result.reservation.rentalDays, 3)
    assert.equal(result.reservation.dailyRateUsdCents, 4800)
    assert.equal(result.reservation.totalUsdCents, 14400)
    assert.equal(result.reservation.paymentMethod, 'venmo')
    assert.equal(result.reservation.paymentInstructions.recipient, '@white-mountains')
    assert.deepEqual(result.reservation.paymentInstructions.profile, paymentConfig.venmo)
    assert.match(result.reservation.paymentInstructions.instructions, /\$144\.00/)
    assert.equal(result.reservation.holdExpiresAt, '2026-07-14T09:30:00.000Z')
    assert.equal(database.insertedRows.length, 1)

    const inserted = database.insertedRows[0]
    assert.equal(inserted.status, 'pending_verification')
    assert.equal(inserted.paymentMethod, 'venmo')
    assert.equal(inserted.bikeId, 'bike-1')
    assert.deepEqual(JSON.parse(String(inserted.notes)), {
      source: 'public_booking',
      holdStrategy: 'assigned_bike',
      holdExpiresAt: '2026-07-14T09:30:00.000Z',
    })
  })

  it('keeps the reservation pending when notification delivery fails', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })
    const result = await createPendingReservation(validInput, database as never, {
      ...testOptions(),
      emailSender: async () => {
        throw new Error('mail provider unavailable')
      },
    })

    assert.equal(result.status, 'notification_error')
    assert.match(result.message, /remains pending manual confirmation/i)
    assert.equal(result.reservation.status, 'pending_verification')
    assert.equal(database.insertedRows[0].status, 'pending_verification')
  })
})
