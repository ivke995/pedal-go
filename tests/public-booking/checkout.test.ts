import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createReservationCheckoutSession } from '@/lib/public-booking/checkout'

describe('legacy card checkout boundary', () => {
  it('fails closed without creating provider persistence', async () => {
    const result = await createReservationCheckoutSession(
      { reservationId: 'reservation-1' },
      {} as never,
    )

    assert.equal(result.status, 'error')
    assert.match(result.message, /external payment submission/i)
  })
})
