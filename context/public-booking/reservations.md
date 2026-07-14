# Public Booking Pending Reservations

The `/booking` customer-details step creates a database-backed pending payment reservation for the featured MVP bike before Stripe Checkout payment.

## Code paths

- `components/booking/booking-flow.tsx` reads `pickup`/`return` query params and submits customer details.
- `components/booking/customer-details-form.tsx` validates full name, email, phone, terms, and privacy acceptance client-side, then displays server-side errors when returned.
- `app/actions/create-pending-reservation.ts` is the server action boundary for reservation creation.
- `lib/public-booking/reservations.ts` validates customer/date input, re-checks featured-bike availability, quotes database-backed USD pricing, and inserts the reservation.
- `components/booking/payment-preview.tsx` displays the pending reservation reference and starts Stripe Checkout through `app/actions/create-checkout-session.ts`.

## Behavior

- Featured bike type id: `bike-type-mvp-city-bike`.
- Reservation status starts as `pending`; successful payment confirmation is webhook-only.
- Creation re-validates pickup/return date ordering and featured-bike availability immediately before inserting.
- Customer email is normalized to lowercase before storage.
- The hold strategy assigns the first available physical bike (`bike_id`) when capacity exists.
- Reservation `notes` stores JSON metadata: `source`, `holdStrategy`, and `holdExpiresAt`.
- Availability treats `pending` and `confirmed` reservations as blocking capacity.
- Stripe Checkout starts from the pending reservation payment panel. Success/cancel pages are read-only status views; webhook transition and email sending happen only from verified Stripe events.

## Tests

- `tests/public-booking/reservations.test.ts` covers customer validation, unavailable re-check behavior, pending insert fields, assigned-bike hold, USD totals, and hold-expiry metadata.

See also: [availability](availability.md), [payments](payments.md), [architecture](../architecture.md), [database foundation](../database/foundation.md).
