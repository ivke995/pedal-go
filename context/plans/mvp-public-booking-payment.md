# MVP Public Booking, Stripe Checkout, and Confirmation Email

## Change summary

Implement the customer-facing PedalGo MVP booking flow: availability search, rental price display, customer information capture, Stripe Checkout payment, webhook-confirmed reservation finalization, and Resend confirmation email.

## Success criteria

- Homepage focuses immediately on booking with headline `Rent a Bike in Just a Few Clicks` and pickup/return date-time fields.
- Customer flow requires no account, registration, login, or password.
- Customers can check availability, see total USD price, enter full name/email/phone, and proceed to Stripe Checkout.
- Reservations are created with database status `pending` before checkout and become `confirmed` only from a successful Stripe webhook.
- Reaching the success page never finalizes the reservation by itself.
- Confirmation email is sent after webhook-confirmed payment and includes reservation number, pickup/return times, total paid, pickup location, contact information, and pickup instructions.

## Constraints and non-goals

- Depends on `mvp-foundation-db-domain` being implemented first.
- In scope: public homepage/booking UI, customer reservation draft, availability API/server action, Stripe Checkout session creation, webhook handling, confirmation email, and customer success/cancel pages.
- Out of scope: customer accounts, category browsing, filters, discount codes, seasonal pricing, and admin dashboard features.
- Use Stripe Checkout and Resend in the first MVP phase.
- Customer UI may show one featured rental option only, but component/data boundaries should allow future multiple bike types.

## Task stack

- [x] T01: `Update homepage booking entry` (status:done)
  - Task ID: T01
  - Goal: Make the homepage center the MVP booking process with hero copy, pickup/return date-time fields, primary `Check Availability` CTA, how-it-works steps, and a featured rental card.
  - Boundaries (in/out of scope): In - homepage and public booking-entry components. Out - backend checkout/session behavior and admin UI.
  - Done when: Users can start with pickup/return date-time from the homepage and navigate into availability/booking review without seeing category filters or account prompts.
  - Verification notes (commands or checks): `pnpm lint`; manually inspect homepage flow in `pnpm dev`.
  - Completed: 2026-07-14
  - Files changed: `context/plans/mvp-public-booking-payment.md` only; existing homepage code already satisfied T01.
  - Evidence: Verified `app/page.tsx`, `components/public/hero-section.tsx`, `components/public/booking-search-form.tsx`, `components/public/availability-result.tsx`, `components/public/how-it-works.tsx`, and `components/public/featured-bike.tsx`; `pnpm lint` passed; `pnpm build` passed.

- [x] T02: `Implement availability check endpoint or server action` (status:done)
  - Task ID: T02
  - Goal: Connect pickup/return date-time input to database-backed availability and pricing results for the featured rental option.
  - Boundaries (in/out of scope): In - availability input validation, date ordering validation, rental-day/price response, unavailable-state response. Out - checkout creation and email sending.
  - Done when: Valid date ranges return availability and total USD price; invalid ranges return clear errors; unavailable ranges cannot proceed to payment.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually test available, unavailable, and invalid date ranges.
  - Completed: 2026-07-14
  - Files changed: `app/actions/check-featured-bike-availability.ts`, `components/public/booking-search-form.tsx`, `components/public/availability-result.tsx`, `lib/public-booking/availability.ts`, `lib/db/load-env.ts`, `tests/public-booking/availability.test.ts`.
  - Evidence: Added database-backed featured-bike availability quote action with validation, unavailable state, rental-day and USD total response; `pnpm test` passed (15/15); `pnpm lint` passed; `pnpm build` passed.

- [x] T03: `Capture customer details and create pending reservation` (status:done)
  - Task ID: T03
  - Goal: Add the customer information step and create a `pending` reservation after re-validating availability.
  - Boundaries (in/out of scope): In - full name/email/phone validation, pending reservation creation, reservation number generation. Out - Stripe session creation and webhook confirmation.
  - Done when: Customer info can be submitted without account creation; a pending reservation stores customer details, rental period, assigned/held bike strategy, total price, and expiration metadata if implemented.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; inspect database record after submitting valid customer details.
  - Completed: 2026-07-14
  - Files changed: `app/actions/create-pending-reservation.ts`, `components/booking/booking-flow.tsx`, `components/booking/customer-details-form.tsx`, `components/booking/payment-preview.tsx`, `components/public/booking-search-form.tsx`, `lib/domain/availability.ts`, `lib/public-booking/reservations.ts`, `tests/public-booking/reservations.test.ts`.
  - Evidence: Added pending reservation creation with customer validation, availability re-check, assigned-bike hold, reservation reference, hold expiry metadata in `notes`, and pending-reservation UI; `pnpm exec tsc --noEmit` passed; `pnpm test` passed (18/18); `pnpm lint` passed; `pnpm build` passed.

