# Admin Dashboard

PedalGo has a protected MVP administrator dashboard under `app/admin/(dashboard)/`.

## Routes and navigation

- `app/admin/(dashboard)/layout.tsx` protects all dashboard routes with `requireAuthenticatedAdmin()` and renders the shared admin header, logout form, and dashboard navigation.
- `app/admin/(dashboard)/page.tsx` renders `/admin` as the operations summary.
- `app/admin/(dashboard)/reservations/page.tsx` renders the reservation list/search view.
- `app/admin/(dashboard)/pricing/page.tsx` establishes the featured rental pricing route boundary.
- `app/admin/(dashboard)/availability/page.tsx` establishes the availability-block and maintenance route boundary.
- `app/admin/(dashboard)/calendar/page.tsx` establishes the schedule/calendar visibility route boundary.
- `app/admin/(dashboard)/reports/page.tsx` establishes the reporting route boundary.

Pricing, availability, calendar, and reports are currently server-rendered protected placeholders unless noted otherwise; mutation workflows belong to later admin dashboard tasks.

## Summary metrics

`lib/admin-dashboard/summary.ts` is a server-only query boundary used by `/admin`.

Current summary metrics come from Drizzle queries over existing rental tables:
- total, pending, and confirmed reservations
- pending payments
- confirmed payment revenue in USD cents
- current/future availability blocks
- active bike types
- physical bike inventory count

Client components must not import this helper because it imports the database client.

## Reservation list and search

`lib/admin-dashboard/reservations.ts` is a server-only query boundary used by `/admin/reservations`.

The reservations page reads GET query parameters from `searchParams` and renders a no-client-state filter form:
- `search` matches reservation reference, customer name, customer email, or customer phone.
- `status` filters by `RESERVATION_STATUSES` from `lib/db/schema.ts`; invalid values fall back to all statuses.
- `paymentStatus` filters by `PAYMENT_STATUSES` or `none`; invalid values fall back to all payments.

The table displays reservation reference, customer details, pickup/return window, rental duration, reservation status,
latest joined payment status/provider, bike type, assigned bike code when present, and total USD amount. The query limits
results to the newest 100 matching rows and collapses duplicate joined payment rows by reservation id. This view is
read-only: manual creation, cancellation, refunds, and other mutations are separate admin tasks.

## Related context

- [Admin authentication](authentication.md)
- [Architecture](../architecture.md)
- [Database foundation](../database/foundation.md)
