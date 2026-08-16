# Patterns

## React and Next.js

- App Router route files live under `app/`.
- Server actions used by public client components live under `app/actions/` and should return UI-safe serializable results.
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
- Keep client-safe USD display formatting helpers in `lib/pricing.ts`; database-backed booking paths use server-side pricing from `lib/domain/pricing.ts`.
- Keep server-side database-backed rental pricing and availability logic in `lib/domain/`; do not import those helpers into client components when they pull in database access.
- Keep public booking orchestration in `lib/public-booking/`; client components should call server actions rather than importing database-backed domain helpers directly.
- Keep the manual-payment submission boundary server-side in `lib/public-booking/`; customer-facing Venmo/Zelle details must be introduced by the later notification/submission task and must not expose owner-only configuration.
- `pending_verification` is an unpaid/manual-review state. No client redirect, provider webhook, or customer claim may transition it to `confirmed`.
- Legacy Stripe checkout/webhook modules currently fail closed while the booking flow is migrated; provider artifact removal belongs to the later cleanup task.
- Keep admin authentication server-only in `lib/admin-auth/`; admin route groups under `app/admin/(dashboard)/` should use the protected layout rather than client-side access checks.
- Keep admin dashboard database reads and mutations server-side in `lib/admin-dashboard/`; protected admin pages/actions should import those helpers rather than importing the database client into client components.
- Keep only client-safe static display fixtures in `lib/mock-data.ts`; public booking availability, reservation, and status behavior must use database-backed server paths.
- Keep database connection code under `lib/db/`; do not import the database client into client components.
- Keep Drizzle tables, relations, status constants, indexes, and database check constraints in `lib/db/schema.ts`.
- Use USD-cent names for database-backed money columns and server-side pricing fields (`*_usd_cents` / `*UsdCents`).
- Generate migrations with `pnpm db:generate` using `TURSO_DATABASE_URL`.
- Keep MVP seed data in `scripts/seed.ts`; seeds should be idempotent, avoid committed secrets, and require explicit bootstrap credentials through environment variables loaded from the shell, `.env.local`, or `.env`.
- Keep deployment/local setup instructions and the full environment variable contract in `README.md` whenever runtime config requirements change.
- Cover server-side domain behavior with Node test-runner tests under `tests/domain/`; cover admin dashboard orchestration under `tests/admin-dashboard/`; cover public booking orchestration under `tests/public-booking/`; run them with `pnpm test`.
- Keep database foundation details in `context/database/foundation.md`; core context should summarize and link rather than duplicate the full schema.

## SCE workflow

- Plan non-trivial changes in `context/plans/` before implementation.
- Use stable task IDs (`T01`, `T02`, ...).
- Keep durable context current-state oriented; do not store completed-work summaries in core context files.
