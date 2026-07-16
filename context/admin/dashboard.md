# Admin Dashboard

PedalGo has a protected MVP administrator dashboard under `app/admin/(dashboard)/`.

## Routes and navigation

- `app/admin/(dashboard)/layout.tsx` protects all dashboard routes with `requireAuthenticatedAdmin()` and renders the shared admin header, logout form, and dashboard navigation.
- `app/admin/(dashboard)/page.tsx` renders `/admin` as the operations summary.
- `app/admin/(dashboard)/reservations/page.tsx` establishes the reservation management route boundary.
- `app/admin/(dashboard)/pricing/page.tsx` establishes the featured rental pricing route boundary.
- `app/admin/(dashboard)/availability/page.tsx` establishes the availability-block and maintenance route boundary.
- `app/admin/(dashboard)/calendar/page.tsx` establishes the schedule/calendar visibility route boundary.
- `app/admin/(dashboard)/reports/page.tsx` establishes the reporting route boundary.

All section pages are currently server-rendered protected placeholders unless noted otherwise; full CRUD/search/reporting behavior belongs to later admin dashboard tasks.

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

## Related context

- [Admin authentication](authentication.md)
- [Architecture](../architecture.md)
- [Database foundation](../database/foundation.md)
