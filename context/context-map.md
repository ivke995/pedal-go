# Context Map

Use this file first to find relevant durable context before changing code.

## Core files

- `context/overview.md` — High-level project purpose and current product scope.
- `context/architecture.md` — Current app structure, data boundaries, and verification commands.
- `context/patterns.md` — Coding, UI, domain, and SCE workflow conventions.
- `context/glossary.md` — Project and domain terms.
- `context/database/foundation.md` — Turso/libSQL, Drizzle setup, rental schema, domain services, env contract, and migration commands.
- `context/admin/authentication.md` — Admin login, active-admin credential verification, signed session cookie, logout, and protected admin route boundaries.
- `context/admin/dashboard.md` — Protected admin dashboard navigation, operations summary, reservation list/search, manual reservation creation, owner-controlled reservation verification, reservation cancellation, pricing management, availability-block management, and calendar boundaries.
- `context/public-booking/availability.md` — Homepage availability quote flow, server action boundary, and no-side-effect booking entry behavior.
- `context/public-booking/reservations.md` — Customer details/payment-method submission, pending reservation creation, selected-method instructions, notifications, and assigned-bike hold strategy.
- `context/public-booking/payments.md` — Current reservation-level manual-payment boundary, $48/day rate, server-only Venmo/Zelle instructions, Resend notifications, no-payment-table contract, and owner verification.
- `context/public-site/landing-page.md` — Current White Mountains public landing-page composition, visual/content contract, assets, and accessible navigation boundaries.
- `context/decisions/pedalgo-mvp-architecture-product.md` — Accepted MVP product, architecture, provider, status, and non-goal decisions.
- `README.md` — Human-facing setup and deployment environment contract for Turso/libSQL, manual payment configuration, Resend, admin bootstrap/session secrets, local development, and deployment checklist.

## Working artifacts

- `context/plans/` — Active implementation plans. Completed plans are disposable and should not be treated as durable history.
- `context/handovers/` — Handover notes for interrupted work or session transitions.
- `context/decisions/` — Durable architecture/product decisions when a decision needs long-term recall.
- `context/tmp/` — Temporary scratch space ignored by git except `.gitignore`.

## Code landmarks

- `app/page.tsx` — Public homepage composition.
- `app/actions/` — Server actions used by public/client UI.
- `app/booking/page.tsx` — Booking route entry.
- `app/admin/(auth)/login/` — Admin sign-in route and login server action.
- `app/admin/(dashboard)/` — Authenticated admin route group protected by the admin layout; includes summary, reservation list/search/manual creation/verification/cancellation, pricing, availability-block management, calendar, and reports route boundaries.
- `components/public/` — Public-facing page and search/availability components.
- `components/booking/` — Details, Venmo/Zelle method selection, submission, and reservation-confirmation components.
- `components/ui/` — Shared UI primitives.
- `lib/types.ts` — Shared domain types.
- `lib/pricing.ts` — Current UI USD pricing and formatting helpers.
- `lib/mock-data.ts` — Static featured city-bike fixture still used by public display components.
- `lib/db/` — Database env validation, Turso/libSQL client, and Drizzle rental schema.
- `lib/admin-auth/` — Server-only admin password verification, signed session cookie handling, and active-admin lookup.
- `lib/admin-dashboard/` — Server-side admin dashboard summary, reservation list/search, manual reservation creation, owner-controlled reservation verification, reservation cancellation, pricing management, availability-block management, and calendar helpers.
- `lib/domain/` — Server-side USD pricing and availability services for database-backed rental flows.
- `lib/public-booking/` — Public booking orchestration, UI-safe availability quote results, reservation creation, and server-side manual-payment instructions/notifications.
- `scripts/seed.ts` — MVP city-bike inventory and bootstrap admin seed workflow.
- `tests/domain/` — Unit tests for server-side pricing, date-range, and availability domain services.
- `tests/admin-dashboard/` — Unit tests for admin dashboard server-side orchestration, including manual reservations, verification, cancellation, pricing, availability blocks, and calendar helpers.
- `tests/public-booking/` — Unit tests for public booking availability, reservation, and notification boundaries.
- `tests/public-booking/reservations.test.ts` — Unit tests for pending reservation validation, availability re-check, and insert behavior.
- `drizzle.config.ts` — Drizzle Kit migration configuration.
- `drizzle/` — Generated Drizzle migration metadata/output.
- `README.md` — Canonical deployment/local setup document for required and optional environment variables.
