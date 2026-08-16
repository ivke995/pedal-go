# Public Booking Payment Boundary

Public reservations no longer persist provider payment records. T01 establishes the reservation-level manual-payment
contract; later tasks add instruction delivery, customer submission UI, and owner verification.

## Current contract

- Public and admin reservation pricing uses `CURRENT_DAILY_RATE_USD_CENTS = 4800` (`$48/day`) from
  `lib/domain/pricing.ts`.
- Reservations persist an optional `paymentMethod` of `venmo` or `zelle` and use `pending_verification` for unpaid manual
  review.
- `pending_verification` reservations consume bike capacity alongside `confirmed` reservations.
- No `payments` table, provider identifiers, checkout session persistence, or automatic payment confirmation exists in the
  current schema.
- Legacy checkout/status/webhook module boundaries fail closed while the booking flow is migrated; they do not mutate
  reservations.

## Planned follow-up boundaries

- T02 adds server-only Venmo/Zelle instructions and immediate Resend notifications.
- T03 replaces the customer checkout UI with method selection and reservation-received instructions.
- T04 adds the authenticated owner verification transition from `pending_verification` to `confirmed`.
- T05 removes remaining provider routes, modules, dependency, tests, and stale deployment documentation.

See also: [reservations](reservations.md), [availability](availability.md), [database foundation](../database/foundation.md).
