# Public Booking Payment Boundary

Public reservations no longer persist provider payment records. The reservation-level manual-payment contract, customer
submission UI, server-side instruction/notification boundary, and protected owner-verification transition are implemented.

## Current contract

- Public and admin reservation pricing uses `CURRENT_DAILY_RATE_USD_CENTS = 4800` (`$48/day`) from
  `lib/domain/pricing.ts`.
- Reservations persist an optional `paymentMethod` of `venmo` or `zelle` and use `pending_verification` for unpaid manual
  review.
- Valid public submissions require `VENMO_HANDLE`, `ZELLE_RECIPIENT`, `OWNER_NOTIFICATION_EMAIL`, and `EMAIL_FROM` on the
  server. The selected method's recipient and exact-amount instructions are returned; owner recipient and sender values
  are not returned.
- `confirmation-email.ts` builds escaped customer and owner reservation-received messages through the existing Resend
  sender. Messages include reservation reference, bike, dates, duration, amount due, selected method, instructions, and
  explicit `Payment pending manual confirmation` wording.
- Configuration is checked before insertion. If notification delivery fails after insertion, the result reports the
  failure while the reservation remains `pending_verification`; no email or client result represents it as confirmed.
- `pending_verification` reservations consume bike capacity alongside `confirmed` reservations.
- `/booking` collects customer details first, then uses native accessible Venmo/Zelle radio controls and submits once with
  the selected method. The confirmation view shows only the returned method's recipient/instructions, reservation
  reference, rental details, exact amount, hold expiry, and explicit `Payment pending manual confirmation` wording.
- Loading, validation, retry, and notification-delivery failure states remain in the booking flow without claiming that
  payment was received. The active flow does not navigate to provider success/cancel routes.
- No `payments` table, provider identifiers, checkout session persistence, or automatic payment confirmation exists in the
  current schema.
- Legacy checkout/status/webhook module boundaries fail closed while the booking flow is migrated; they do not mutate
  reservations.

## Planned follow-up boundaries

- T02 is complete: it adds server-only Venmo/Zelle instructions and immediate Resend notifications.
- T03 is complete: the customer checkout UI uses method selection and reservation-received instructions.
- T04 is complete: an authenticated active admin can independently verify an externally received payment and transition
  a pending reservation to `confirmed`; the action records verifier identity, timestamp, and optional note in reservation
  metadata. No public action, notification, or provider callback performs this transition.
- T05 removes remaining provider routes, modules, dependency, tests, and stale deployment documentation.

See also: [reservations](reservations.md), [availability](availability.md), [database foundation](../database/foundation.md).
