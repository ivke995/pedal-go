import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { handleStripeWebhookEvent } from '@/lib/public-booking/webhooks'

describe('legacy provider webhook boundary', () => {
  it('ignores provider events without changing reservation state', async () => {
    const result = await handleStripeWebhookEvent(
      { type: 'checkout.session.completed' } as never,
      {} as never,
    )

    assert.equal(result.status, 'ignored')
    assert.match(result.message, /no longer accepted/i)
  })
})