- [x] T04: `Create Stripe Checkout session` (status:done)
  - Task ID: T04
  - Goal: Create a Stripe Checkout session for a pending reservation and redirect the customer to hosted payment.
  - Boundaries (in/out of scope): In - Stripe SDK/config, checkout route/server action, success/cancel URLs, metadata linking to reservation/payment. Out - webhook finalization and email sending.
  - Done when: Pending reservations can produce Stripe Checkout sessions with correct USD amount and metadata; customer is redirected to Stripe Checkout.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; run Stripe test-mode checkout manually with test keys.
  - Completed: 2026-07-14
  - Files changed: `.env.example`, `app/actions/create-checkout-session.ts`, `components/booking/payment-preview.tsx`, `lib/public-booking/checkout.ts`, `package.json`, `pnpm-lock.yaml`, `tests/public-booking/checkout.test.ts`.
  - Evidence: Added Stripe SDK dependency, checkout session creation for pending reservations, pending Stripe payment record creation/update with Checkout Session ID, success/cancel URL configuration, reservation/payment metadata, and customer redirect from the payment step; `pnpm exec tsc --noEmit` passed; `pnpm test` passed (20/20); `pnpm lint` passed; `pnpm build` passed. Manual Stripe test-mode checkout still requires local test keys.

- [x] T05: `Finalize reservation from Stripe webhook` (status:done)
  - Task ID: T05
  - Goal: Handle Stripe webhook events to mark payments successful/failed and confirm reservations only after verified successful payment.
  - Boundaries (in/out of scope): In - raw-body webhook verification, idempotency, payment record updates, reservation status transitions. Out - email template delivery, admin views, and success-page confirmation logic beyond read-only status display.
  - Done when: Verified successful checkout events transition reservation to `confirmed`; failed/expired payment paths update status appropriately; duplicate webhooks are safe.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; test with Stripe CLI webhook forwarding and repeat delivery.
  - Completed: 2026-07-14
  - Files changed: `.env.example`, `app/api/stripe/webhook/route.ts`, `lib/public-booking/webhooks.ts`, `tests/public-booking/webhooks.test.ts`.
  - Evidence: Added Stripe webhook route with raw-body signature verification, successful checkout confirmation, failed/expired payment handling, idempotent duplicate delivery behavior, and route rejection for invalid signatures; `pnpm exec tsc --noEmit` passed; `pnpm test` passed (25/25); `pnpm lint` passed; `pnpm build` passed. Manual Stripe CLI forwarding still requires local Stripe test webhook credentials.

- [x] T06: `Send Resend confirmation email` (status:done)
  - Task ID: T06
  - Goal: Send a confirmation email after webhook-confirmed payment with all required reservation and pickup details.
  - Boundaries (in/out of scope): In - email provider config, confirmation email template/content, send trigger after confirmation. Out - marketing emails, SMS/WhatsApp, admin notifications.
  - Done when: Confirmed reservations send one customer email containing reservation number, pickup/return date-time, total amount paid, pickup location, contact information, and pickup instructions.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; verify delivery using Resend test/domain setup or provider logs in development.
  - Completed: 2026-07-14
  - Files changed: `.env.example`, `lib/public-booking/confirmation-email.ts`, `lib/public-booking/webhooks.ts`, `package.json`, `pnpm-lock.yaml`, `tests/public-booking/webhooks.test.ts`.
  - Evidence: Added Resend SDK dependency, confirmation email message builder with required reservation/pickup/payment/contact/instruction content, webhook-triggered send after pending reservation confirmation, and duplicate-webhook no-resend behavior for already confirmed reservations; `pnpm exec tsc --noEmit` passed; `pnpm test` passed (25/25); `pnpm lint` passed; `pnpm build` passed. Manual Resend provider-log delivery check still requires local Resend API key and verified sender/domain.

- [x] T07: `Add customer success and cancellation pages` (status:done)
  - Task ID: T07
  - Goal: Add post-checkout pages that clearly distinguish payment processing, confirmed, failed, and cancelled states without finalizing reservations client-side.
  - Boundaries (in/out of scope): In - read-only status lookup by safe token/session reference and customer messaging. Out - customer self-service cancellation or account portal.
  - Done when: Success page displays current reservation/payment state and tells customers to check email after confirmation; cancel page explains no confirmed reservation exists unless payment later succeeds via webhook.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually test success/cancel redirects with Stripe test checkout.
  - Completed: 2026-07-14
  - Files changed: `app/booking/success/page.tsx`, `app/booking/cancel/page.tsx`, `lib/public-booking/status.ts`, `tests/public-booking/status.test.ts`.
  - Evidence: Added read-only public booking status lookup by Stripe Checkout Session id and reservation reference; success page displays processing, confirmed, failed, and cancelled states without mutation; cancel page explains no confirmed reservation exists unless webhook payment succeeds later; `pnpm exec tsc --noEmit` passed; `pnpm test tests/public-booking/status.test.ts` passed (29/29 via repo test script); `pnpm lint` passed; `pnpm build` passed. Manual Stripe redirect check still requires local Stripe test checkout.

