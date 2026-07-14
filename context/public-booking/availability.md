# Public Booking Availability

The homepage booking form checks the featured MVP rental option against database-backed availability before customers can continue to `/booking`.

## Code paths

- `components/public/booking-search-form.tsx` collects pickup/return date-time input and calls the server action.
- `app/actions/check-featured-bike-availability.ts` is the server action boundary for the public form.
- `lib/public-booking/availability.ts` validates input, targets `FEATURED_BIKE_TYPE_ID`, calls database-backed domain availability, and returns a UI-safe quote result.
- `components/public/availability-result.tsx` renders either an available quote with a `/booking` link or an unavailable state without a continue link.

## Behavior

- Featured bike type id: `bike-type-mvp-city-bike` from `scripts/seed.ts`.
- Invalid or missing pickup/return input returns field errors; return must be after pickup.
- Available ranges return rental days, available unit count, daily USD rate, and total USD price.
- Unavailable ranges return a no-capacity message and do not expose a booking-review link.
- This step has no reservation, checkout, payment, or email side effects; pending reservation creation happens later on `/booking` after customer details are submitted.

## Capacity rules

- Availability excludes overlapping `pending` and `confirmed` reservations so newly created pending payment reservations hold capacity before Stripe checkout is implemented.

## Tests

- `tests/public-booking/availability.test.ts` covers validation, available quotes, USD totals, and unavailable capacity.

See also: [architecture.md](../architecture.md), [database/foundation.md](../database/foundation.md).
