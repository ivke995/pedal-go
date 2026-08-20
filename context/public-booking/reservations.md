# Public Booking Reservations

`lib/public-booking/reservations.ts` is the server-side reservation boundary used after a public availability check.

## Current behavior

- Customer details and the requested rental window are validated, then availability is re-checked immediately before
  insert.
- The featured city-bike reservation stores USD cents calculated from the centralized `$48/day` rate and the existing
  started-24-hour rental-day rule.
- New public reservations use status `pending_verification`, assign the first available physical bike when possible, and
  write hold strategy/expiry metadata into `notes`.
- Public submission validates `venmo` or `zelle`, validates the complete server-configured profiles, persists the selected
  method, and returns only that method's typed profile, derived recipient, and exact-amount instructions in the UI-safe
  summary.
- Submission sends customer and owner reservation-received notifications through the server-side Resend boundary. The
  owner recipient and sender configuration are never included in the public result.
- Missing payment configuration fails before insert. A post-insert email failure reports `notification_error` while the
  saved reservation remains `pending_verification`.
- Pending-verification reservations block availability just like confirmed reservations.
- The active `/booking` UI calls the reservation action only after customer details and a Venmo/Zelle method are selected;
  successful results render the reference, exact amount, selected profile details, selected instructions, and
  manual-confirmation next steps. Reservation-received customer and owner emails render the same selected profile
  details; HTML email values are escaped and Zelle omits the Venmo handle.

## Related code

- `app/actions/create-pending-reservation.ts` — server action boundary.
- `lib/public-booking/availability.ts` — featured-bike availability quote.
- `lib/domain/availability.ts` — shared capacity conflict logic.
- `lib/domain/pricing.ts` — rental days and centralized USD rate.
- `tests/public-booking/reservations.test.ts` — validation, availability re-check, pricing, and insert coverage.
- `tests/public-booking/notifications.test.ts` — notification content, recipient separation, and HTML escaping coverage.

See also: [manual payment boundary](payments.md), [availability](availability.md), and [database foundation](../database/foundation.md).
