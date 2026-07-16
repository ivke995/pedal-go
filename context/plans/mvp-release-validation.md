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

- [ ] T04: `Check responsive and accessibility basics` (status:todo)
  - Task ID: T04
  - Goal: Ensure the MVP is usable on common mobile/desktop sizes and meets basic form/accessibility expectations.
  - Boundaries (in/out of scope): In - keyboard navigation, labels, focus states, responsive layout, clear error states. Out - comprehensive third-party accessibility audit unless already part of project tooling.
  - Done when: Public booking and admin flows are usable on mobile and desktop with labeled inputs and clear validation feedback.
  - Verification notes (commands or checks): Manual responsive inspection; browser accessibility checks where available; `pnpm lint`; `pnpm build`.

- [ ] T05: `Document deployment environment contract` (status:todo)
  - Task ID: T05
  - Goal: Document required environment variables and setup steps for Turso, Stripe, Resend, admin bootstrap, and public URLs.
  - Boundaries (in/out of scope): In - env var list, local/dev setup notes, webhook URL notes, deployment checklist. Out - provisioning production accounts directly.
  - Done when: A developer can configure local or deployed MVP integrations without reading implementation internals.
  - Verification notes (commands or checks): Review docs against actual env usage in code; confirm no secrets are committed.

- [ ] T06: `Repair durable context for release state` (status:todo)
  - Task ID: T06
  - Goal: Sync SCE context with the final MVP architecture and remove stale planning assumptions from core context.
  - Boundaries (in/out of scope): In - context map, overview, architecture, patterns, glossary, and durable decisions as needed. Out - storing release retrospectives in core context.
  - Done when: Context is concise, current-state oriented, and accurately points future agents to booking, payment, email, database, and admin code landmarks.
  - Verification notes (commands or checks): Read all updated context files for consistency with code truth and decisions.

- [ ] T07: `Final validation and cleanup` (status:todo)
  - Task ID: T07
  - Goal: Run final checks, clean temporary artifacts, and produce launch-readiness evidence.
  - Boundaries (in/out of scope): In - full lint/build, integration smoke evidence, cleanup of placeholders/temp files, plan status updates. Out - adding new MVP features.
  - Done when: All release checks pass or any remaining blockers are explicitly documented with owner/impact; temporary scaffolding is removed.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; database migration/seed check; Stripe webhook test; Resend email check; admin smoke test; context sync review.

## Open questions

- Production deployment target and public domain are not specified; validation can use local/development URLs until those are chosen.
