# Plan: Rename BAM Currency Domain to USD

## Change summary

Update PedalGo so every current code, data, schema, test, seed, and durable-context place that treats BAM/KM as the application currency instead uses USD. Existing numeric price amounts remain unchanged; this is a currency-label/name/field migration, not an exchange-rate conversion.

## Success criteria

- No active application code, database schema definitions, generated migrations, seed output, tests, README, or current-state SCE context presents BAM/KM as PedalGo's currency.
- Server-side pricing helpers format USD and expose USD-named APIs/fields instead of BAM-named APIs/fields.
- Database-backed money columns and Drizzle model properties use USD minor-unit naming such as `*_usd_cents` / `*UsdCents`.
- Existing numeric amounts remain unchanged, including the seeded daily rate value.
- Existing rental-day rounding, quote, availability, lint, test, and build behavior continues to pass.

## Constraints and non-goals

- No exchange-rate conversion is in scope.
- Do not change product prices, rental-day calculation rules, Stripe/payment behavior, or booking UX beyond currency naming/display effects.
- Do not introduce new dependencies or a broader localization/i18n system.
- Keep the change compatible with the existing Drizzle/Turso/libSQL setup.
- Since the current generated migration is an initial foundation migration and no production migration requirement was provided, implementation may regenerate/replace the initial migration if that matches current project practice; if existing deployed data must be preserved, stop and ask before choosing a migration strategy.

## Assumptions

- User confirmed scope is all code/data, not only user-facing copy.
- User confirmed numeric values should not be converted; only labels, field names, helper names, schema names, tests, and documentation should move from BAM/KM terminology to USD.
- Active plan history may mention BAM when recording past completed work, but current-state files and active unfinished task acceptance criteria should be updated to USD where they guide future implementation.

## Task stack

- [x] T01: `Rename server-side pricing currency to USD` (status:done)
  - Task ID: T01
  - Goal: Replace BAM-specific pricing helper names, quote field names, formatter behavior, and pricing unit tests with USD equivalents while preserving numeric behavior.
  - Boundaries (in/out of scope): In - `lib/domain/pricing.ts`, direct imports/usages of renamed helpers, and `tests/domain/pricing.test.ts`. Out - database column renames, generated migration files, seed script wording, docs/context updates.
  - Done when: Pricing quotes expose `dailyRateUsdCents` and `totalUsdCents`; the formatter uses USD formatting; pricing tests assert unchanged numeric totals with USD labels.
  - Verification notes (commands or checks): `pnpm test`; search application source for `formatBamCents`, `BamCents`, `bam_cents`, and `BAM` to identify remaining planned work.
  - Completed: 2026-07-14
  - Files changed: `lib/domain/pricing.ts`, `tests/domain/pricing.test.ts`
  - Evidence: `pnpm test` passed (12/12 tests); `pnpm lint` passed; `pnpm build` passed; targeted search found remaining BAM/BamCents/bam_cents references only in later-task scope (`lib/db/schema.ts`, `scripts/seed.ts`, `tests/domain/availability.test.ts`, README/context/plans).
  - Notes: Renamed server-side pricing quote fields and helpers to USD (`dailyRateUsdCents`, `totalUsdCents`, `calculateTotalUsdCents`, `formatUsdCents`) while preserving numeric totals.

- [x] T02: `Rename database money fields to USD cents` (status:done)
  - Task ID: T02
  - Goal: Change Drizzle schema money fields and generated database migration SQL from BAM-cent naming to USD-cent naming without changing stored numeric meanings.
  - Boundaries (in/out of scope): In - `lib/db/schema.ts`, Drizzle migration SQL/metadata as needed, and code/tests that reference schema money fields. Out - unrelated schema changes, data conversion, booking/payment implementation behavior not yet present.
  - Done when: Bike type, reservation, and payment money columns/properties use `daily_rate_usd_cents`, `total_usd_cents`, `amount_usd_cents`, `dailyRateUsdCents`, `totalUsdCents`, and `amountUsdCents`; generated migration state matches the schema.
  - Verification notes (commands or checks): `TURSO_DATABASE_URL=file:./local.db pnpm db:check`; `pnpm test`; targeted search for `bam_cents`, `BamCents`, and `BAM` in source/migration files.
  - Completed: 2026-07-14
  - Files changed: `lib/db/schema.ts`, `drizzle/0000_lyrical_amazoness.sql`, `drizzle/meta/0000_snapshot.json`, `scripts/seed.ts`, `tests/domain/availability.test.ts`
  - Evidence: `TURSO_DATABASE_URL=file:./local.db pnpm db:check` passed; `pnpm test` passed (12/12 tests); `pnpm lint` passed; `pnpm build` passed; targeted search found no `bam_cents`/`BamCents` in TypeScript, SQL, or JSON source/migration files and no `BAM` in migration files.
  - Notes: Renamed database money columns/properties to USD-cent naming while preserving numeric seed/test values. `scripts/seed.ts` still has planned T03 output wording that says `BAM cents/day`, but its schema property usage now matches `dailyRateUsdCents`.

