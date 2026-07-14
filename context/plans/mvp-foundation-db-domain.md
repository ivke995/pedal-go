# MVP Foundation: Turso, Drizzle, and Domain Model

## Change summary

Create the backend domain foundation for PedalGo MVP using Turso/libSQL and Drizzle ORM. Replace frontend-only assumptions with a future-proof rental schema while keeping the customer MVP limited to one featured rental option.

## Success criteria

- Turso/libSQL and Drizzle are configured for local development and deployment environments.
- Domain schema supports `BikeType`, `Bike`, `Reservation`, `Payment`, `AvailabilityBlock`, and `AdminUser`.
- Reservation, bike, and payment statuses match the accepted MVP product decisions.
- Pricing uses BAM and the rule that every started 24-hour period counts as one rental day.
- Pricing, date-range, and availability domain services are covered by unit tests rather than only ad-hoc helper checks.
- Seed data creates one active bike type and enough inventory for MVP availability checks.
- Existing mock-data-dependent UI can be migrated incrementally without breaking build checks.

## Constraints and non-goals

- In scope: database configuration, schema, migrations, seed data, domain helpers, and server-side data access boundaries.
- Out of scope: public booking UI overhaul, Stripe Checkout, Resend emails, and admin dashboard screens; those are covered in later MVP plans.
- Use Turso/libSQL, not PostgreSQL.
- Keep Drizzle schema compatible with future multiple bike types and multiple physical bikes.
- Do not add customer account models for MVP.
- Prefer a lightweight TypeScript-compatible unit test setup; do not introduce browser/E2E testing for this foundation task stack.

## Task stack

- [x] T01: `Configure Turso/libSQL and Drizzle` (status:done)
  - Task ID: T01
  - Goal: Add the database client, Drizzle configuration, environment variable contract, and migration script wiring for Turso/libSQL.
  - Boundaries (in/out of scope): In - dependencies, `drizzle.config` setup, database client module, documented env vars. Out - schema tables and application feature behavior.
  - Done when: The app can initialize a Turso/libSQL Drizzle client from environment variables; migration generation commands are available through package scripts or documented workflow.
  - Verification notes (commands or checks): `pnpm lint`; run the configured Drizzle generation/check command; verify missing env vars fail with a clear development error.

- [x] T02: `Define rental domain schema` (status:done)
  - Task ID: T02
  - Goal: Create Drizzle tables and typed enums/constants for bike types, bikes, reservations, payments, availability blocks, and admin users.
  - Boundaries (in/out of scope): In - table definitions, relationships, indexes, timestamps, status constants. Out - route handlers, Stripe, email, and admin UI.
  - Done when: The schema can represent one MVP rental product and future multiple bike types/inventory units; reservation/payment/bike statuses are encoded consistently.
  - Verification notes (commands or checks): Generate a migration successfully; inspect generated SQL for expected tables, foreign keys, indexes, and status constraints or application-level equivalents.

- [x] T03: `Add pricing and availability domain services` (status:done)
  - Task ID: T03
  - Goal: Implement server-side helpers for rental-day calculation, BAM formatting, total price calculation, and availability lookup against bikes/reservations/availability blocks.
  - Boundaries (in/out of scope): In - pure/domain functions and database query helpers. Out - UI flow, checkout sessions, and admin screens.
  - Done when: Rental duration rounds every started 24-hour period up to one rental day; availability excludes conflicting confirmed/rented periods and maintenance/inactive blocks.
  - Verification notes (commands or checks): Add targeted unit tests if the repo test setup exists, otherwise add deterministic helper checks where appropriate; run `pnpm lint` and `pnpm build`.

