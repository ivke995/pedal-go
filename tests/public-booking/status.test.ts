import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getBookingStatusByCheckoutSession } from '@/lib/public-booking/status'

describe('legacy provider status boundary', () => {
  it('does not resolve provider checkout sessions', async () => {
    const result = await getBookingStatusByCheckoutSession('cs_legacy', {} as never)

    assert.equal(result.status, 'not_found')
    assert.match(result.message, /no longer available/i)
  })
})
