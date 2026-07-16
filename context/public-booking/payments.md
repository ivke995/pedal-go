# Public Booking Payments

The `/booking` payment step creates a Stripe Checkout Session for an existing pending reservation and redirects the customer to Stripe-hosted payment. Reservation finalization is webhook-only: a customer reaching a success URL does not confirm the reservation.

## Code paths

- `components/booking/payment-preview.tsx` calls the checkout server action after the pending reservation summary is shown.
- `app/actions/create-checkout-session.ts` is the server action boundary and returns a UI-safe checkout URL or error message.
- `lib/public-booking/checkout.ts` validates reservation state, creates a pending payment row, creates the Stripe Checkout Session, and stores the Stripe Checkout Session id.
- `app/api/stripe/webhook/route.ts` reads the raw request body, verifies the Stripe signature with `STRIPE_WEBHOOK_SECRET`, and passes verified events to the public-booking webhook handler.
- `app/booking/success/page.tsx` looks up status by `session_id` and displays processing, confirmed, failed, or cancelled messaging without mutating reservation/payment state.
- `app/booking/cancel/page.tsx` looks up status by reservation reference and explains no reservation is confirmed unless a later Stripe webhook succeeds.
- `lib/public-booking/status.ts` performs read-only lookup by Checkout Session id or reservation reference and returns a UI-safe status summary.
- `lib/public-booking/webhooks.ts` applies idempotent payment and reservation state transitions for successful, failed, and expired Stripe payment paths, and sends the confirmation email before transitioning a pending reservation to confirmed.
- `lib/public-booking/confirmation-email.ts` builds the customer confirmation email and sends it through Resend.
- `tests/public-booking/checkout.test.ts` covers pending payment insertion, session parameters, metadata, URL configuration, and non-pending reservation rejection.
- `tests/public-booking/webhooks.test.ts` covers successful confirmation and email content, duplicate webhook no-resend behavior, failed/expired payment handling, and invalid-signature route rejection.
- `tests/public-booking/status.test.ts` covers processing, confirmed, failed, and cancel-page reference lookup behavior.

## Behavior

- Checkout can start only for reservations with status `pending`.
- A `payments` row is inserted with `status: 'pending'`, `provider: 'stripe'`, and `amountUsdCents` copied from `reservations.totalUsdCents`.
- Stripe Checkout uses one USD line item for the full reservation total.
- Checkout Session metadata and PaymentIntent metadata include `reservationId`, `reservationReference`, and `paymentId`.
- After Stripe returns a session, `payments.providerCheckoutId` stores the Checkout Session id.
- Customer success URL: `/booking/success?session_id={CHECKOUT_SESSION_ID}`.
- Customer cancel URL: `/booking/cancel?reservation={reservationReference}`.
- Reaching success/cancel URLs does not confirm a reservation or send email.
- Success-page status lookup finds the payment by `payments.providerCheckoutId`, then reads the linked reservation. Customer-facing states are `processing`, `confirmed`, `failed`, and `cancelled`.
- Cancel-page status lookup finds the reservation by reference, reads its payment when present, and keeps the customer message clear that no confirmed reservation exists unless Stripe later reports a successful payment by webhook.

## Webhook finalization

- `checkout.session.completed` is handled only when `payment_status` is `paid`.
- The handler locates the existing `payments` row by Checkout Session metadata `paymentId`, with `providerCheckoutId` as fallback for Checkout Session events.
- Paid sessions must match the stored `amountUsdCents`; mismatched amounts are ignored rather than confirming a reservation.
- Successful paid checkout updates the payment to `status: 'confirmed'`, records `providerPaymentId`/`paidAt`, sends the customer confirmation email while the reservation is still `pending`, and then changes the reservation to `confirmed` after the email send succeeds.
- If confirmation email sending fails for a pending reservation, the webhook request fails so Stripe can retry; the payment confirmation remains recorded, but the reservation is not moved to `confirmed` by that failed attempt.
- `checkout.session.expired` and `payment_intent.payment_failed` update the payment to `failed`; if the linked reservation is still `pending`, it becomes `failed`.
- Duplicate successful webhook deliveries are safe: already-confirmed reservations are not transitioned again, no duplicate confirmation email is sent, and payment updates are idempotent overwrites.

## Confirmation email

- Confirmation email delivery uses Resend and is invoked only from a paid Checkout Session webhook for a reservation that is still `pending`; the reservation is marked `confirmed` only after the email send succeeds.
- The email includes reservation reference, pickup/return date-time, total paid, pickup location, support contact details, support hours, and pickup instructions.
- Default pickup/contact copy matches the public site; environment variables can override the email copy without changing code.
- Client-side success/cancel pages do not send confirmation emails.

## Environment

- `STRIPE_SECRET_KEY` is required when creating real Checkout Sessions.
- `STRIPE_WEBHOOK_SECRET` is required to verify incoming Stripe webhook signatures.
- `NEXT_PUBLIC_APP_URL` or `APP_URL` sets the origin for success/cancel URLs; local fallback is `http://localhost:3000`.
- `RESEND_API_KEY` is required to send confirmation emails after paid webhooks.
- `RESEND_FROM_EMAIL` sets the sender and must be verified in Resend for real delivery.
- `PEDALGO_PICKUP_LOCATION`, `PEDALGO_CONTACT_EMAIL`, `PEDALGO_CONTACT_PHONE`, `PEDALGO_SUPPORT_HOURS`, and `PEDALGO_PICKUP_INSTRUCTIONS` optionally override confirmation email business copy.

See also: [reservations](reservations.md), [availability](availability.md), [architecture](../architecture.md).
