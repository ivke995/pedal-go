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

- [ ] T01: `Verify clean database setup` (status:todo)
  - Task ID: T01
  - Goal: Confirm migrations and seed data work on a fresh Turso/libSQL development database.
  - Boundaries (in/out of scope): In - migration apply, seed run, baseline data inspection. Out - schema redesign unless validation exposes a blocking defect.
  - Done when: A clean database can be prepared without manual SQL and contains the MVP bike type, inventory, pricing, and admin bootstrap data.
  - Verification notes (commands or checks): Run migration and seed workflow; inspect expected records through app/admin UI or Drizzle query tooling.

- [ ] T02: `Run customer booking end-to-end test` (status:todo)
  - Task ID: T02
  - Goal: Validate the full no-account customer booking flow with Stripe test mode and Resend confirmation.
  - Boundaries (in/out of scope): In - homepage, availability, quote, customer details, checkout, webhook, confirmation email, success/cancel status pages. Out - new booking features.
  - Done when: A test customer booking becomes `confirmed` only after webhook success and sends one correct confirmation email.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; Stripe CLI webhook forwarding; Resend provider log/delivery check.

- [ ] T03: `Run admin operations smoke test` (status:todo)
  - Task ID: T03
  - Goal: Validate core admin workflows against real database-backed booking data.
  - Boundaries (in/out of scope): In - login/logout, reservation search, manual reservation, cancellation, price update, maintenance block, calendar visibility. Out - role/permission expansion and automated refunds.
  - Done when: Admin workflows perform expected status/availability changes without exposing admin pages to unauthenticated users.
  - Verification notes (commands or checks): Manual smoke test in local dev; `pnpm lint`; `pnpm build`.

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
