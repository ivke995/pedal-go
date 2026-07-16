# MVP Release Validation and Launch Readiness

## Change summary

Perform cross-cutting validation after the foundation, public booking/payment, and admin dashboard plans are implemented. Confirm the full PedalGo MVP works end-to-end and that context reflects the current architecture.

## Success criteria

- A customer can complete the full flow from homepage availability search through Stripe test payment, webhook-confirmed reservation, and confirmation email.
- An admin can log in and manage reservations, pricing, availability, maintenance blocks, and calendar views.
- Database migrations/seeds work from a clean Turso/libSQL development database.
- Environment variables and integration setup are documented clearly enough for deployment.
- Durable context files describe current code truth and no stale mock/USD-only assumptions remain.

## Constraints and non-goals

- This plan is for validation, hardening, and cleanup after the feature plans are substantially complete.
- In scope: full smoke tests, integration checks, environment documentation, accessibility/responsiveness pass, context sync, and launch-readiness fixes.
- Out of scope: new product features, customer accounts, advanced pricing, discounts, multiple bike categories in public UI, analytics expansion, and mobile apps.

## Task stack

- [x] T01: `Verify clean database setup` (status:done)
  - Task ID: T01
  - Goal: Confirm migrations and seed data work on a fresh Turso/libSQL development database.
  - Boundaries (in/out of scope): In - migration apply, seed run, baseline data inspection. Out - schema redesign unless validation exposes a blocking defect.
  - Done when: A clean database can be prepared without manual SQL and contains the MVP bike type, inventory, pricing, and admin bootstrap data.
  - Verification notes (commands or checks): Run migration and seed workflow; inspect expected records through app/admin UI or Drizzle query tooling.
  - Completed: 2026-07-16
  - Evidence: Against disposable local libSQL database `file:context/tmp/release-validation-t01.sqlite`, `TURSO_DATABASE_URL="file:context/tmp/release-validation-t01.sqlite" pnpm db:migrate` applied migrations successfully; `pnpm db:seed` with local bootstrap admin env completed and printed `PedalGo City Bike (2500 USD cents/day)`, `CITY-001, CITY-002`, and `admin@pedalgo.local (active)`; Drizzle query inspection confirmed one active seeded bike type (`bike-type-mvp-city-bike` / `city-bike` / `dailyRateUsdCents: 2500`), two available bikes (`CITY-001`, `CITY-002`), and active bootstrap admin `admin-bootstrap`; `TURSO_DATABASE_URL="file:context/tmp/release-validation-t01.sqlite" pnpm db:check` returned `Everything's fine`.
  - Notes: No application code or schema changes were needed; the failed first ad-hoc inspection command used unsupported top-level await in `tsx -e`, then succeeded with an async IIFE.

- [x] T02: `Run customer booking end-to-end test` (status:done)
  - Task ID: T02
  - Goal: Validate the full no-account customer booking flow with Stripe test mode and Resend confirmation.
  - Boundaries (in/out of scope): In - homepage, availability, quote, customer details, checkout, webhook, confirmation email, success/cancel status pages. Out - new booking features.
  - Done when: A test customer booking becomes `confirmed` only after webhook success and sends one correct confirmation email.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; Stripe CLI webhook forwarding; Resend provider log/delivery check.
  - Completed: 2026-07-16
  - Files changed: `lib/public-booking/webhooks.ts`, `tests/public-booking/webhooks.test.ts`, `context/public-booking/payments.md`, `context/plans/mvp-release-validation.md`.
  - Evidence: Baseline `pnpm lint` and `pnpm build` passed before manual smoke execution. First Stripe test booking (`PG-20260716-716BF502`, checkout session `cs_test_a14pVQXq2KKzVRhRs8Cjy4sE3n3fTCX3e5QmOTCTKGewusGSif4B1W6Sao`) proved reservation/payment were `pending` before webhook and exposed a blocking defect: `checkout.session.completed` returned `500` after Resend rejected unverified sender domain `pedalgo.example`, while DB had already moved the reservation/payment to `confirmed`. Fixed webhook finalization ordering so pending reservations are confirmed only after confirmation email send succeeds; payment confirmation remains recorded from Stripe webhook evidence. Added regression test that failed email send does not confirm the reservation. Targeted `pnpm exec tsx --test tests/public-booking/webhooks.test.ts` passed 6/6, followed by `pnpm lint` and `pnpm build` passing. Rerun with `RESEND_FROM_EMAIL="PedalGo <onboarding@resend.dev>"` created fresh test booking `PG-20260716-0C30C10B` / checkout session `cs_test_a1ntuvjdyva19xHoIDsxlEzgBRexfCGFcFlPbHgowpXiOiBqrizUGJg4B6`; pre-webhook DB state was reservation `pending` and payment `pending` for 5000 USD cents; Stripe CLI forwarded `checkout.session.completed` event `evt_1TtvQFDrjxy1fSDpASRXmj9d` with `[200]`; post-webhook DB inspection showed reservation `confirmed`, payment `confirmed`, provider payment id `pi_3TtvQEDrjxy1fSDp4voRSC06`, paid at `2026-07-16T19:58:19.000Z`. Success page showed confirmed reservation/payment status. Resend Emails log showed exactly one matching email id `fb84f578-f592-4c7c-86d2-e47f35330b98` to `delivered@resend.dev`, from `PedalGo <onboarding@resend.dev>`, subject `PedalGo reservation confirmed: PG-20260716-0C30C10B`, sent and delivered at Jul 16 21:58.
  - Notes: For local Resend smoke tests, `RESEND_FROM_EMAIL` must use a verified domain/sender or Resend's allowed onboarding sender; otherwise Stripe webhook retries surface the email-provider error and the reservation remains pending after the T02 fix.

