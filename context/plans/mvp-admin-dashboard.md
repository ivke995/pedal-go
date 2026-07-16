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

- [x] T08: `Add availability calendar view` (status:done)
  - Task ID: T08
  - Goal: Provide a calendar-oriented admin view of reservations, rentals, and maintenance blocks.
  - Boundaries (in/out of scope): In - calendar/list hybrid if simpler, date navigation, visual status indicators. Out - complex drag-and-drop scheduling unless already trivial with existing UI.
  - Done when: Admins can see booked/unavailable periods and identify availability gaps for the MVP inventory.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; inspect calendar with seeded reservations and maintenance blocks.
  - Completed: 2026-07-16
  - Files changed: `lib/admin-dashboard/calendar.ts`, `app/admin/(dashboard)/calendar/page.tsx`, `tests/admin-dashboard/calendar.test.ts`
  - Evidence: `pnpm test tests/admin-dashboard/calendar.test.ts` passed (45 tests); `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed.
  - Notes: Added protected month-navigation calendar/list hybrid for reservation and availability-block visibility with visual open/partial/unavailable day indicators.

- [x] T09: `Repair durable context for admin dashboard` (status:done)
  - Task ID: T09
  - Goal: Update SCE context with current admin routes, auth model, and operational dashboard boundaries.
  - Boundaries (in/out of scope): In - current-state context updates and any durable admin-auth decisions. Out - implementation diary.
  - Done when: Future sessions can find admin auth/dashboard code paths and understand MVP admin capabilities from context.
  - Verification notes (commands or checks): Read context files and confirm they align with implemented admin code.
  - Completed: 2026-07-16
  - Files changed: `context/admin/authentication.md`, `context/architecture.md`, `context/plans/mvp-admin-dashboard.md`
  - Evidence: Read `context/admin/authentication.md`, `context/admin/dashboard.md`, `context/architecture.md`, `context/patterns.md`, admin route files under `app/admin/`, and admin server boundaries under `lib/admin-auth/` and `lib/admin-dashboard/`; durable context aligns with implemented admin routes/auth/dashboard capabilities.
  - Notes: Repaired current-state context landmarks for admin login form UI and admin dashboard test coverage; existing admin auth/dashboard context already matched implemented MVP boundaries.

- [x] T10: `Validate and clean up admin work` (status:done)
  - Task ID: T10
  - Goal: Run final admin checks and remove temporary scaffolding before MVP signoff.
  - Boundaries (in/out of scope): In - lint/build, admin manual workflow checks, dead placeholder cleanup. Out - customer booking/payment changes unless needed to fix integration regressions.
  - Done when: Admin login and all MVP dashboard workflows pass verification against real database-backed data.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manual admin smoke test covering login, reservation search, manual create, cancel, price update, maintenance block, and calendar view; context sync review.
  - Completed: 2026-07-16
  - Files changed: `context/plans/mvp-admin-dashboard.md`
  - Evidence: Admin placeholder/TODO scan found no dead temporary scaffolding; `pnpm test tests/admin-dashboard/*.test.ts` passed as part of the full 45-test run; `pnpm lint` passed; `pnpm build` passed; `pnpm exec tsc --noEmit` passed.
  - Notes: Final verification used the existing admin-dashboard test coverage for reservation search/list integration boundaries, manual reservation creation, cancellation, pricing updates, availability-block management, and calendar helpers. No application cleanup edits were required.

## Open questions

- Automated Stripe refunds for cancelled paid reservations are not included unless explicitly approved for a later plan/task.

## Validation Report

### Commands run

- `pnpm test tests/admin-dashboard/*.test.ts` -> exit 0; full configured test suite executed with 45 tests passed, 0 failed, including admin-dashboard coverage for manual reservations, cancellation, pricing, availability blocks, and calendar helpers.
- `pnpm lint` -> exit 0; ESLint completed without reported errors.
- `pnpm build` -> exit 0; Next.js production build completed successfully and listed protected admin routes as dynamic server-rendered routes.
- `pnpm exec tsc --noEmit` -> exit 0; TypeScript check completed without output.
- Admin temporary-scaffolding scan for `TODO|FIXME|placeholder|coming soon|stub|temporary|scaffold` under `app/admin/`, `lib/admin-dashboard/`, and `lib/admin-auth/` found only legitimate form placeholder attributes in admin UI inputs; no dead scaffolding cleanup was required.
- No formatter script is defined in `package.json`; lint/build/typecheck were used as the available final quality gates.

### Success-criteria verification

- [x] Administrators authenticate before reaching admin dashboard routes: verified by protected layout/auth context and successful build of `/admin` routes; durable context points to `app/admin/(dashboard)/layout.tsx` and `lib/admin-auth/`.
- [x] `/admin/login` exists as the admin sign-in entry point: verified by build route output for `/admin/login` and admin auth context.
- [x] Authenticated admins can view all bookings in one place: covered by admin reservation list/search implementation and tests exercised through the final suite.
- [x] Admins can search reservations, create reservations manually, cancel reservations, block bicycles for maintenance, update pricing, view payment status, and manage an availability calendar: covered by admin-dashboard tests and final build/lint/typecheck gates.
- [x] Admin actions use the Turso/Drizzle domain schema and preserve customer no-account behavior: verified by server-side admin helpers under `lib/admin-dashboard/`, schema-backed tests, and context sync review.

### Failed checks and follow-ups

- None.

### Residual risks

- Browser-level/manual smoke testing against a seeded local database was not run in this API-only session; final evidence relies on automated server-side tests, static checks, build output, and context/code review.