- [x] T04: `Add unit tests for pricing and availability services` (status:done)
  - Task ID: T04
  - Goal: Replace the current deterministic script-only coverage with repeatable unit tests for server-side rental-day calculation, BAM price quoting/formatting, date-range overlap logic, and availability filtering behavior.
  - Boundaries (in/out of scope): In - minimal test runner setup if none exists, unit tests for `lib/domain/pricing.ts`, `lib/domain/date-ranges.ts`, and availability service behavior using mocks/fakes or an isolated local test database. Out - browser/E2E tests, booking UI tests, checkout/payment tests, and broad refactors of domain service APIs unless required for testability.
  - Done when: Unit tests cover exact 24-hour, partial-day, invalid-range, BAM total, overlap/non-overlap, unavailable bike status, confirmed reservation conflicts, unassigned confirmed reservation capacity, and reserved/maintenance/inactive block scenarios; a package script can run the tests consistently.
  - Verification notes (commands or checks): Run the new unit test command; run `pnpm lint` and `pnpm build`; remove or clearly demote any redundant ad-hoc helper check if the unit tests supersede it.

- [x] T05: `Seed MVP rental inventory and admin bootstrap data` (status:done)
  - Task ID: T05
  - Goal: Add seed workflow for one active bike type, one or more physical bikes, baseline pricing in BAM, and an initial admin bootstrap path.
  - Boundaries (in/out of scope): In - seed script/data and safe admin bootstrap instructions. Out - admin login UI and production credential provisioning automation unless already supported by project conventions.
  - Done when: A fresh local database can be seeded with the MVP featured rental and initial admin access data without manual SQL editing.
  - Verification notes (commands or checks): Run migration and seed workflow against a local/libSQL development database; confirm seeded records through Drizzle queries or a lightweight inspection script.

- [x] T06: `Repair durable context for database foundation` (status:done)
  - Task ID: T06
  - Goal: Update SCE context so future sessions know the project uses Turso/libSQL, Drizzle, BAM pricing, and database-backed rental domain models.
  - Boundaries (in/out of scope): In - `context/overview.md`, `context/architecture.md`, `context/patterns.md`, `context/glossary.md`, and context map updates if needed. Out - completed-work narrative or implementation diary.
  - Done when: Durable context describes the current database-backed architecture and no longer presents USD/mock-only assumptions as current truth after implementation.
  - Verification notes (commands or checks): Read updated context files and confirm they are concise, current-state oriented, and consistent with implemented code.

- [x] T07: `Validate and clean up foundation work` (status:done)
  - Task ID: T07
  - Goal: Run final foundation checks and remove temporary scaffolding before moving to booking/payment implementation.
  - Boundaries (in/out of scope): In - lint/build, migration/seed verification, dead mock cleanup only where safe. Out - unrelated UI redesign or payment integration.
  - Done when: Verification passes, temporary files are removed, and the foundation is ready for the public booking/payment plan.
  - Verification notes (commands or checks): Unit test command; `pnpm lint`; `pnpm build`; migration generation/apply check; seed check; context sync review.

## Open questions

- None blocking. Deployment-specific Turso database names/tokens can be supplied during implementation.

## Task evidence

### T01: Configure Turso/libSQL and Drizzle

- **Status:** done
- **Completed:** 2026-07-14
- **Files changed:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.env.example`, `README.md`, `drizzle.config.ts`, `drizzle/meta/_journal.json`, `lib/db/env.ts`, `lib/db/client.ts`, `lib/db/schema.ts`
- **Evidence:** `pnpm lint` passed; `TURSO_DATABASE_URL=file:./local.db pnpm db:generate` passed with no schema changes; `TURSO_DATABASE_URL=file:./local.db pnpm db:check` passed; `pnpm build` passed; `pnpm db:generate` without `TURSO_DATABASE_URL` failed with the expected clear missing-env error.
- **Notes:** Added Turso/libSQL and Drizzle dependencies, Drizzle config, env contract, database client boundary, migration scripts, and an empty schema placeholder for T02 tables.

### T02: Define rental domain schema

- **Status:** done
- **Completed:** 2026-07-14
- **Files changed:** `lib/db/schema.ts`, `drizzle/0000_lyrical_amazoness.sql`, `drizzle/meta/_journal.json`
- **Evidence:** `TURSO_DATABASE_URL=file:./local.db pnpm db:generate` generated six rental-domain tables; inspected generated SQL for expected tables, foreign keys, indexes, and status/positive/date checks; `TURSO_DATABASE_URL=file:./local.db pnpm db:check` passed; `TURSO_DATABASE_URL=file:./local.db pnpm db:migrate` applied successfully; `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed.
- **Notes:** Added Drizzle tables, relations, typed status constants, BAM-cent price fields, timestamp fields, foreign keys, indexes, and check constraints for bike types, bikes, reservations, payments, availability blocks, and admin users.

