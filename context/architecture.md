# Architecture

## Current structure

- `app/` — Next.js App Router routes and root layout.
  - `app/actions/` contains server actions used by client components for server-side domain work.
  - `app/page.tsx` composes the public landing page.
  - `app/booking/page.tsx` hosts the booking flow inside `Suspense`.
  - `app/booking/success/page.tsx` and `app/booking/cancel/page.tsx` are legacy read-only provider-return pages retained during migration.
  - `app/admin/(auth)/login/` renders `/admin/login` and submits admin credentials through a server action.
  - `app/admin/(dashboard)/` contains the protected admin dashboard shell; its layout redirects unauthenticated users to `/admin/login` and renders shared navigation for summary, reservations, pricing, availability, calendar, and reports sections.
  - `app/api/stripe/webhook/route.ts` is a legacy provider route; the current handler fails closed and does not apply reservation state changes.
  - `app/layout.tsx` defines metadata, fonts, analytics, and global toaster.
- `components/` — reusable React components.
  - `components/public/` contains public-site and booking-search presentation components.
  - `components/booking/` contains multi-step booking UI components.
  - `components/ui/` contains shadcn/Base UI-style primitives.
- `lib/` — shared utilities, domain types, static featured-bike display data, pricing logic, domain services, and database boundary.
  - `lib/db/` contains Turso/libSQL env validation, the Drizzle client, and rental domain schema.
  - `lib/admin-auth/` contains server-only active-admin lookup, seeded PBKDF2 password hash verification, signed admin session-cookie handling, and route guard helpers.
  - `lib/admin-dashboard/` contains server-side admin operations summary, reservation listing/search queries, manual reservation creation helpers, reservation cancellation helpers, pricing management helpers, availability-block management helpers, and calendar helpers for protected dashboard routes.
  - `lib/domain/` contains server-side rental pricing, date-range, and availability services for database-backed flows.
  - `lib/public-booking/` contains public booking orchestration, server-side availability/reservation boundaries, and transitional fail-closed provider modules pending the manual-payment flow.
- `public/` — static assets.
- `scripts/seed.ts` — idempotent MVP database seed for bike inventory and bootstrap admin access.
- `drizzle.config.ts` — Drizzle Kit configuration for Turso/libSQL migrations.
- `drizzle/` — generated Drizzle migration metadata/output.
- `README.md` — canonical human-facing local setup and deployment environment contract.
- `tests/domain/` — Node test-runner unit tests for server-side pricing, date-range, and availability domain behavior.
- `tests/admin-dashboard/` — Node test-runner tests for admin dashboard server-side orchestration.
- `tests/public-booking/` — Node test-runner tests for public booking server-side orchestration.

## Data and backend state

The homepage availability check uses `app/actions/check-featured-bike-availability.ts` and `lib/public-booking/availability.ts` to validate pickup/return input and quote the seeded featured city-bike option from database-backed availability and the centralized $48/day rate. The `/booking` customer-details step uses `app/actions/create-pending-reservation.ts` and `lib/public-booking/reservations.ts` to re-check featured-bike availability and insert a `pending_verification` reservation. Legacy checkout, status, and webhook boundaries now fail closed; they do not create provider rows or mutate reservation state. The manual-payment submission and notification flow is implemented by later plan tasks.

The database foundation is integrated into public availability and reservation creation behavior:
- Drizzle Kit reads rental tables from `lib/db/schema.ts` and writes migrations to `drizzle/`.
- `lib/db/client.ts` exports the server-side Drizzle client backed by `@libsql/client`.
- `lib/domain/pricing.ts` quotes rental prices with USD-cent field names/formatting and rounds every started 24-hour period up to one rental day.
- `lib/domain/availability.ts` looks up active bike-type inventory and excludes unavailable bikes, `pending_verification` or confirmed reservation conflicts, unassigned pending-verification/confirmed reservation capacity, and reserved/maintenance/inactive availability blocks.
- `TURSO_DATABASE_URL` is required. `TURSO_AUTH_TOKEN` is required for remote Turso/libSQL URLs and omitted for local `file:` URLs. Legacy provider environment variables remain until the later cleanup task; they are not used by the current reservation domain. Database commands load `.env.local` and `.env` automatically. `README.md` is the canonical deployment environment contract and checklist.
- `pnpm db:seed` creates the MVP `PedalGo City Bike` bike type, `CITY-001`/`CITY-002` physical bikes, and a bootstrap admin user. It requires `ADMIN_BOOTSTRAP_PASSWORD` and defaults admin email/name when not supplied.
- `/admin/login` verifies credentials against active `admin_users`, then sets an 8-hour signed HTTP-only `pedalgo_admin_session` cookie scoped to `/admin`; production session signing requires `ADMIN_SESSION_SECRET`.
- `/admin` renders database-backed operations summary cards from reservation, inventory, bike-type, and availability-block query boundaries. `/admin/reservations` renders a database-backed list with reservation/customer search, reservation status filtering, manual payment-method filtering, an admin-only manual reservation form that re-checks availability, and per-row cancellation controls for `pending_verification`/`confirmed` reservations. Manual creation calculates the centralized $48/day rate, assigns an available bike when possible, and creates `pending_verification` or `confirmed` reservations without charging cards. Cancellation changes only reservation status/notes. `/admin/pricing` retains the bike-type rate data management extension point; current public/manual booking quotes use the centralized rate. `/admin/availability` lets admins create, update, and delete bike-type or bike-specific availability blocks after reservation/block conflict checks; saved blocks feed the shared availability service used by public booking and admin manual reservations. `/admin/calendar` renders a server-side month-navigation calendar/list hybrid for overlapping pending-verification/confirmed/completed reservations and availability blocks, with day-level open/partial/unavailable indicators. Reports is a protected MVP section boundary without a reporting workflow.
- The current schema includes `bike_types`, `bikes`, `reservations`, `availability_blocks`, and `admin_users` with foreign keys, indexes, timestamp fields, status check constraints, USD-cent money columns (`*_usd_cents`), and nullable reservation-level `payment_method`.
- The public availability quote targets seeded bike type `bike-type-mvp-city-bike`, returns rental days and USD totals, and does not create reservations or checkout sessions.
- Pending public reservations target the same featured bike type, store customer details and USD totals at the centralized $48/day rate, assign one available physical bike as the hold strategy when possible, write hold-expiry metadata into reservation `notes`, and use `pending_verification`.
- No provider checkout or webhook path can currently create payment persistence or transition reservations; T02–T05 implement the replacement manual-payment flow and remove legacy provider artifacts.

## Verification commands

Use the scripts defined in `package.json`:
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `TURSO_DATABASE_URL=file:./local.db pnpm db:generate`
- `TURSO_DATABASE_URL=file:./local.db pnpm db:check`
- `TURSO_DATABASE_URL=file:./local.db pnpm db:migrate`
- `TURSO_DATABASE_URL=file:./local.db ADMIN_BOOTSTRAP_PASSWORD='replace-this-password' pnpm db:seed`
- `pnpm dev` for local development
