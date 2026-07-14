import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { availabilityBlocks, bikes, bikeTypes, reservations } from '@/lib/db/schema'
import { createPendingReservation } from '@/lib/public-booking/reservations'

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
  dailyRateUsdCents: 2500,
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
    )

    assert.equal(result.status, 'error')
    assert.equal(result.fieldErrors.fullName, 'Please enter your full name.')
    assert.equal(result.fieldErrors.email, 'Please enter a valid email address.')
    assert.equal(result.fieldErrors.phone, 'Please enter a valid phone number.')
    assert.equal(database.insertedRows.length, 0)
  })

  it('re-validates availability and does not insert when unavailable', async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [] })

    const result = await createPendingReservation(validInput, database as never)

    assert.equal(result.status, 'unavailable')
    assert.match(result.message, /No PedalGo City Bikes are available/)
    assert.equal(database.insertedRows.length, 0)
  })

  it('creates a pending reservation with customer, price, bike hold, and expiry metadata', async () => {
    const now = new Date('2026-07-14T09:00:00.000Z')
    const database = fakeDatabase({ bikeType, bikeRows: [bike('bike-1')] })

    const result = await createPendingReservation(validInput, database as never, {
      now,
      idFactory: () => 'reservation-1',
      referenceFactory: () => 'PG-TEST-0001',
    })

    assert.equal(result.status, 'created')
    assert.equal(result.reservation.reference, 'PG-TEST-0001')
    assert.equal(result.reservation.customerName, 'Jane Doe')
    assert.equal(result.reservation.customerEmail, 'jane@example.com')
    assert.equal(result.reservation.bikeId, 'bike-1')
    assert.equal(result.reservation.rentalDays, 3)
    assert.equal(result.reservation.dailyRateUsdCents, 2500)
    assert.equal(result.reservation.totalUsdCents, 7500)
    assert.equal(result.reservation.holdExpiresAt, '2026-07-14T09:30:00.000Z')
    assert.equal(database.insertedRows.length, 1)

    const inserted = database.insertedRows[0]
    assert.equal(inserted.status, 'pending')
    assert.equal(inserted.bikeId, 'bike-1')
    assert.deepEqual(JSON.parse(String(inserted.notes)), {
      source: 'public_booking',
      holdStrategy: 'assigned_bike',
      holdExpiresAt: '2026-07-14T09:30:00.000Z',
    })
  })
})
