# Public Booking Reservations

`lib/public-booking/reservations.ts` is the server-side reservation boundary used after a public availability check.

## Current behavior

- Customer details and the requested rental window are validated, then availability is re-checked immediately before
  insert.
- The featured city-bike reservation stores USD cents calculated from the centralized `$48/day` rate and the existing
  started-24-hour rental-day rule.
- New public reservations use status `pending_verification`, assign the first available physical bike when possible, and
  write hold strategy/expiry metadata into `notes`.
- The reservation schema provides nullable `paymentMethod` storage for `venmo` or `zelle`; method validation and
  instruction delivery are implemented by the follow-up manual-payment task.
- Pending-verification reservations block availability just like confirmed reservations.

## Related code

- `app/actions/create-pending-reservation.ts` — server action boundary.
- `lib/public-booking/availability.ts` — featured-bike availability quote.
- `lib/domain/availability.ts` — shared capacity conflict logic.
- `lib/domain/pricing.ts` — rental days and centralized USD rate.
- `tests/public-booking/reservations.test.ts` — validation, availability re-check, pricing, and insert coverage.

See also: [manual payment boundary](payments.md), [availability](availability.md), and [database foundation](../database/foundation.md).
