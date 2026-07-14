# Overview

PedalGo is a Next.js application for a bicycle rental booking experience.

Current user-facing scope:
- Public marketing/home page for renting bikes.
- Booking flow under `/booking` for selecting/reviewing rental details.
- UI paths read mock/static rental data and USD display helpers until later MVP tasks migrate them to database-backed domain queries.

Current backend foundation:
- Turso/libSQL and Drizzle ORM are configured for database-backed domain work.
- `lib/db/schema.ts` defines the rental domain schema for bike types, bikes, reservations, payments, availability blocks, and admin users.
- `lib/domain/` contains server-side USD rental pricing and availability helpers for database-backed booking paths.
- `scripts/seed.ts` seeds the MVP city-bike inventory and a bootstrap admin user for local/libSQL environments.
- Server-side pricing helpers, database money fields, seed output, README seed docs, current UI display helpers, and active future implementation plans use USD terminology. Database-backed money values are stored as USD cents; current UI mock prices format as USD until booking paths migrate to database access.

Known project metadata:
- Package name: `my-project`.
- App branding/title: `PedalGo — Rent a Bike in Just a Few Clicks`.
- Runtime framework: Next.js with React and TypeScript.
- Package manager: pnpm.
