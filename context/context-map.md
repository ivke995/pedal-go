# Context Map

Use this file first to find relevant durable context before changing code.

## Core files

- `context/overview.md` — High-level project purpose and current product scope.
- `context/architecture.md` — Current app structure, data boundaries, and verification commands.
- `context/patterns.md` — Coding, UI, domain, and SCE workflow conventions.
- `context/glossary.md` — Project and domain terms.
- `context/database/foundation.md` — Turso/libSQL, Drizzle setup, rental schema, domain services, env contract, and migration commands.

## Working artifacts

- `context/plans/` — Active implementation plans. Completed plans are disposable and should not be treated as durable history.
- `context/handovers/` — Handover notes for interrupted work or session transitions.
- `context/decisions/` — Durable architecture/product decisions when a decision needs long-term recall.
- `context/tmp/` — Temporary scratch space ignored by git except `.gitignore`.

## Code landmarks

- `app/page.tsx` — Public homepage composition.
- `app/booking/page.tsx` — Booking route entry.
- `components/public/` — Public-facing page and search/availability components.
- `components/booking/` — Booking flow components.
- `components/ui/` — Shared UI primitives.
- `lib/types.ts` — Shared domain types.
- `lib/pricing.ts` — Pricing and formatting helpers.
- `lib/mock-data.ts` — Mock inventory, reservations, availability, and metrics data.
- `lib/db/` — Database env validation, Turso/libSQL client, and Drizzle rental schema.
- `lib/domain/` — Server-side BAM pricing and availability services for database-backed rental flows.
- `scripts/seed.ts` — MVP city-bike inventory and bootstrap admin seed workflow.
- `tests/domain/` — Unit tests for server-side pricing, date-range, and availability domain services.
- `drizzle.config.ts` — Drizzle Kit migration configuration.
- `drizzle/` — Generated Drizzle migration metadata/output.
