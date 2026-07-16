# Admin Dashboard

PedalGo has a protected MVP administrator dashboard under `app/admin/(dashboard)/`.

## Routes and navigation

- `app/admin/(dashboard)/layout.tsx` protects all dashboard routes with `requireAuthenticatedAdmin()` and renders the shared admin header, logout form, and dashboard navigation.
- `app/admin/(dashboard)/page.tsx` renders `/admin` as the operations summary.
- `app/admin/(dashboard)/reservations/page.tsx` renders the reservation list/search view, manual reservation creation form, and reservation cancellation controls.
- `app/admin/(dashboard)/pricing/page.tsx` renders active bike-type daily-rate management.
- `app/admin/(dashboard)/availability/page.tsx` establishes the availability-block and maintenance route boundary.
- `app/admin/(dashboard)/calendar/page.tsx` establishes the schedule/calendar visibility route boundary.
- `app/admin/(dashboard)/reports/page.tsx` establishes the reporting route boundary.

Availability, calendar, and reports are currently server-rendered protected placeholders unless noted otherwise. Automated payment/refund handling and availability block mutations belong to later admin dashboard tasks.

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
latest joined payment status/provider, bike type, assigned bike code when present, total USD amount, and cancellation
controls for cancellable rows. The query limits results to the newest 100 matching rows and collapses duplicate joined
payment rows by reservation id.

## Manual reservation creation

`lib/admin-dashboard/manual-reservations.ts` is the server-side helper for admin-created reservations and
`app/admin/actions.ts` exposes it through `createManualReservationAction` after requiring an authenticated admin.

The `/admin/reservations` form captures active bike type, customer name/email/phone, pickup/return date-time, optional
internal note, and a status of `confirmed` or `pending` (default `confirmed`). Creation reuses `getBikeAvailability()`
and `quoteRentalPrice()` immediately before insert, assigns the first available physical bike when possible, writes
`notes.source = "admin_manual"`, and redirects back to the reservation list with a success or error query message.

Manual reservation creation does not create a `payments` row, charge customer cards, or create customer accounts. Because
availability treats `pending` and `confirmed` reservations as blocking, successful manual reservations appear in the list
and block later customer/admin bookings for the same rental window.

## Reservation cancellation

`lib/admin-dashboard/cancellations.ts` is the server-side helper for admin cancellations and `app/admin/actions.ts`
exposes it through `cancelReservationAction` after requiring an authenticated admin.

Admins can cancel reservations currently in `pending` or `confirmed` status from `/admin/reservations`. The action updates
the reservation status to `cancelled`, writes `notes.cancellation` metadata with `cancelledBy = "admin"`, `cancelledAt`,
and optional reason, and redirects back to the reservation list with a success/error query message.

Terminal statuses (`cancelled`, `completed`, `failed`, `refunded`) are not cancellable. Cancellation does not create or
update payment rows and does not automate Stripe refunds; existing payment status/provider details remain visible in the
reservation list. Because availability only treats `pending` and `confirmed` reservations as blocking, cancelled
reservations no longer reduce bike availability.

## Pricing management

`lib/admin-dashboard/pricing.ts` is the server-side helper for admin pricing and `app/admin/actions.ts` exposes it through
`updateBikeTypeDailyPriceAction` after requiring an authenticated admin.

The `/admin/pricing` page lists active bike types ordered by sort/name and renders a daily USD price form for each active
type. Updates validate prices as positive USD amounts from `0.01` to `9,999.99` with at most two decimals, store the value
as `bike_types.daily_rate_usd_cents`, and write `bike_types.updated_at` for audit-friendly change visibility.

Pricing updates only mutate the active bike-type row. Existing reservation rows keep their stored `daily_rate_usd_cents`
and `total_usd_cents`, so historical/paid totals are not recalculated. New homepage availability quotes, public pending
reservations, and admin manual reservations use the current bike-type daily rate through existing availability/pricing
helpers.

## Related context

- [Admin authentication](authentication.md)
- [Architecture](../architecture.md)
- [Database foundation](../database/foundation.md)
