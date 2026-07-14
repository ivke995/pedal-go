# Architecture

## Current structure

- `app/` — Next.js App Router routes and root layout.
  - `app/page.tsx` composes the public landing page.
  - `app/booking/page.tsx` hosts the booking flow inside `Suspense`.
  - `app/layout.tsx` defines metadata, fonts, analytics, and global toaster.
- `components/` — reusable React components.
  - `components/public/` contains public-site and booking-search presentation components.
  - `components/booking/` contains multi-step booking UI components.
  - `components/ui/` contains shadcn/Base UI-style primitives.
- `lib/` — shared utilities, domain types, mock data, pricing logic, domain services, and database boundary.
  - `lib/db/` contains Turso/libSQL env validation, the Drizzle client, and rental domain schema.
  - `lib/domain/` contains server-side rental pricing, date-range, and availability services for database-backed flows.
- `public/` — static assets.
- `scripts/seed.ts` — idempotent MVP database seed for bike inventory and bootstrap admin access.
- `drizzle.config.ts` — Drizzle Kit configuration for Turso/libSQL migrations.
- `drizzle/` — generated Drizzle migration metadata/output.
- `tests/domain/` — Node test-runner unit tests for server-side pricing, date-range, and availability domain behavior.

## Data and backend state

The user-facing app still reads mock rental inventory, reservations, availability, dashboard-like sample data, and USD pricing constants/formatting from `lib/mock-data.ts` and `lib/pricing.ts`.

The database foundation is configured but not yet integrated into feature behavior:
- Drizzle Kit reads rental tables from `lib/db/schema.ts` and writes migrations to `drizzle/`.
- `lib/db/client.ts` exports the server-side Drizzle client backed by `@libsql/client`.
- `lib/domain/pricing.ts` quotes rental prices with USD-cent field names/formatting and rounds every started 24-hour period up to one rental day.
- `lib/domain/availability.ts` looks up active bike-type inventory and excludes unavailable bikes, confirmed reservation conflicts, unassigned confirmed reservation capacity, and reserved/maintenance/inactive availability blocks.
- `TURSO_DATABASE_URL` is required. `TURSO_AUTH_TOKEN` is required for remote Turso/libSQL URLs and omitted for local `file:` URLs. Database commands load `.env.local` and `.env` automatically.
- `pnpm db:seed` creates the MVP `PedalGo City Bike` bike type, `CITY-001`/`CITY-002` physical bikes, and a bootstrap admin user. It requires `ADMIN_BOOTSTRAP_PASSWORD` and defaults admin email/name when not supplied.
- The current schema includes `bike_types`, `bikes`, `reservations`, `payments`, `availability_blocks`, and `admin_users` with foreign keys, indexes, timestamp fields, status check constraints, and USD-cent money columns (`*_usd_cents`).
- The UI still displays mock USD prices until later migration tasks replace the frontend data source.

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