- [x] T03: `Run admin operations smoke test` (status:done)
  - Task ID: T03
  - Goal: Validate core admin workflows against real database-backed booking data.
  - Boundaries (in/out of scope): In - login/logout, reservation search, manual reservation, cancellation, price update, maintenance block, calendar visibility. Out - role/permission expansion and automated refunds.
  - Done when: Admin workflows perform expected status/availability changes without exposing admin pages to unauthenticated users.
  - Verification notes (commands or checks): Manual smoke test in local dev; `pnpm lint`; `pnpm build`.
  - Completed: 2026-07-16
  - Files changed: `context/plans/mvp-release-validation.md`.
  - Evidence: Against disposable local libSQL database `file:context/tmp/release-validation-t03.sqlite`, `pnpm db:migrate` applied migrations and `pnpm db:seed` created `PedalGo City Bike`, `CITY-001`/`CITY-002`, and active bootstrap admin `admin-t03@pedalgo.local`. Targeted `pnpm exec tsx --test tests/admin-dashboard/*.test.ts` passed 16/16 admin dashboard unit tests. Admin smoke script `context/tmp/admin-smoke-t03.ts` verified seeded admin password hash, created confirmed manual reservation `PG-ADM-20260716-98684636`, found it by reference/customer search query, confirmed it consumed one seeded bike, verified calendar visibility while active, updated daily price to 3100 USD cents and confirmed future public quote used the new price while the existing reservation retained 2500 USD cents, cancelled the reservation and confirmed availability returned to two bikes, created maintenance block `4da6a8ef-8caa-4b01-8dc0-497f9c2c83a5`, confirmed the block made the matching window unavailable, and confirmed the calendar included the maintenance block. HTTP route-protection smoke with local Next dev returned `307 http://localhost:3000/admin/login` for unauthenticated `GET /admin`. `pnpm lint` passed. `pnpm build` passed and listed all admin routes as dynamic server-rendered routes.
  - Notes: No application-code changes were needed; T03 used ignored scratch artifacts under `context/tmp/`.

- [x] T04: `Check responsive and accessibility basics` (status:done)
  - Task ID: T04
  - Goal: Ensure the MVP is usable on common mobile/desktop sizes and meets basic form/accessibility expectations.
  - Boundaries (in/out of scope): In - keyboard navigation, labels, focus states, responsive layout, clear error states. Out - comprehensive third-party accessibility audit unless already part of project tooling.
  - Done when: Public booking and admin flows are usable on mobile and desktop with labeled inputs and clear validation feedback.
  - Verification notes (commands or checks): Manual responsive inspection; browser accessibility checks where available; `pnpm lint`; `pnpm build`.
  - Completed: 2026-07-16
  - Files changed: `context/plans/mvp-release-validation.md`.
  - Evidence: Code-level responsive/accessibility pass found no application-code fixes required. Public homepage availability form and `/booking` customer flow use labeled inputs, `aria-invalid`/`aria-describedby` error wiring, `role="alert"` or polite status regions for validation/availability/checkout feedback, responsive single-column-to-grid layouts, and shared input/button focus-visible ring styles. Admin login and dashboard forms use explicit labels or contextual `aria-label`s for inline table actions; admin dashboard navigation is horizontally scrollable on narrow widths; reservation/availability/calendar tables use the shared horizontally scrollable table wrapper; admin summary/pricing/availability/reservation forms collapse to mobile-friendly single-column layouts. `pnpm lint` passed. `pnpm build` passed with Next.js 16.2.6/Turbopack, compiling successfully in 5.6s and generating all 14 static pages.
  - Notes: T04 was verification-only; no root application code changes were needed. This was an MVP basics pass, not a comprehensive third-party accessibility audit.