- [x] T03: `Update seed and repository currency references` (status:done)
  - Task ID: T03
  - Goal: Update seed output, README, and active implementation plans so future contributors see USD as the project currency.
  - Boundaries (in/out of scope): In - `scripts/seed.ts`, `README.md`, active/incomplete plan acceptance criteria and task wording that currently says BAM. Out - completed historical evidence that must remain an accurate record, broad prose rewrites unrelated to currency.
  - Done when: Seed logs describe USD cents/day; README describes the seeded daily rate in USD; active future plan tasks reference USD prices/amounts.
  - Verification notes (commands or checks): Search Markdown and scripts for `BAM`, `KM`, `bam_cents`, and `BamCents`; manually verify any remaining matches are historical completed-plan evidence or explicitly justified.
  - Completed: 2026-07-14
  - Files changed: `scripts/seed.ts`, `README.md`, `context/plans/mvp-public-booking-payment.md`, `context/plans/mvp-admin-dashboard.md`, `context/overview.md`, `context/glossary.md`
  - Evidence: `pnpm test` passed (12/12 tests); `pnpm lint` passed; `pnpm build` passed; targeted `python3` search found no `BAM`, `KM`, `bam_cents`, or `BamCents` in T03 current/future-facing targets (`scripts/seed.ts`, `README.md`, `context/plans/mvp-public-booking-payment.md`, `context/plans/mvp-admin-dashboard.md`). Broader Markdown search remaining matches are historical completed-plan evidence or the active USD migration plan's own legacy-term search criteria. Context sync updated root wording that still described seed/README cleanup as pending.
  - Notes: Seed output now reports `USD cents/day`; README seed data says `25.00 USD/day`; future public booking/payment and admin pricing tasks now reference USD amounts/prices.

- [x] T04: `Sync durable context currency state` (status:done)
  - Task ID: T04
  - Goal: Update durable SCE context to describe USD as the current database-backed and UI currency.
  - Boundaries (in/out of scope): In - `context/overview.md`, `context/architecture.md`, `context/patterns.md`, `context/glossary.md`, `context/context-map.md`, `context/database/foundation.md`, and durable decisions if they represent current product truth. Out - implementation diary notes or unrelated architecture rewrites.
  - Done when: Future sessions can understand that PedalGo stores and formats USD minor-unit prices throughout current UI and database-backed domain flows.
  - Verification notes (commands or checks): Read core context files and confirm current-state currency terminology matches code; search `context/` for remaining `BAM`/`KM` and classify any intentional historical matches.
  - Completed: 2026-07-14
  - Files changed: `context/overview.md`, `context/context-map.md`, `context/glossary.md`
  - Evidence: Read `context/overview.md`, `context/architecture.md`, `context/patterns.md`, `context/glossary.md`, `context/context-map.md`, `context/database/foundation.md`, and `context/decisions/pedalgo-mvp-architecture-product.md`; targeted core-context search found no `BAM`, `KM`, `bam_cents`, or `BamCents`; broader `context/` search remaining matches are historical completed-plan evidence or the active USD migration plan's own legacy-term search criteria; `pnpm lint` passed.
  - Notes: Durable current-state context now describes USD as the current UI display, server-side quote, and database storage currency, with database-backed money represented as USD cents.

- [x] T05: `Validate USD currency migration` (status:done)
  - Task ID: T05
  - Goal: Run final verification for the complete currency migration and remove any temporary scaffolding.
  - Boundaries (in/out of scope): In - full tests, lint, build, database schema check, final source/context search, and plan evidence updates. Out - new behavior beyond fixing defects discovered by validation.
  - Done when: `pnpm test`, `pnpm lint`, `pnpm build`, and `TURSO_DATABASE_URL=file:./local.db pnpm db:check` pass or failures are documented with clear environmental cause; no unplanned BAM/KM references remain; context is synchronized.
  - Verification notes (commands or checks): `pnpm test`; `pnpm lint`; `pnpm build`; `TURSO_DATABASE_URL=file:./local.db pnpm db:check`; final repository search for `BAM`, `KM`, `bam_cents`, and `BamCents`.
  - Completed: 2026-07-14
  - Files changed: `context/plans/usd-currency-domain-migration.md`
  - Evidence: `pnpm test` passed (12/12 tests); `pnpm lint` passed; `pnpm build` passed; `TURSO_DATABASE_URL=file:./local.db pnpm db:check` passed. Final repository search found remaining `BAM`, `KM`, `bam_cents`, and `BamCents` references only in historical completed plan evidence or the active USD migration plan's own legacy-term scope/search criteria.
  - Notes: No application code, database schema definitions, generated migrations, seed output, tests, README, or current-state SCE context presents BAM/KM as PedalGo's current currency.

## Validation Report

### Commands run

- `pnpm test` -> exit 0; 12/12 tests passed across pricing, date-range, and availability suites.
- `pnpm lint` -> exit 0; ESLint completed cleanly.
- `pnpm build` -> exit 0; Next.js production build compiled and generated static routes successfully.
- `TURSO_DATABASE_URL=file:./local.db pnpm db:check` -> exit 0; Drizzle Kit reported `Everything's fine`.
- Final repository search for `BAM`, `KM`, `bam_cents`, and `BamCents` -> remaining matches are historical completed plan evidence or this plan's own legacy-term scope/search criteria, not active application code, schema, generated migrations, seed output, tests, README, or current-state durable context.

### Success-criteria verification

- [x] No active application code, database schema definitions, generated migrations, seed output, tests, README, or current-state SCE context presents BAM/KM as PedalGo's currency.
- [x] Server-side pricing helpers format USD and expose USD-named APIs/fields.
- [x] Database-backed money columns and Drizzle model properties use USD minor-unit naming.
- [x] Numeric amounts remain unchanged, including the seeded daily rate value.
- [x] Rental-day rounding, quote, availability, lint, test, build, and database schema-check behavior pass.

### Failed checks and follow-ups

- None.

### Temporary scaffolding

- None identified or removed.

### Residual risks

- Historical completed plan files still mention legacy BAM/KM terminology as implementation history; current-state context and active source truth use USD.

## Open questions

- None for planning. If implementation discovers existing deployed databases that must be migrated in place instead of regenerating the initial migration, stop and ask for migration strategy approval.
