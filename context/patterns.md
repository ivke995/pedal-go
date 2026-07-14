# Patterns

## React and Next.js

- App Router route files live under `app/`.
- Client components use the `'use client'` directive when they need browser state/hooks.
- Route-level pages compose smaller feature components rather than embedding large UI directly.
- Shared imports use the `@/` path alias.

## Styling and UI

- Tailwind CSS utility classes are used throughout components.
- UI primitives live in `components/ui/` and should be reused before creating one-off controls.
- Public site sections live in `components/public/`.
- Booking-specific components live in `components/booking/`.

## Domain logic

- Keep domain types in `lib/types.ts`.
- Keep current UI pricing calculations and USD display formatting helpers in `lib/pricing.ts` until booking paths migrate to database-backed pricing.
- Keep server-side database-backed rental pricing and availability logic in `lib/domain/`; do not import those helpers into client components when they pull in database access.
- Keep mock/static app data in `lib/mock-data.ts` until individual UI paths migrate to database-backed access.
- Keep database connection code under `lib/db/`; do not import the database client into client components.
- Keep Drizzle tables, relations, status constants, indexes, and database check constraints in `lib/db/schema.ts`.
- Use USD-cent names for database-backed money columns and server-side pricing fields (`*_usd_cents` / `*UsdCents`).
- Generate migrations with `pnpm db:generate` using `TURSO_DATABASE_URL`.
- Keep MVP seed data in `scripts/seed.ts`; seeds should be idempotent, avoid committed secrets, and require explicit bootstrap credentials through environment variables loaded from the shell, `.env.local`, or `.env`.
- Cover server-side domain behavior with Node test-runner tests under `tests/domain/`; run them with `pnpm test`.
- Keep database foundation details in `context/database/foundation.md`; core context should summarize and link rather than duplicate the full schema.

## SCE workflow

- Plan non-trivial changes in `context/plans/` before implementation.
- Use stable task IDs (`T01`, `T02`, ...).
- Keep durable context current-state oriented; do not store completed-work summaries in core context files.