- [x] T05: `Document deployment environment contract` (status:done)
  - Task ID: T05
  - Goal: Document required environment variables and setup steps for Turso, Stripe, Resend, admin bootstrap, and public URLs.
  - Boundaries (in/out of scope): In - env var list, local/dev setup notes, webhook URL notes, deployment checklist. Out - provisioning production accounts directly.
  - Done when: A developer can configure local or deployed MVP integrations without reading implementation internals.
  - Verification notes (commands or checks): Review docs against actual env usage in code; confirm no secrets are committed.
  - Completed: 2026-07-16
  - Files changed: `README.md`, `context/context-map.md`, `context/architecture.md`, `context/patterns.md`, `context/glossary.md`, `context/plans/mvp-release-validation.md`.
  - Evidence: Audited env usage in `lib/db/env.ts`, `drizzle.config.ts`, `lib/admin-auth/session.ts`, `lib/public-booking/checkout.ts`, `lib/public-booking/confirmation-email.ts`, `app/api/stripe/webhook/route.ts`, and `scripts/seed.ts`; expanded `README.md` with a deployment environment contract covering Turso/libSQL, Stripe Checkout/webhook, Resend email, admin bootstrap/session variables, public URL origin behavior, local development setup, and deployment checklist. Synced durable context so `README.md` is discoverable as the canonical environment contract and runtime config summaries include optional confirmation-email `PEDALGO_*` overrides. `pnpm lint` passed. `pnpm build` passed with Next.js 16.2.6/Turbopack and generated all 14 app routes. Secret-pattern search for Stripe/Resend key shapes returned no matches in tracked Markdown/TypeScript/JSON source files before and after context sync. An attempted `rg` secret search after lint/build failed because `rg` is not installed in the environment; the dedicated repository grep check was used instead.
  - Notes: Production domain/deployment target remains unspecified, so docs use route shapes such as `https://<public-domain>/api/stripe/webhook` and require `NEXT_PUBLIC_APP_URL` or `APP_URL` to be set per environment.

- [x] T06: `Repair durable context for release state` (status:done)
  - Task ID: T06
  - Goal: Sync SCE context with the final MVP architecture and remove stale planning assumptions from core context.
  - Boundaries (in/out of scope): In - context map, overview, architecture, patterns, glossary, and durable decisions as needed. Out - storing release retrospectives in core context.
  - Done when: Context is concise, current-state oriented, and accurately points future agents to booking, payment, email, database, and admin code landmarks.
  - Verification notes (commands or checks): Read all updated context files for consistency with code truth and decisions.
  - Completed: 2026-07-16
  - Files changed: `context/context-map.md`, `context/overview.md`, `context/architecture.md`, `context/database/foundation.md`, `context/admin/dashboard.md`, `context/public-booking/availability.md`, `context/decisions/pedalgo-mvp-architecture-product.md`, `context/plans/mvp-release-validation.md`.
  - Evidence: Audited release-state durable context across `context/context-map.md`, `context/overview.md`, `context/architecture.md`, `context/patterns.md`, `context/glossary.md`, `context/database/foundation.md`, `context/admin/authentication.md`, `context/admin/dashboard.md`, `context/public-booking/availability.md`, `context/public-booking/reservations.md`, `context/public-booking/payments.md`, and `context/decisions/pedalgo-mvp-architecture-product.md`. Repaired stale current-state wording about future implementation plans, Stripe Checkout not being implemented, domain-only test scope, reports placeholder wording, and decision status; added the MVP decision file to the context map. Read updated files back for consistency. Targeted current-state context search found no remaining `BAM`, `KM`, stale `before Stripe checkout is implemented`, `future implementation plans`, or `USD-only` matches outside historical plan artifacts.
  - Notes: Markdown/context-only task; no application code changes, lint, build, or runtime tests were needed.