### T03: Add pricing and availability domain services

- **Status:** done
- **Completed:** 2026-07-14
- **Files changed:** `lib/domain/pricing.ts`, `lib/domain/date-ranges.ts`, `lib/domain/availability.ts`, `scripts/check-domain-services.mjs`
- **Evidence:** `node scripts/check-domain-services.mjs` passed; `pnpm exec tsc --noEmit` passed; `pnpm lint` passed; `pnpm build` passed.
- **Notes:** Added server-side BAM-cent price quoting/formatting, rental-day rounding helpers, overlap detection, and Drizzle-backed bike-type availability lookup that filters inactive products, unavailable bikes, confirmed reservation conflicts, unassigned confirmed reservation capacity, and reserved/maintenance/inactive availability blocks.

### T04: Add unit tests for pricing and availability services

- **Status:** done
- **Completed:** 2026-07-14
- **Files changed:** `package.json`, `pnpm-lock.yaml`, `tests/domain/pricing.test.ts`, `tests/domain/date-ranges.test.ts`, `tests/domain/availability.test.ts`, `scripts/check-domain-services.mjs`
- **Evidence:** `pnpm test` passed with 12 tests across 3 suites; `pnpm exec tsc --noEmit` passed; `pnpm lint` passed; `pnpm build` passed.
- **Notes:** Added repeatable Node test runner coverage for rental-day rounding, invalid ranges, BAM totals/formatting, overlap behavior, unavailable inventory, confirmed reservation conflicts, unassigned confirmed reservation capacity, and availability block scenarios. Removed the superseded ad-hoc domain service check script.

### T05: Seed MVP rental inventory and admin bootstrap data

- **Status:** done
- **Completed:** 2026-07-14
- **Files changed:** `.gitignore`, `.env.example`, `README.md`, `package.json`, `drizzle.config.ts`, `lib/db/env.ts`, `lib/db/load-env.ts`, `scripts/seed.ts`
- **Evidence:** `TURSO_DATABASE_URL=file:./local.db pnpm db:migrate` passed; `TURSO_DATABASE_URL=file:./local.db ADMIN_BOOTSTRAP_PASSWORD='replace-this-password' pnpm db:seed` passed and confirmed `PedalGo City Bike`, `CITY-001`, `CITY-002`, and `admin@pedalgo.local`; reran `pnpm db:seed` successfully to confirm idempotence; after env-loading follow-up, reran local migrate/seed, `pnpm test` passed with 12 tests across 3 suites, `pnpm exec tsc --noEmit` passed, `pnpm lint` passed, and `pnpm build` passed.
- **Notes:** Added `pnpm db:seed` with idempotent MVP city-bike inventory and bootstrap admin user creation. The seed requires `ADMIN_BOOTSTRAP_PASSWORD`, defaults admin email/name when not supplied, and stores a PBKDF2-SHA256 password hash for future admin-auth integration. Database commands and scripts now load `.env.local`/`.env` without overriding shell variables; `.env` and local DB artifacts are ignored.

### T06: Repair durable context for database foundation

- **Status:** done
- **Completed:** 2026-07-14
- **Files changed:** `context/overview.md`, `context/architecture.md`, `context/patterns.md`, `context/glossary.md`, `context/database/foundation.md`, `context/plans/mvp-foundation-db-domain.md`
- **Evidence:** Read durable context and confirmed it is concise/current-state oriented; clarified mock UI/USD wording versus database-backed BAM domain truth; aligned database command examples with required local environment variables; `pnpm lint` passed.
- **Notes:** Context now points future sessions to Turso/libSQL, Drizzle, BAM minor-unit pricing, rental schema/domain services, seed workflow, and the remaining mock UI migration boundary.

