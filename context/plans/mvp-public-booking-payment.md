# MVP Public Booking, Stripe Checkout, and Confirmation Email

## Change summary

Implement the customer-facing PedalGo MVP booking flow: availability search, rental price display, customer information capture, Stripe Checkout payment, webhook-confirmed reservation finalization, and Resend confirmation email.

## Success criteria

- Homepage focuses immediately on booking with headline `Rent a Bike in Just a Few Clicks` and pickup/return date-time fields.
- Customer flow requires no account, registration, login, or password.
- Customers can check availability, see total BAM price, enter full name/email/phone, and proceed to Stripe Checkout.
- Reservations are created as `PENDING_PAYMENT` before checkout and become `CONFIRMED` only from a successful Stripe webhook.
- Reaching the success page never finalizes the reservation by itself.
- Confirmation email is sent after webhook-confirmed payment and includes reservation number, pickup/return times, total paid, pickup location, contact information, and pickup instructions.

## Constraints and non-goals

- Depends on `mvp-foundation-db-domain` being implemented first.
- In scope: public homepage/booking UI, customer reservation draft, availability API/server action, Stripe Checkout session creation, webhook handling, confirmation email, and customer success/cancel pages.
- Out of scope: customer accounts, category browsing, filters, discount codes, seasonal pricing, and admin dashboard features.
- Use Stripe Checkout and Resend in the first MVP phase.
- Customer UI may show one featured rental option only, but component/data boundaries should allow future multiple bike types.

## Task stack

- [ ] T01: `Update homepage booking entry` (status:todo)
  - Task ID: T01
  - Goal: Make the homepage center the MVP booking process with hero copy, pickup/return date-time fields, primary `Check Availability` CTA, how-it-works steps, and a featured rental card.
  - Boundaries (in/out of scope): In - homepage and public booking-entry components. Out - backend checkout/session behavior and admin UI.
  - Done when: Users can start with pickup/return date-time from the homepage and navigate into availability/booking review without seeing category filters or account prompts.
  - Verification notes (commands or checks): `pnpm lint`; manually inspect homepage flow in `pnpm dev`.

- [ ] T02: `Implement availability check endpoint or server action` (status:todo)
  - Task ID: T02
  - Goal: Connect pickup/return date-time input to database-backed availability and pricing results for the featured rental option.
  - Boundaries (in/out of scope): In - availability input validation, date ordering validation, rental-day/price response, unavailable-state response. Out - checkout creation and email sending.
  - Done when: Valid date ranges return availability and total BAM price; invalid ranges return clear errors; unavailable ranges cannot proceed to payment.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually test available, unavailable, and invalid date ranges.

- [ ] T03: `Capture customer details and create pending reservation` (status:todo)
  - Task ID: T03
  - Goal: Add the customer information step and create a `PENDING_PAYMENT` reservation after re-validating availability.
  - Boundaries (in/out of scope): In - full name/email/phone validation, pending reservation creation, reservation number generation. Out - Stripe session creation and webhook confirmation.
  - Done when: Customer info can be submitted without account creation; a pending reservation stores customer details, rental period, assigned/held bike strategy, total price, and expiration metadata if implemented.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; inspect database record after submitting valid customer details.

- [ ] T04: `Create Stripe Checkout session` (status:todo)
  - Task ID: T04
  - Goal: Create a Stripe Checkout session for a pending reservation and redirect the customer to hosted payment.
  - Boundaries (in/out of scope): In - Stripe SDK/config, checkout route/server action, success/cancel URLs, metadata linking to reservation/payment. Out - webhook finalization and email sending.
  - Done when: Pending reservations can produce Stripe Checkout sessions with correct BAM amount and metadata; customer is redirected to Stripe Checkout.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; run Stripe test-mode checkout manually with test keys.

- [ ] T05: `Finalize reservation from Stripe webhook` (status:todo)
  - Task ID: T05
  - Goal: Handle Stripe webhook events to mark payments successful/failed and confirm reservations only after verified successful payment.
  - Boundaries (in/out of scope): In - raw-body webhook verification, idempotency, payment record updates, reservation status transitions. Out - email template delivery, admin views, and success-page confirmation logic beyond read-only status display.
  - Done when: Verified successful checkout events transition reservation to `CONFIRMED`; failed/expired payment paths update status appropriately; duplicate webhooks are safe.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; test with Stripe CLI webhook forwarding and repeat delivery.

- [ ] T06: `Send Resend confirmation email` (status:todo)
  - Task ID: T06
  - Goal: Send a confirmation email after webhook-confirmed payment with all required reservation and pickup details.
  - Boundaries (in/out of scope): In - email provider config, confirmation email template/content, send trigger after confirmation. Out - marketing emails, SMS/WhatsApp, admin notifications.
  - Done when: Confirmed reservations send one customer email containing reservation number, pickup/return date-time, total amount paid, pickup location, contact information, and pickup instructions.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; verify delivery using Resend test/domain setup or provider logs in development.

- [ ] T07: `Add customer success and cancellation pages` (status:todo)
  - Task ID: T07
  - Goal: Add post-checkout pages that clearly distinguish payment processing, confirmed, failed, and cancelled states without finalizing reservations client-side.
  - Boundaries (in/out of scope): In - read-only status lookup by safe token/session reference and customer messaging. Out - customer self-service cancellation or account portal.
  - Done when: Success page displays current reservation/payment state and tells customers to check email after confirmation; cancel page explains no confirmed reservation exists unless payment later succeeds via webhook.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; manually test success/cancel redirects with Stripe test checkout.

- [ ] T08: `Repair durable context for public booking and payment` (status:todo)
  - Task ID: T08
  - Goal: Update SCE context to reflect the implemented customer booking, Stripe, webhook, and Resend architecture.
  - Boundaries (in/out of scope): In - concise current-state updates to context files and any durable decisions discovered. Out - implementation diary or temporary notes.
  - Done when: Future sessions can locate booking/payment/email code paths and understand webhook-only confirmation behavior from context.
  - Verification notes (commands or checks): Read context files and confirm they match code truth and MVP product decisions.

- [ ] T09: `Validate and clean up public booking work` (status:todo)
  - Task ID: T09
  - Goal: Run final public booking/payment checks and remove temporary development scaffolding.
  - Boundaries (in/out of scope): In - lint/build, Stripe test flow, Resend delivery check, stale mock cleanup where safe. Out - admin dashboard features.
  - Done when: Customer booking can be completed in test mode from homepage to webhook-confirmed reservation and confirmation email.
  - Verification notes (commands or checks): `pnpm lint`; `pnpm build`; Stripe CLI webhook test; Resend delivery/provider-log check; context sync review.

## Open questions

- Pickup location, contact information, and pickup instructions need final business copy during implementation if not already present in code/config.
