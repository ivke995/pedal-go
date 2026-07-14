import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { availabilityBlocks, bikes, bikeTypes, reservations } from '@/lib/db/schema'

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
  return {
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
  }
}

function rowsForTable(table: unknown, fixture: Fixture): Row[] {
  if (table === bikeTypes) return fixture.bikeType ? [fixture.bikeType] : []
  if (table === bikes) return fixture.bikeRows ?? []
  if (table === reservations) return fixture.reservationRows ?? []
  if (table === availabilityBlocks) return fixture.blockRows ?? []

  throw new Error('Unexpected table requested by availability quote')
}

async function quote(fixture: Fixture, pickupAt = '2026-07-14T10:00') {
  const { getFeaturedBikeAvailabilityQuote } = await import(
    '@/lib/public-booking/availability'
  )

  return getFeaturedBikeAvailabilityQuote(
    { pickupAt, returnAt: '2026-07-16T11:00' },
    fakeDatabase(fixture) as never,
  )
}

describe('public booking availability quote', () => {
  it('returns validation errors for invalid date ranges', async () => {
    const result = await quote(
      { bikeType, bikeRows: [bike('bike-1')] },
      '2026-07-17T10:00',
    )

    assert.equal(result.status, 'error')
    assert.equal(
      result.fieldErrors.returnAt,
      'Return date and time must be after the pickup.',
    )
  })

  it('returns a database-backed availability quote and USD totals', async () => {
    const result = await quote({ bikeType, bikeRows: [bike('bike-1')] })

    assert.equal(result.status, 'available')
    assert.equal(result.bikeTypeId, 'bike-type-mvp-city-bike')
    assert.equal(result.bikeName, 'PedalGo City Bike')
    assert.equal(result.availableUnits, 1)
    assert.equal(result.draft.days, 3)
    assert.equal(result.draft.dailyRate, 25)
    assert.equal(result.draft.total, 75)
    assert.equal(result.totalUsdCents, 7500)
  })

  it('returns unavailable when the featured bike has no capacity', async () => {
    const result = await quote({ bikeType, bikeRows: [] })

    assert.equal(result.status, 'unavailable')
    assert.match(result.message, /No PedalGo City Bikes are available/)
  })
})
