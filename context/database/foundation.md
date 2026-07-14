# Database Foundation

PedalGo is configured for Turso/libSQL with Drizzle ORM.

## Code entrypoints

- `drizzle.config.ts` — Drizzle Kit config. Reads `lib/db/schema.ts`, writes migrations to `drizzle/`, and uses the Turso/libSQL dialect.
- `lib/db/env.ts` — Validates the database environment contract and produces libSQL client config.
- `lib/db/client.ts` — Exports the server-side Drizzle client.
- `lib/db/schema.ts` — Drizzle rental domain schema, typed status constants, and relations.
- `lib/domain/pricing.ts` — Server-side rental-day, USD-cent total, quote, and USD formatting helpers.
- `lib/domain/date-ranges.ts` — Shared overlap detection for rental/availability windows.
- `lib/domain/availability.ts` — Drizzle-backed bike-type availability lookup.
- `scripts/seed.ts` — Idempotent MVP seed for city-bike inventory and bootstrap admin access.
- `tests/domain/` — Repeatable unit tests for pricing, date-range overlap, and availability filtering behavior.

## Rental schema

Current tables:
- `bike_types` — rentable product categories with slug, description, active/sort flags, features JSON, and `daily_rate_usd_cents`.
- `bikes` — physical inventory units linked to bike types with unique codes and statuses.
- `reservations` — customer bookings linked to a bike type and optionally a specific bike, with pickup/return timestamps, rental days, USD totals, and status.
- `payments` — payment records linked to reservations with USD amount, provider identifiers, status, and payment/refund timestamps.
- `availability_blocks` — maintenance, reserved-demand, or inactive date ranges scoped to a bike type and/or bike.
- `admin_users` — admin bootstrap/auth records with unique email, password hash, status, and last-login timestamp.

Schema constraints include foreign keys, indexes for availability/reservation lookups, timestamp fields, positive price/day checks, and status check constraints.

## Domain services

- Rental days use the MVP rule that every started 24-hour period counts as one full day; invalid or empty ranges return zero days.
- Price quotes multiply rental days by the supplied daily rate in cents and return USD-cent field names/formatting. Database-backed money fields use USD-cent column/property names.
- Availability lookup requires an active bike type and available physical bikes.
- Availability excludes bike-specific confirmed reservation conflicts, unassigned confirmed reservations as capacity consumption, and reserved/maintenance/inactive availability blocks.
- Type-wide overlapping availability blocks with no `bike_id` make all bikes for the requested type unavailable during the block window.

## Environment contract

- `TURSO_DATABASE_URL` is required for database initialization and Drizzle commands.
- `TURSO_AUTH_TOKEN` is required for remote Turso/libSQL URLs.
- `TURSO_AUTH_TOKEN` is optional for local `file:` URLs such as `file:./local.db`.
- `ADMIN_BOOTSTRAP_PASSWORD` is required when running `pnpm db:seed`.
- `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_NAME` are optional seed overrides; defaults are `admin@pedalgo.local` and `PedalGo Admin`.

Database commands and scripts load `.env.local` and `.env` automatically without overriding already-set shell variables. Missing required variables fail with explicit errors during database client initialization or Drizzle command startup.

## MVP seed data

`pnpm db:seed` creates or updates:
- One active `PedalGo City Bike` bike type with slug `city-bike` and `daily_rate_usd_cents = 2500`.
- Two available physical bikes: `CITY-001` and `CITY-002`.
- One active bootstrap admin user with a PBKDF2-SHA256 password hash.

## Commands

- `pnpm test` — run domain unit tests.
- `TURSO_DATABASE_URL=file:./local.db pnpm db:generate` — generate migrations from the schema.
- `TURSO_DATABASE_URL=file:./local.db pnpm db:check` — validate generated migrations.
- `TURSO_DATABASE_URL=file:./local.db pnpm db:migrate` — apply migrations to the configured database.
- `TURSO_DATABASE_URL=file:./local.db ADMIN_BOOTSTRAP_PASSWORD='replace-this-password' pnpm db:seed` — seed MVP inventory and bootstrap admin access.

See also: [architecture](../architecture.md), [patterns](../patterns.md), [context map](../context-map.md).
