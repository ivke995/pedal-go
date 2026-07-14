import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { db } from '@/lib/db/client'
import { handleStripeWebhookEvent } from '@/lib/public-booking/webhooks'

const STRIPE_API_VERSION = '2026-06-24.dahlia'

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`)
  }

  return value
}

export async function POST(request: Request) {
  const stripe = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
    apiVersion: STRIPE_API_VERSION,
  })
  const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET')
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Stripe webhook signature.'

    return NextResponse.json({ error: message }, { status: 400 })
  }

  const result = await handleStripeWebhookEvent(event, db)

  return NextResponse.json(result)
}