### T07: Validate and clean up foundation work

- **Status:** done
- **Completed:** 2026-07-14
- **Files changed:** `package.json`, `pnpm-workspace.yaml`, `context/plans/mvp-foundation-db-domain.md`
- **Evidence:** `pnpm test` passed with 12 tests across 3 suites; `pnpm lint` passed; `pnpm build` passed; `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-validate.db pnpm db:generate` reported no schema changes; `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-validate.db pnpm db:check` passed; `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-validate.db pnpm db:migrate` applied migrations; `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-validate.db ADMIN_BOOTSTRAP_PASSWORD='replace-this-password' pnpm db:seed` seeded `PedalGo City Bike`, `CITY-001`, `CITY-002`, and `admin@pedalgo.local`.
- **Notes:** Removed the local `local.db` artifact. Moved the `hono` pnpm override from `package.json` to `pnpm-workspace.yaml`, which removes pnpm's ignored-field warning while preserving the locked override. No safe mock-data cleanup was performed because current UI routes still depend on mock/static data until later MVP plans.

## Validation Report

### Commands run

- `pnpm test` -> exit 0; 12 tests passed across 3 suites.
- `pnpm lint` -> exit 0; ESLint completed cleanly.
- `pnpm build` -> exit 0; Next.js production build compiled and prerendered `/`, `/_not-found`, and `/booking`.
- `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-final.db pnpm db:generate` -> exit 0; Drizzle inspected 6 tables and reported no schema changes.
- `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-final.db pnpm db:check` -> exit 0; Drizzle reported `Everything's fine`.
- `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-final.db pnpm db:migrate` -> exit 0; migrations applied successfully to a disposable libSQL file database.
- `TURSO_DATABASE_URL=file:/tmp/opencode/pedalgo-foundation-final.db ADMIN_BOOTSTRAP_PASSWORD='replace-this-password' pnpm db:seed` -> exit 0; seeded `PedalGo City Bike`, `CITY-001`, `CITY-002`, and `admin@pedalgo.local`.

### Success-criteria verification

- [x] Turso/libSQL and Drizzle are configured for local development and deployment environments -> confirmed by `drizzle.config.ts`, `lib/db/env.ts`, migration commands, and final Drizzle generate/check/migrate output.
- [x] Domain schema supports `BikeType`, `Bike`, `Reservation`, `Payment`, `AvailabilityBlock`, and `AdminUser` -> confirmed by Drizzle output listing 6 tables: `bike_types`, `bikes`, `reservations`, `payments`, `availability_blocks`, and `admin_users`.
- [x] Reservation, bike, and payment statuses match accepted MVP decisions -> confirmed by status constants/check constraints in `lib/db/schema.ts` and successful migration validation.
- [x] Pricing uses BAM and every started 24-hour period counts as one rental day -> confirmed by `lib/domain/pricing.ts` and pricing tests in `pnpm test`.
- [x] Pricing, date-range, and availability services are covered by unit tests -> confirmed by `pnpm test` passing 12 tests across pricing, date-range, and availability suites.
- [x] Seed data creates one active bike type and enough inventory for MVP availability checks -> confirmed by final `pnpm db:seed` output for `PedalGo City Bike`, `CITY-001`, and `CITY-002`.
- [x] Existing mock-data-dependent UI can be migrated incrementally without breaking build checks -> confirmed by `pnpm build` passing with current routes.

### Cleanup and context

- Removed local `local.db` generated artifact.
- Moved pnpm override configuration from ignored `package.json#pnpm.overrides` to `pnpm-workspace.yaml`.
- Context sync classified T07 as verify-only; root context and `context/database/foundation.md` already reflect the final implemented behavior.

### Failed checks and follow-ups

- None.

### Residual risks

- UI routes still use mock/static data and USD display helpers by design; migration to database-backed BAM booking/payment flows is deferred to later MVP plans.
