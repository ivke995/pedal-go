# MVP Admin Authentication and Dashboard

## Change summary

Implement the authenticated administrator experience for PedalGo MVP: `/admin/login`, dashboard access control, reservation management, manual reservation creation, cancellation, pricing management, availability/maintenance blocks, calendar visibility, and payment status visibility.

## Success criteria

- Administrators authenticate before reaching any admin dashboard route.
- `/admin/login` provides the admin sign-in entry point.
- Authenticated admins can view all bookings in one place.
- Admins can search reservations, create reservations manually, cancel reservations, block bicycles for maintenance, update pricing, view payment status, and manage an availability calendar.
- Admin actions use the Turso/Drizzle domain schema and preserve customer no-account behavior.

## Constraints and non-goals

- Depends on `mvp-foundation-db-domain`; reservation/payment data is most useful after `mvp-public-booking-payment` starts producing records.
- In scope: admin auth, dashboard routes, reservation/pricing/availability management, calendar-oriented views, and access control.
- Out of scope: multiple admin roles/permissions, advanced analytics, public category management UI beyond what is needed for the single featured rental, and customer self-service flows.
- Use a simple secure admin model suitable for MVP; do not add customer authentication.

## Task stack

- [x] T01: `Implement admin authentication foundation` (status:done)
  - Task ID: T01
  - Goal: Add secure admin login/logout/session handling for `/admin/login` and protected admin routes.
  - Boundaries (in/out of scope): In - admin credential verification against `AdminUser`, password hashing/session cookie strategy, route protection. Out - multiple roles, password reset, customer login.
  - Done when: Unauthenticated users cannot access admin dashboard routes; authenticated admins can log in and log out securely.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually test protected route redirects and session expiry behavior.
  - Completed: 2026-07-16
  - Files changed: `lib/admin-auth/password.ts`, `lib/admin-auth/session.ts`, `lib/admin-auth/auth.ts`, `app/admin/(auth)/login/*`, `app/admin/(dashboard)/*`, `app/admin/actions.ts`
  - Evidence: `pnpm lint` passed; `pnpm build` passed.
  - Notes: Added database-backed active-admin credential verification, PBKDF2 seeded password hash verification, signed HTTP-only admin session cookie, `/admin/login`, protected `/admin`, and logout action.

- [x] T02: `Create admin dashboard shell and navigation` (status:done)
  - Task ID: T02
  - Goal: Build the authenticated admin layout with dashboard navigation for reservations, pricing, availability, calendar, and reports/summary.
  - Boundaries (in/out of scope): In - layout, navigation, route structure, high-level summary cards. Out - full CRUD behaviors for each section.
  - Done when: Authenticated admins can navigate between dashboard sections and see core operational metrics or placeholders backed by real query boundaries.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually inspect admin routes.
  - Completed: 2026-07-16
  - Files changed: `app/admin/(dashboard)/layout.tsx`, `app/admin/(dashboard)/page.tsx`, `app/admin/(dashboard)/reservations/page.tsx`, `app/admin/(dashboard)/pricing/page.tsx`, `app/admin/(dashboard)/availability/page.tsx`, `app/admin/(dashboard)/calendar/page.tsx`, `app/admin/(dashboard)/reports/page.tsx`, `lib/admin-dashboard/summary.ts`
  - Evidence: `pnpm lint` passed; `pnpm build` passed; `pnpm exec tsc --noEmit` passed.
  - Notes: Added shared protected admin navigation, section route placeholders, and database-backed summary metrics for reservations, payments, inventory, availability blocks, and confirmed revenue.

- [x] T03: `Implement reservation list and search` (status:done)
  - Task ID: T03
  - Goal: Show all reservations in one place with search/filter support and payment status visibility.
  - Boundaries (in/out of scope): In - list/table, search by reservation/customer fields, status filters, payment status display. Out - manual creation and cancellation mutations.
  - Done when: Admins can locate reservations and understand reservation/payment state from a single view.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; test search/filter combinations against seeded and payment-created records.
  - Completed: 2026-07-16
  - Files changed: `lib/admin-dashboard/reservations.ts`, `app/admin/(dashboard)/reservations/page.tsx`
  - Evidence: `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed; `pnpm test` passed (29 tests).
  - Notes: Added server-only reservation listing/search/filter query boundary and protected admin table with reservation status, payment status, customer, rental window, assignment, and total display. Manual creation and cancellation remain out of scope.

- [x] T04: `Add manual reservation creation` (status:done)
  - Task ID: T04
  - Goal: Allow admins to create reservations manually after checking availability and price.
  - Boundaries (in/out of scope): In - admin-only form, customer details, rental period, availability validation, status selection/default. Out - charging customer cards from admin and customer account creation.
  - Done when: Admin-created reservations cannot double-book unavailable bikes and appear in the reservation list/calendar.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually create valid and conflicting admin reservations.
  - Completed: 2026-07-16
  - Files changed: `lib/admin-dashboard/manual-reservations.ts`, `app/admin/actions.ts`, `app/admin/(dashboard)/reservations/page.tsx`, `tests/admin-dashboard/manual-reservations.test.ts`
  - Evidence: `pnpm test` passed (32 tests); `pnpm lint` passed; `pnpm build` passed.
  - Notes: Added protected admin manual reservation creation with active bike-type selection, customer/rental inputs, pending/confirmed status selection, immediate availability re-check, current USD price calculation, assigned-bike hold, and no admin card charging.

- [x] T05: `Add reservation cancellation workflow` (status:done)
  - Task ID: T05
  - Goal: Allow admins to cancel reservations and preserve payment/refund status visibility.
  - Boundaries (in/out of scope): In - cancellation action, status transition validation, optional cancellation reason/internal note. Out - automated Stripe refunds unless explicitly added in a later task/plan.
  - Done when: Cancellable reservations can move to `CANCELLED`; invalid status transitions are blocked; availability reflects cancellations.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually cancel confirmed and non-cancellable sample reservations.
  - Completed: 2026-07-16
  - Files changed: `lib/admin-dashboard/cancellations.ts`, `app/admin/actions.ts`, `app/admin/(dashboard)/reservations/page.tsx`, `tests/admin-dashboard/cancellations.test.ts`
  - Evidence: `pnpm test tests/admin-dashboard/cancellations.test.ts` passed (35 tests); `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed.
  - Notes: Added protected admin cancellation action for pending/confirmed reservations, invalid-transition blocking for terminal statuses, cancellation metadata in reservation notes, and per-row admin cancellation controls while preserving existing payment records/status display. Cancelled reservations are non-blocking through existing availability status rules.