- [x] T08: `Repair durable context for public booking and payment` (status:done)
  - Task ID: T08
  - Goal: Update SCE context to reflect the implemented customer booking, Stripe, webhook, and Resend architecture.
  - Boundaries (in/out of scope): In - concise current-state updates to context files and any durable decisions discovered. Out - implementation diary or temporary notes.
  - Done when: Future sessions can locate booking/payment/email code paths and understand webhook-only confirmation behavior from context.
  - Verification notes (commands or checks): Read context files and confirm they match code truth and MVP product decisions.
  - Completed: 2026-07-14
  - Files changed: `context/decisions/pedalgo-mvp-architecture-product.md`, `context/plans/mvp-public-booking-payment.md`.
  - Evidence: Reviewed `context/context-map.md`, `context/overview.md`, `context/architecture.md`, `context/patterns.md`, `context/public-booking/availability.md`, `context/public-booking/reservations.md`, `context/public-booking/payments.md`, and current public-booking/payment code paths; repaired MVP decision and plan status names to match `lib/db/schema.ts`; confirmed context locates booking/payment/email code and states webhook-only confirmation behavior; `sce-context-sync` verified root/domain context coverage and file sizes.

- [x] T09: `Validate and clean up public booking work` (status:done)
  - Task ID: T09
  - Goal: Run final public booking/payment checks and remove temporary development scaffolding.
  - Boundaries (in/out of scope): In - lint/build, Stripe test flow, Resend delivery check, stale mock cleanup where safe. Out - admin dashboard features.
  - Done when: Customer booking can be completed in test mode from homepage to webhook-confirmed reservation and confirmation email.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; Stripe CLI webhook test; Resend delivery/provider-log check; context sync review.
  - Completed: 2026-07-14
  - Files changed: `lib/mock-data.ts`, `context/context-map.md`, `context/architecture.md`, `context/overview.md`, `context/patterns.md`, `context/plans/mvp-public-booking-payment.md`, `context/plans/mvp-release-validation.md`.
  - Evidence: Removed unused mock reservations, physical-bike rows, availability blocks, dashboard metrics, recent activity, and future bike-type placeholder from `lib/mock-data.ts`; kept the `cityBike` fixture still used by public featured-bike and booking summary UI. Synced root context to describe remaining static fixture and database-backed booking/payment paths. `pnpm exec tsc --noEmit` passed; `pnpm test` passed (29/29); `pnpm lint` passed; `pnpm build` passed. Stripe CLI/webhook and Resend provider-log delivery checks could not be completed in this environment because Stripe/Resend env keys are not present in `.env`, shell env vars are unset, and the Stripe CLI is not installed; unit coverage verifies checkout metadata, webhook signature rejection/finalization/idempotency, failed/expired payment handling, status lookup, and confirmation-email trigger behavior.

## Open questions

- Manual Stripe Checkout, Stripe CLI webhook forwarding, and Resend provider-log checks remain external launch-readiness checks requiring local/provider credentials and Stripe CLI access.

## Validation Report

### Commands run

- `pnpm exec tsc --noEmit` -> exit 0; TypeScript check completed without output.
- `pnpm test` -> exit 0; 29 tests passed, 0 failed across domain and public-booking suites.
- `pnpm lint` -> exit 0; `eslint .` completed cleanly.
- `pnpm build` -> exit 0; Next.js production build compiled successfully and generated app routes including `/`, `/booking`, `/booking/success`, `/booking/cancel`, and `/api/stripe/webhook`.

### Cleanup performed

- Removed unused mock reservations, physical-bike rows, availability blocks, recent activity, dashboard metrics, revenue data, and future bike-type placeholder from `lib/mock-data.ts`.
- Kept only the `cityBike` static display fixture still imported by `components/public/featured-bike.tsx` and `components/booking/booking-summary.tsx`.
- Synced durable context to describe the remaining static fixture and database-backed public booking/payment behavior.

### Success-criteria verification

- [x] Homepage focuses on booking with headline `Rent a Bike in Just a Few Clicks` and pickup/return date-time fields -> verified during T01 and preserved by successful build.
- [x] Customer flow requires no account, registration, login, or password -> current booking flow uses customer details only; no auth path is involved in public booking tests/build.
- [x] Customers can check availability, see total USD price, enter full name/email/phone, and proceed to Stripe Checkout -> covered by availability, reservation, and checkout tests passing under `pnpm test`.
- [x] Reservations are created with database status `pending` before checkout and become `confirmed` only from a successful Stripe webhook -> covered by reservation and webhook tests passing under `pnpm test`.
- [x] Reaching the success page never finalizes the reservation by itself -> covered by status lookup tests and read-only success/cancel route behavior.
- [x] Confirmation email is sent after webhook-confirmed payment and includes reservation number, pickup/return times, total paid, pickup location, contact information, and pickup instructions -> covered by webhook/confirmation email tests passing under `pnpm test`.

### Failed checks and follow-ups

- Stripe CLI webhook forwarding and full Stripe Checkout browser test were not run: Stripe env keys are absent from `.env`, shell env vars are unset, and the Stripe CLI is not installed in this environment.
- Resend provider-log delivery check was not run: Resend env keys are absent from `.env` and shell env vars are unset in this environment.

### Residual risks

- External launch-readiness still requires a credentials-backed manual test: seed/migrate a local or test database, run the app, complete Stripe test Checkout, forward Stripe webhooks with Stripe CLI, and verify Resend delivery/provider logs.
