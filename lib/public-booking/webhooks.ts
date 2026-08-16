import type Stripe from 'stripe'

import type { db as appDb } from '@/lib/db/client'

type WebhookDatabase = typeof appDb

export type StripeWebhookResult = {
  status: 'handled' | 'ignored'
  message: string
}

/**
 * Provider webhook boundary retained as a no-op during the migration to manual verification.
 * No external event can confirm or fail a reservation in the new domain contract.
 */
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
  _database: WebhookDatabase,
  options: { now?: Date } = {},
): Promise<StripeWebhookResult> {
  void options

  return {
    status: 'ignored',
    message: `Stripe event ${event.type} is no longer accepted for reservation state changes.`,
  }
}