- [x] T06: `Implement pricing management` (status:done)
  - Task ID: T06
  - Goal: Allow admins to update the featured rental daily price in USD while preserving future bike-type extensibility.
  - Boundaries (in/out of scope): In - edit daily price for active bike type, validation, audit-friendly updated timestamps. Out - hourly/weekend/seasonal pricing, discounts, coupon codes.
  - Done when: Updated pricing affects new availability/booking calculations and does not mutate historical paid reservation totals.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; update price and confirm new booking quote changes while existing reservation total remains unchanged.
  - Completed: 2026-07-16
  - Files changed: `lib/admin-dashboard/pricing.ts`, `app/admin/actions.ts`, `app/admin/(dashboard)/pricing/page.tsx`, `tests/admin-dashboard/pricing.test.ts`
  - Evidence: `pnpm test` passed (38 tests); `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed.
  - Notes: Added protected admin pricing management for active bike types with USD validation, daily-rate updates on `bike_types`, updated timestamp writes, and tests confirming only bike-type pricing changes while existing reservation totals remain unchanged. Existing availability/manual/public booking quote paths read current bike-type rates for new calculations.

- [x] T07: `Implement availability blocks and maintenance management` (status:done)
  - Task ID: T07
  - Goal: Let admins block bicycles for maintenance, repairs, internal use, or inactive periods.
  - Boundaries (in/out of scope): In - create/update/delete availability blocks, reason/status display, conflict checks. Out - public category UI and advanced resource scheduling.
  - Done when: Availability blocks prevent customer/admin booking conflicts and are visible in admin availability views.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; create a maintenance block and verify the same range becomes unavailable.
  - Completed: 2026-07-16
  - Files changed: `lib/admin-dashboard/availability-blocks.ts`, `app/admin/actions.ts`, `app/admin/(dashboard)/availability/page.tsx`, `tests/admin-dashboard/availability-blocks.test.ts`
  - Evidence: `pnpm test` passed (43 tests); `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed.
  - Notes: Added protected admin availability block creation/update/delete for active bike types or specific bikes, reason/status/note display, reservation and block conflict checks, and tests confirming saved blocks make matching booking windows unavailable through the shared availability service.

- [ ] T08: `Add availability calendar view` (status:todo)
  - Task ID: T08
  - Goal: Provide a calendar-oriented admin view of reservations, rentals, and maintenance blocks.
  - Boundaries (in/out of scope): In - calendar/list hybrid if simpler, date navigation, visual status indicators. Out - complex drag-and-drop scheduling unless already trivial with existing UI.
  - Done when: Admins can see booked/unavailable periods and identify availability gaps for the MVP inventory.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; inspect calendar with seeded reservations and maintenance blocks.

- [ ] T09: `Repair durable context for admin dashboard` (status:todo)
  - Task ID: T09
  - Goal: Update SCE context with current admin routes, auth model, and operational dashboard boundaries.
  - Boundaries (in/out of scope): In - current-state context updates and any durable admin-auth decisions. Out - implementation diary.
  - Done when: Future sessions can find admin auth/dashboard code paths and understand MVP admin capabilities from context.
  - Verification notes (commands or checks): Read context files and confirm they align with implemented admin code.

- [ ] T10: `Validate and clean up admin work` (status:todo)
  - Task ID: T10
  - Goal: Run final admin checks and remove temporary scaffolding before MVP signoff.
  - Boundaries (in/out of scope): In - lint/build, admin manual workflow checks, dead placeholder cleanup. Out - customer booking/payment changes unless needed to fix integration regressions.
  - Done when: Admin login and all MVP dashboard workflows pass verification against real database-backed data.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manual admin smoke test covering login, reservation search, manual create, cancel, price update, maintenance block, and calendar view; context sync review.

## Open questions

- Automated Stripe refunds for cancelled paid reservations are not included unless explicitly approved for a later plan/task.
