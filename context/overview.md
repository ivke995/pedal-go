# Overview

PedalGo is a Next.js application for a bicycle rental booking experience.

Current user-facing scope:
- Public marketing/home page for renting bikes.
- Booking flow under `/booking` for selecting/reviewing rental details.
- UI paths still read mock/static rental data and USD display helpers until later MVP tasks migrate them to the database-backed domain.

Current backend foundation:
- Turso/libSQL and Drizzle ORM are configured for database-backed domain work.
- `lib/db/schema.ts` defines the rental domain schema for bike types, bikes, reservations, payments, availability blocks, and admin users.
- `lib/domain/` contains server-side rental pricing and availability helpers for database-backed booking paths.
- `scripts/seed.ts` seeds the MVP city-bike inventory and a bootstrap admin user for local/libSQL environments.
- Backend rental prices are stored as BAM minor units; current UI pricing remains mock/static until booking paths migrate to database access.

Known project metadata:
- Package name: `my-project`.
- App branding/title: `PedalGo — Rent a Bike in Just a Few Clicks`.
- Runtime framework: Next.js with React and TypeScript.
- Package manager: pnpm.
