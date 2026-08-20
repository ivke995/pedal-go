# Public Booking Payment Boundary

Public reservations do not persist provider payment records. The reservation-level manual-payment contract, customer
submission UI, server-side instruction/notification boundary, and protected owner-verification transition are implemented.

## Current contract

- Public and admin reservation pricing uses `CURRENT_DAILY_RATE_USD_CENTS = 4800` (`$48/day`) from
  `lib/domain/pricing.ts`.
- Reservations persist an optional `paymentMethod` of `venmo` or `zelle` and use `pending_verification` for unpaid manual
  review.
- Valid public submissions require typed server-only profiles and notification configuration: `VENMO_NAME`,
  `VENMO_HANDLE`, `VENMO_EMAIL`, `VENMO_PHONE`, `ZELLE_NAME`, `ZELLE_EMAIL`, `ZELLE_PHONE`,
  `OWNER_NOTIFICATION_EMAIL`, `EMAIL_FROM`, and `RESEND_API_KEY`. Venmo profiles contain full name, handle, email, and
  phone; Zelle profiles contain full name, email, and phone. The selected method's profile, derived recipient, and
  exact-amount instructions are returned; owner recipient/sender values and the unselected profile are not returned.
- `confirmation-email.ts` builds escaped customer and owner reservation-received messages through the existing Resend
  sender. Messages include reservation reference, bike, dates, duration, amount due, selected method, labeled selected
  profile details (full name, Venmo handle when applicable, email, and phone), instructions, and explicit `Payment
  pending manual confirmation` wording.
- Configuration is checked before insertion. If notification delivery fails after insertion, the result reports the
  failure while the reservation remains `pending_verification`; no email or client result represents it as confirmed.
- `ManualPaymentInstructions` includes the selected method's typed profile, derived recipient, reservation-reference
  instruction, and exact amount for the confirmation and notification boundaries.
- `pending_verification` reservations consume bike capacity alongside `confirmed` reservations.
- `/booking` collects customer details first, then uses native accessible Venmo/Zelle radio controls and submits once with
  the selected method. The confirmation view shows only the returned method's recipient, labeled profile details (full
  name, Venmo handle when applicable, email, and phone), instructions, reservation reference, rental details, exact
  amount, hold expiry, and explicit `Payment pending manual confirmation` wording.
- Loading, validation, retry, and notification-delivery failure states remain in the booking flow without claiming that
  payment was received. The active flow has no provider success/cancel routes.
- No `payments` table, provider identifiers, checkout session persistence, or automatic payment confirmation exists in the
  current schema.
- No checkout, status lookup, webhook, provider identifier, or payment persistence boundary exists. Only the protected admin
  verification action can change `pending_verification` to `confirmed`.

See also: [reservations](reservations.md), [availability](availability.md), and [database foundation](../database/foundation.md).
