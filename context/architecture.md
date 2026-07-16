# Architecture

## Current structure

- `app/` — Next.js App Router routes and root layout.
  - `app/actions/` contains server actions used by client components for server-side domain work.
  - `app/page.tsx` composes the public landing page.
  - `app/booking/page.tsx` hosts the booking flow inside `Suspense`.
  - `app/booking/success/page.tsx` and `app/booking/cancel/page.tsx` render read-only post-Stripe customer status messaging.
  - `app/admin/(auth)/login/` renders `/admin/login` and submits admin credentials through a server action.
  - `app/admin/(dashboard)/` contains the protected admin dashboard shell; its layout redirects unauthenticated users to `/admin/login` and renders shared navigation for summary, reservations, pricing, availability, calendar, and reports sections.
  - `app/api/stripe/webhook/route.ts` verifies Stripe webhook signatures from the raw request body before applying payment/reservation state changes.
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
  - `lib/public-booking/` contains public booking orchestration that adapts server-side availability, pending-reservation, Stripe Checkout, post-checkout status lookup, Stripe webhook, and Resend confirmation-email behavior for UI-safe/server-route boundaries.
- `public/` — static assets.
- `scripts/seed.ts` — idempotent MVP database seed for bike inventory and bootstrap admin access.
- `drizzle.config.ts` — Drizzle Kit configuration for Turso/libSQL migrations.
- `drizzle/` — generated Drizzle migration metadata/output.
- `README.md` — canonical human-facing local setup and deployment environment contract.
- `tests/domain/` — Node test-runner unit tests for server-side pricing, date-range, and availability domain behavior.
- `tests/admin-dashboard/` — Node test-runner tests for admin dashboard server-side orchestration.
- `tests/public-booking/` — Node test-runner tests for public booking server-side orchestration.

## Data and backend state

The homepage availability check uses `app/actions/check-featured-bike-availability.ts` and `lib/public-booking/availability.ts` to validate pickup/return input and quote the seeded featured city-bike option from database-backed availability and pricing. The `/booking` customer-details step uses `app/actions/create-pending-reservation.ts` and `lib/public-booking/reservations.ts` to re-check featured-bike availability and insert a `pending` reservation before payment. The payment panel uses `app/actions/create-checkout-session.ts` and `lib/public-booking/checkout.ts` to create a pending Stripe payment row, create a Stripe Checkout Session, store the session id on the payment, and redirect the customer to Stripe-hosted payment. `/booking/success` and `/booking/cancel` use `lib/public-booking/status.ts` for read-only reservation/payment status lookup and never mutate booking state. Stripe calls `app/api/stripe/webhook/route.ts`; after signature verification, `lib/public-booking/webhooks.ts` confirms successful paid checkout sessions, records failed/expired payment paths, and triggers the Resend confirmation email through `lib/public-booking/confirmation-email.ts` when a pending reservation becomes confirmed.

The database foundation is integrated into public availability, pending reservation, and checkout creation behavior:
- Drizzle Kit reads rental tables from `lib/db/schema.ts` and writes migrations to `drizzle/`.
- `lib/db/client.ts` exports the server-side Drizzle client backed by `@libsql/client`.
- `lib/domain/pricing.ts` quotes rental prices with USD-cent field names/formatting and rounds every started 24-hour period up to one rental day.
- `lib/domain/availability.ts` looks up active bike-type inventory and excludes unavailable bikes, pending or confirmed reservation conflicts, unassigned pending/confirmed reservation capacity, and reserved/maintenance/inactive availability blocks.
- `TURSO_DATABASE_URL` is required. `TURSO_AUTH_TOKEN` is required for remote Turso/libSQL URLs and omitted for local `file:` URLs. Stripe Checkout/webhook handling requires `STRIPE_SECRET_KEY`; webhook verification also requires `STRIPE_WEBHOOK_SECRET`. Resend confirmation email delivery requires `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`; optional `PEDALGO_*` variables override confirmation-email pickup/contact copy. `NEXT_PUBLIC_APP_URL` or `APP_URL` sets Checkout success/cancel URL origins and defaults to `http://localhost:3000`. Database commands load `.env.local` and `.env` automatically. `README.md` is the canonical deployment environment contract and checklist.
- `pnpm db:seed` creates the MVP `PedalGo City Bike` bike type, `CITY-001`/`CITY-002` physical bikes, and a bootstrap admin user. It requires `ADMIN_BOOTSTRAP_PASSWORD` and defaults admin email/name when not supplied.
- `/admin/login` verifies credentials against active `admin_users`, then sets an 8-hour signed HTTP-only `pedalgo_admin_session` cookie scoped to `/admin`; production session signing requires `ADMIN_SESSION_SECRET`.
- `/admin` renders database-backed operations summary cards from reservation, payment, inventory, bike-type, and availability-block query boundaries. `/admin/reservations` renders a database-backed list with reservation/customer search, reservation status filtering, payment status filtering, payment state visibility, an admin-only manual reservation form that re-checks availability, and per-row cancellation controls for `pending`/`confirmed` reservations. Manual creation calculates current USD pricing, assigns an available bike when possible, and creates `pending` or `confirmed` reservations without charging cards. Cancellation changes only the reservation status/notes; existing payment rows remain visible and automated Stripe refunds are out of scope. `/admin/pricing` lets admins update active bike-type daily USD rates on `bike_types` with validation and timestamp updates; new availability/manual/public booking quotes use the updated bike-type rate, while reservation rows keep historical daily/total USD cents. `/admin/availability` lets admins create, update, and delete bike-type or bike-specific availability blocks after reservation/block conflict checks; saved `reserved`/`maintenance`/`inactive` blocks feed the shared availability service used by public booking and admin manual reservations. `/admin/calendar` renders a server-side month-navigation calendar/list hybrid for overlapping pending/confirmed/completed reservations and availability blocks, with day-level open/partial/unavailable indicators. Reports is a protected MVP section boundary without a reporting workflow.
- The current schema includes `bike_types`, `bikes`, `reservations`, `payments`, `availability_blocks`, and `admin_users` with foreign keys, indexes, timestamp fields, status check constraints, and USD-cent money columns (`*_usd_cents`).
- The public availability quote targets seeded bike type `bike-type-mvp-city-bike`, returns rental days and USD totals, and does not create reservations or checkout sessions.
- Pending public reservations target the same featured bike type, store customer details and USD totals, assign one available physical bike as the hold strategy when possible, and write hold-expiry metadata into reservation `notes`.
- Checkout creation inserts a `pending` `stripe` payment with the reservation USD amount, creates a Stripe Checkout Session with reservation/payment metadata, stores `provider_checkout_id`, and redirects to Stripe. Post-checkout pages classify read-only customer states as processing, confirmed, failed, or cancelled. Verified `checkout.session.completed` events with paid status update the payment to `confirmed`, transition a pending reservation to `confirmed`, and send one customer confirmation email for that transition; `checkout.session.expired` and `payment_intent.payment_failed` mark pending payment/reservation paths as `failed`.

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