- [x] T07: `Final validation and cleanup` (status:done)
  - Task ID: T07
  - Goal: Run final checks, clean temporary artifacts, and produce launch-readiness evidence.
  - Boundaries (in/out of scope): In - full lint/build, integration smoke evidence, cleanup of placeholders/temp files, plan status updates. Out - adding new MVP features.
  - Done when: All release checks pass or any remaining blockers are explicitly documented with owner/impact; temporary scaffolding is removed.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; database migration/seed check; Stripe webhook test; Resend email check; admin smoke test; context sync review.
  - Completed: 2026-07-16
  - Files changed: `context/plans/mvp-release-validation.md`; cleaned ignored scratch artifacts under `context/tmp/`.
  - Evidence: Final validation passed: `pnpm test` passed 46/46 tests across 13 suites; `pnpm lint` passed; `pnpm build` passed with Next.js 16.2.6/Turbopack, compiled successfully in 6.1s, and generated all 14 app routes. Clean local database validation against disposable `file:context/tmp/release-validation-t07.sqlite` passed: `pnpm db:migrate` applied migrations, `pnpm db:seed` created `PedalGo City Bike`, `CITY-001`, `CITY-002`, and active bootstrap admin `admin-t07@pedalgo.local`, and `pnpm db:check` returned `Everything's fine`. Admin smoke validation against disposable `file:context/tmp/release-validation-t07-admin.sqlite` passed via server-side admin workflow script: verified seeded admin password hash, created manual reservation `PG-ADM-20260716-65CD86E3`, confirmed availability consumption, updated daily price to 3100 USD cents, cancelled the reservation and released availability, created maintenance block `cdc7b904-2476-450e-93d9-168e90747442`, and confirmed calendar visibility. Stripe CLI is installed (`stripe version 1.43.8`). Stripe webhook and Resend smoke passed against disposable `file:context/tmp/release-validation-t07-webhook.sqlite` using configured local integration environment without printing secret values: signed `checkout.session.completed` request to `app/api/stripe/webhook/route.ts` returned 200/`handled`, sent confirmation email to Resend test recipient `delivered@resend.dev`, and confirmed reservation `PG-T07-FFE25FAD` plus payment with provider payment id recorded. Temporary validation artifacts were removed; `context/tmp/` now contains only `.gitignore`.
  - Notes: No release-blocking validation failures remain. Production deployment target/public domain is still unspecified and must be chosen outside this code-validation plan; current docs require setting `NEXT_PUBLIC_APP_URL` or `APP_URL` per environment.

## Open questions

- Production deployment target and public domain are not specified; validation can use local/development URLs until those are chosen.

## Validation Report

### Commands run

- `pnpm test` -> exit 0; 46/46 tests passed across 13 suites.
- `pnpm lint` -> exit 0; ESLint completed cleanly.
- `pnpm build` -> exit 0; Next.js 16.2.6/Turbopack compiled successfully and generated all 14 app routes.
- `TURSO_DATABASE_URL="file:context/tmp/release-validation-t07.sqlite" pnpm db:migrate` -> exit 0; migrations applied successfully to a disposable local libSQL database.
- `TURSO_DATABASE_URL="file:context/tmp/release-validation-t07.sqlite" ADMIN_BOOTSTRAP_PASSWORD="..." ADMIN_BOOTSTRAP_EMAIL="admin-t07@pedalgo.local" pnpm db:seed` -> exit 0; MVP bike type, two bikes, and active bootstrap admin seeded.
- `TURSO_DATABASE_URL="file:context/tmp/release-validation-t07.sqlite" pnpm db:check` -> exit 0; Drizzle Kit returned `Everything's fine`.
- Admin smoke script against disposable `file:context/tmp/release-validation-t07-admin.sqlite` -> exit 0; verified admin password hash, manual reservation, search, availability consumption/release, price update, cancellation, maintenance block, and calendar visibility.
- Signed Stripe webhook/Resend smoke against disposable `file:context/tmp/release-validation-t07-webhook.sqlite` -> exit 0; webhook route returned 200/`handled`, Resend accepted the confirmation email to `delivered@resend.dev`, and reservation/payment moved to `confirmed`.

### Cleanup

- Removed temporary validation scripts, logs, and disposable local libSQL databases from `context/tmp/`; only `context/tmp/.gitignore` remains.

### Success-criteria verification

- [x] Customer flow from availability through Stripe webhook-confirmed reservation and confirmation email -> confirmed by T02 full smoke evidence plus T07 signed webhook/Resend smoke.
- [x] Admin can log in and manage reservations, pricing, availability, maintenance blocks, and calendar views -> confirmed by T03 and T07 admin smoke evidence.
- [x] Database migrations/seeds work from a clean Turso/libSQL development database -> confirmed by T01 and T07 disposable local libSQL migrate/seed/check evidence.
- [x] Environment variables and integration setup are documented clearly enough for deployment -> confirmed by T05 README/context updates and T07 validation using the documented local env contract without printing secrets.
- [x] Durable context files describe current code truth and no stale mock/USD-only assumptions remain -> confirmed by T06 context repair and T07 context-sync review.

### Failed checks and follow-ups

- None.

### Residual risks

- Production deployment target/public domain remains unspecified; set `NEXT_PUBLIC_APP_URL` or `APP_URL` for the chosen environment before production launch.
- Real production Stripe and Resend accounts/domains must be configured with production secrets and verified sender/domain outside this local validation plan.
