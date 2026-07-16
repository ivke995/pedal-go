# Context Map

Use this file first to find relevant durable context before changing code.

## Core files

- `context/overview.md` — High-level project purpose and current product scope.
- `context/architecture.md` — Current app structure, data boundaries, and verification commands.
- `context/patterns.md` — Coding, UI, domain, and SCE workflow conventions.
- `context/glossary.md` — Project and domain terms.
- `context/database/foundation.md` — Turso/libSQL, Drizzle setup, rental schema, domain services, env contract, and migration commands.
- `context/admin/authentication.md` — Admin login, active-admin credential verification, signed session cookie, logout, and protected admin route boundaries.
- `context/admin/dashboard.md` — Protected admin dashboard navigation, operations summary, reservation list/search, manual reservation creation, reservation cancellation, and pricing management boundaries.
- `context/public-booking/availability.md` — Homepage availability quote flow, server action boundary, and no-side-effect booking entry behavior.
- `context/public-booking/reservations.md` — Customer details submission, pending reservation creation, and assigned-bike hold strategy.
- `context/public-booking/payments.md` — Stripe Checkout creation, pending payment records, metadata contract, webhook-only reservation confirmation, Resend confirmation email trigger, and failed/expired payment handling.

## Working artifacts

- `context/plans/` — Active implementation plans. Completed plans are disposable and should not be treated as durable history.
- `context/handovers/` — Handover notes for interrupted work or session transitions.
- `context/decisions/` — Durable architecture/product decisions when a decision needs long-term recall.
- `context/tmp/` — Temporary scratch space ignored by git except `.gitignore`.

## Code landmarks

- `app/page.tsx` — Public homepage composition.
- `app/actions/` — Server actions used by public/client UI.
- `app/booking/page.tsx` — Booking route entry.
- `app/booking/success/page.tsx` and `app/booking/cancel/page.tsx` — Read-only post-Stripe customer status pages.
- `app/admin/(auth)/login/` — Admin sign-in route and login server action.
- `app/admin/(dashboard)/` — Authenticated admin route group protected by the admin layout; includes summary, reservation list/search/manual creation/cancellation, pricing, availability, calendar, and reports route boundaries.
- `components/public/` — Public-facing page and search/availability components.
- `components/booking/` — Booking flow components.
- `components/ui/` — Shared UI primitives.
- `lib/types.ts` — Shared domain types.
- `lib/pricing.ts` — Current UI USD pricing and formatting helpers.
- `lib/mock-data.ts` — Static featured city-bike fixture still used by public display components.
- `lib/db/` — Database env validation, Turso/libSQL client, and Drizzle rental schema.
- `lib/admin-auth/` — Server-only admin password verification, signed session cookie handling, and active-admin lookup.
- `lib/admin-dashboard/` — Server-side admin dashboard summary, reservation list/search, manual reservation creation, reservation cancellation, and pricing management helpers.
- `lib/domain/` — Server-side USD pricing and availability services for database-backed rental flows.
- `lib/public-booking/` — Public booking orchestration, UI-safe availability quote results, Stripe Checkout, webhook finalization, confirmation email, and read-only post-checkout status lookup.
- `scripts/seed.ts` — MVP city-bike inventory and bootstrap admin seed workflow.
- `tests/domain/` — Unit tests for server-side pricing, date-range, and availability domain services.
- `tests/admin-dashboard/` — Unit tests for admin dashboard server-side orchestration, including manual reservations and cancellation.
- `tests/public-booking/` — Unit tests for public booking availability, reservation, and checkout orchestration.
- `tests/public-booking/reservations.test.ts` — Unit tests for pending reservation validation, availability re-check, and insert behavior.
- `tests/public-booking/checkout.test.ts` — Unit tests for pending Stripe payment and Checkout Session creation behavior.
- `tests/public-booking/webhooks.test.ts` — Unit tests for Stripe webhook payment/reservation finalization and invalid signature rejection.
- `tests/public-booking/status.test.ts` — Unit tests for read-only public booking status classification and lookup.
- `drizzle.config.ts` — Drizzle Kit migration configuration.
- `drizzle/` — Generated Drizzle migration metadata/output.
