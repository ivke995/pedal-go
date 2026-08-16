# White Mountains Bike Rentals Redesign

## Change summary

Redesign the public PedalGo marketing and booking experience into the White Mountains Bike Rentals brand using the supplied references as the visual direction while retaining the existing Next.js App Router, Tailwind, shadcn-style primitives, database-backed availability, and current image assets.

Replace the Stripe/payment-provider flow completely with a manual external-payment reservation flow:

- All current public bookings use a centralized flat rate of **$48/day**.
- Customers choose Venmo or Zelle as an instruction-only payment method.
- Reservations remain pending manual verification; no customer claim is treated as proof of payment.
- The selected method's server-configured instructions and exact total are shown after submission.
- Resend is reused for immediate customer and owner notification emails.
- Venmo/Zelle details, owner recipient, and sender identity are environment-configured and never hardcoded.
- Stripe, payment-provider persistence, webhooks, checkout pages, and related dependencies are removed.

## Current implementation inventory

### Reuse

- Next.js App Router routes and current `/booking` route boundary.
- Tailwind v4 tokens/utilities and existing `components/ui/*` primitives.
- Existing header/footer/section component organization under `components/public/`.
- `BookingSearchForm`, availability server action, `lib/domain/availability.ts`, date-range behavior, bike inventory, and reservation database boundary, adapted to the new status/rate contract.
- Existing city-bike and hero image assets under `public/images/` until the real logo and mountain photography are supplied.
- Existing Resend dependency and server-side email pattern.
- Existing admin authentication, reservation list, cancellation, pricing, availability, and calendar boundaries, adapted for manual verification.

### Remove

- `components/booking/payment-preview.tsx` and Stripe-specific booking UI.
- `app/actions/create-checkout-session.ts` and `lib/public-booking/checkout.ts`.
- `app/api/stripe/webhook/route.ts`, `lib/public-booking/webhooks.ts`, and Stripe status lookup used only by provider return pages.
- Stripe-only `/booking/success` and `/booking/cancel` provider-return pages, or replace their route usage with the in-flow reservation confirmation.
- The `payments` table, payment relations/provider fields, Stripe payment tests, Stripe dependency, and Stripe environment/docs references.
- Fake PedalGo/Sarajevo public contact copy and placeholder social links; do not preserve unverified business details.

### Change

- Rename the public brand to White Mountains Bike Rentals and use the supplied phone/service-area/Instagram-handle information where available.
- Replace provider payment state with a reservation-level payment method and manual-verification status.
- Update all server and client pricing paths from conflicting `$25/$30` values to the centralized `$48/day` rate; retain a single rate abstraction so future standard/hotel pricing can be added without reshaping booking APIs.
- Replace the current two-step details/Stripe checkout sequence with details → payment method → external-payment instructions/reservation received.
- Update admin metrics, lists, filters, calendar, cancellation, and manual reservation logic to stop depending on payment rows and to support explicit owner verification.
- Update durable context files after implementation so they describe the new current state rather than Stripe.

## Success criteria

1. The public homepage presents a responsive White Mountains Bike Rentals experience with deep navy, forest/olive green, off-white, muted blue, and restrained gold accents; it uses real HTML/components rather than a flyer image.
2. The homepage prominently communicates `EXPLORE MORE. RIDE MORE.`, White Mountains service around Lincoln/Woodstock, the $48/day current rate, free hotel delivery/pickup, bike inventory, how it works, contact/booking CTAs, and accessible responsive navigation.
3. The current booking flow validates availability before creating a reservation, accepts Venmo or Zelle, stores the selected method, calculates the exact total at $48 per rental day, and creates a reservation in a manual-verification state.
4. The confirmation UI and customer email show the reservation reference, rental dates, bike, duration, exact amount, selected payment method, method-specific payment instructions, and an explicit `Payment pending manual confirmation` message.
5. The owner email is sent immediately after submission with customer details, reservation details, amount due, and selected method. Owner email and payment configuration are server-only environment values.
6. No Stripe SDK, checkout session, webhook, payment table/provider record, payment-provider return route, automated payment confirmation, or customer `I paid` claim remains.
7. An authenticated owner/admin can see the selected payment method and manually move a pending reservation to confirmed only after independently verifying the external transaction; no client action or email/webhook performs that transition.
8. Existing availability, reservation, admin, and domain tests are updated and pass; lint and production build pass; responsive checks show no overflow, broken aspect ratios, inaccessible controls, or dead booking links.

## Constraints and non-goals

- Do not add Venmo/Zelle APIs, SDKs, webhooks, payment verification, automated reconciliation, or provider callbacks.
- Do not treat a customer checkbox, statement, redirect, or email as payment confirmation.
- Do not expose `OWNER_NOTIFICATION_EMAIL`, `EMAIL_FROM`, or unrelated payment configuration in client source. Only return the selected method's customer-facing instruction data after a valid reservation submission.
- Reuse Resend; do not introduce another mail provider. `RESEND_API_KEY` remains server-only.
- Use `EMAIL_FROM`, `OWNER_NOTIFICATION_EMAIL`, `VENMO_HANDLE`, and `ZELLE_RECIPIENT` as environment-configured values. Missing required configuration must fail clearly on the server without persisting a falsely confirmed payment.
- Use the supplied `603-348-1320`, Lincoln/Woodstock/White Mountains service-area language, and `@whitemountainsbikerentals` only where provided. Do not invent an email, street address, social URL, inventory, specifications, or additional business claim.
- Keep the current assets for now; make logo replacement localized to the brand component when the real logo is supplied.
- Keep the existing rental-day rule: every started 24-hour period counts as one rental day.
- The current $60/20%/$12 comparison is not an active pricing rule. Until distinct hotel pricing is implemented, public copy must not imply that some customers receive a different rate; show the actual flat $48/day offer.
- No broad backend rewrite, new inventory types, route redesign for admin authentication, or unrelated visual changes to protected admin screens beyond payment-status adaptation.

## Task stack

- [x] T01: `Move reservation domain to flat $48 manual-payment states` (status:done)
  - Task ID: T01
  - Goal: Establish the database/domain contract for the new current pricing and external-payment workflow.
  - Boundaries (in/out of scope): In — update the centralized pricing helpers and seed rate to $48/day; add a typed Venmo/Zelle payment-method value; add reservation payment method and `pending_verification` (plus any narrowly required transition) status; remove the `payments` table/relations/provider fields; update availability, reservation, admin-domain helpers, and migrations to treat pending manual-verification reservations as capacity-consuming; migrate existing legacy pending rows safely. Out — email delivery, booking form UI, homepage redesign, Stripe package/docs cleanup, and automated payment verification.
   - Done when: The schema has no payment-provider table, reservations persist the selected method and manual status, all quote/manual/public reservation paths use the centralized $48 rate, existing confirmed/cancelled semantics remain valid, and a forward migration updates legacy rows without silently marking anything paid.
   - Verification notes (commands or checks): Review generated Drizzle migration and schema check; run focused domain, availability, reservation, admin pricing, and reservation-status tests; confirm no domain import references `payments` or Stripe.
   - Completed: 2026-08-16
   - Files changed: `lib/db/schema.ts`, `lib/domain/`, `lib/public-booking/`, `lib/admin-dashboard/`, `scripts/seed.ts`, focused tests, and `drizzle/0001_daily_ser_duncan.sql`.
   - Evidence: `pnpm test` passed (37 tests); `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed; `TURSO_DATABASE_URL=file:./local.db pnpm db:check` passed; migration applied successfully to local `file:./local.db`.
   - Notes: Legacy `pending` reservations migrate to `pending_verification`; provider-facing modules remain fail-closed transitional boundaries for T03/T05 cleanup.

- [x] T02: `Add manual payment instructions and reservation notifications` (status:done)
  - Task ID: T02
  - Goal: Implement the server-side reservation submission contract for Venmo/Zelle instructions and Resend notifications.
  - Boundaries (in/out of scope): In — validate `venmo`/`zelle`; load `VENMO_HANDLE`, `ZELLE_RECIPIENT`, `OWNER_NOTIFICATION_EMAIL`, and `EMAIL_FROM` server-side; return only the selected method's recipient/instructions and exact amount; build/send customer reservation-received and owner notification messages through the existing Resend infrastructure; include explicit pending-manual-verification wording; define failure behavior so a saved reservation cannot be represented as confirmed. Out — automated verification, provider APIs, frontend selection controls, and admin verification UI.
   - Done when: A valid submission creates a manual-verification reservation with method and amount, customer and owner messages contain the required reservation/payment details, secrets/owner-only values stay server-side, missing config produces a safe actionable error, and no message says payment is confirmed or paid.
   - Verification notes (commands or checks): Add focused unit tests with an injected email sender and fake env/config; assert method-specific instructions, exact totals, HTML escaping, recipient separation, missing-config errors, and pending status; run the public-booking tests.
   - Completed: 2026-08-16
   - Files changed: `app/actions/create-pending-reservation.ts`, `lib/public-booking/reservations.ts`, `lib/public-booking/confirmation-email.ts`, `tests/public-booking/reservations.test.ts`, and `tests/public-booking/notifications.test.ts`
   - Evidence: Focused public-booking tests passed (13 tests); full `pnpm test` passed (39 tests); `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed. Missing payment configuration returns a safe error before insert; notification failure preserves `pending_verification` status.
   - Notes: The server action injects the Resend sender. Customer-safe results include only the selected method's recipient/instructions and exact amount; owner recipient and sender configuration remain server-side. Existing provider artifacts remain for T05 cleanup.

- [x] T03: `Replace booking checkout with Venmo/Zelle submission flow` (status:done)
  - Task ID: T03
  - Goal: Make the customer booking experience collect a payment method, submit once, and show external-payment instructions and reservation confirmation in the existing booking route.
  - Boundaries (in/out of scope): In — update customer details/form types, add accessible Venmo/Zelle selection, call the reservation action with the method, replace `PaymentPreview` with a confirmation/instructions view, show exact amount and `Payment pending manual confirmation`, provide reservation reference and next steps, prevent a false paid claim, and remove provider success/cancel navigation. Out — homepage visual redesign, admin verification controls, and mail/database internals beyond consuming T01/T02 contracts.
   - Done when: Mobile and desktop users can complete details → method selection → submission; selected-method instructions are shown without leaking the other method or owner config; loading/error/retry states are clear; the booking summary consistently shows $48/day; no Stripe language or dead CTA remains.
   - Verification notes (commands or checks): Exercise client validation and action-result states; run lint/type/build checks for booking components; manually verify keyboard operation, focus/error announcements, touch targets, and narrow viewport layout.
   - Completed: 2026-08-16
   - Files changed: `components/booking/booking-flow.tsx`, `components/booking/customer-details-form.tsx`, `components/booking/payment-method-form.tsx`, `components/booking/reservation-confirmation.tsx`, `components/booking/payment-preview.tsx` (removed), and `lib/pricing.ts`
   - Evidence: `pnpm test` passed (41 tests); `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed. Booking flow now submits only after method selection, returns selected-method instructions, and renders a pending manual-confirmation summary.
   - Notes: The existing `/booking/success` and `/booking/cancel` provider-return routes remain transitional artifacts for T05 cleanup, but the active booking flow no longer links to or imports them.

- [ ] T04: `Add owner-controlled manual reservation verification` (status:todo)
  - Task ID: T04
  - Goal: Give authenticated owners a clear, explicit way to verify an externally received payment without any automatic transition.
  - Boundaries (in/out of scope): In — adapt admin reservation list/detail data to show payment method, amount due, and `pending_verification`; add a protected confirm/verify action from pending-verification to confirmed with timestamp/notes; update cancellation and availability conflict rules; replace payment filters/metrics/revenue joins with reservation-status-derived values; preserve audit-friendly status messaging. Out — refund automation, Venmo/Zelle verification, public self-service status mutation, and new admin authentication.
  - Done when: Only an authenticated admin action can mark a reservation confirmed; the action rejects cancelled/invalid states, records who/when or equivalent notes, and pending reservations remain visibly unpaid until that action; admin list, summary, calendar, manual creation, cancellation, and tests no longer require a payments table.
  - Verification notes (commands or checks): Add/update admin-dashboard tests for valid/invalid transitions, status counts, list rendering, cancellation, availability conflicts, and payment-method display; manually verify protected route behavior and confirmation copy.

- [ ] T05: `Remove Stripe infrastructure and stale provider artifacts` (status:todo)
  - Task ID: T05
  - Goal: Complete the full provider removal after the replacement flow is wired.
  - Boundaries (in/out of scope): In — delete Stripe actions/modules/webhook/status pages and provider-only tests; remove the Stripe package; remove Stripe/old payment environment variables and setup/docs; update imports, scripts, metadata, and route references; retain Resend only for the new notifications. Out — new payment provider integrations and unrelated dependency upgrades.
  - Done when: Repository-wide search finds no executable Stripe/provider-payment references, `payments` table references, checkout/success/cancel provider flow, or stale Stripe environment contract; the app still has a working `/booking` route and no orphaned imports/routes.
  - Verification notes (commands or checks): Repository-wide search for `stripe`, `Stripe`, `payments`, `checkout`, and obsolete payment env names; run `pnpm lint`, `pnpm test`, and `pnpm build` after cleanup.

- [ ] T06: `Redesign White Mountains public landing page` (status:todo)
  - Task ID: T06
  - Goal: Deliver the responsive, maintainable tourism landing page aligned with the brand and flyer visual language.
  - Boundaries (in/out of scope): In — update `app/page.tsx`, public header/footer/hero/benefit/how-it-works/pricing/bike/FAQ/final-CTA composition, the interim `BrandLogo`, metadata/font/token styling, anchors and real booking links; use current hero/bike assets with intelligent crops; add accessible icons, responsive nav, touch-friendly CTAs, navy/olive/off-white/blue palette, condensed-style heading treatment available from project fonts, and restrained offer accents. Include free delivery, free pickup, current $48/day pricing, White Mountains service area, phone CTA, and no invented contact details. Out — recreating the supplied logo in CSS, adding unavailable mountain imagery, changing booking/domain behavior, and redesigning protected admin screens.
  - Done when: Desktop/tablet/mobile layouts scan clearly, hero and CTA communicate the service immediately, benefits/pricing/rentals/how-it-works/location/final CTA/footer are complete, current inventory data and booking destinations are used, images retain sensible aspect ratios, nav collapses accessibly, and no placeholder PedalGo/Sarajevo copy remains in public UI.
  - Verification notes (commands or checks): Inspect at desktop, tablet, and mobile widths; test anchors and `/booking` CTA; check keyboard focus/semantic headings/alt text/contrast; run lint and build; review for overflow and console/runtime warnings in the browser.

- [ ] T07: `Validate release and synchronize shared context` (status:todo)
  - Task ID: T07
  - Goal: Perform final full-project validation and leave durable SCE context aligned with the implemented current state.
  - Boundaries (in/out of scope): In — run the full test suite, lint, production build, database migration/check validation, and responsive/manual smoke checks; remove temporary scaffolding; update `context/overview.md`, `context/architecture.md`, `context/patterns.md`, `context/glossary.md`, `context/context-map.md`, `context/database/foundation.md`, and the relevant public-booking context file to remove Stripe assumptions and document manual payments, env variables, statuses, email ownership, and the $48 rate. Out — new feature work discovered during validation; record blockers instead of silently expanding scope.
  - Done when: All success criteria have evidence, validation failures are fixed or explicitly reported, no stale Stripe/payment-provider context remains, and the plan contains command results plus any known limitations.
  - Verification notes (commands or checks): `pnpm test`; `pnpm lint`; `pnpm build`; `TURSO_DATABASE_URL=file:./local.db pnpm db:check`; `TURSO_DATABASE_URL=file:./local.db pnpm db:generate` only if schema changes require generation; apply/migrate in a safe local database when appropriate; document responsive/browser smoke results and context-sync review in this plan.

## Assumptions

- The supplied reference-provided phone, service-area, and Instagram handle are the only canonical public business details currently available. Missing public email/address/social URLs will be omitted rather than replaced with existing placeholders.
- Venmo and Zelle are manual instruction methods only. The customer is never asked to assert payment completion, and external payment receipt is never inferred from reservation submission.
- `pending_verification` is the canonical post-submission reservation state: it means the reservation request and payment instructions were issued, not that money was received. The owner/admin's explicit verification action is the only route to `confirmed`.
- The existing Resend provider is retained. `RESEND_API_KEY` remains the provider credential, while `EMAIL_FROM` replaces the old sender-copy variable for the new notification messages.
- The current inventory remains the single featured city-bike option; no new models or specifications are invented.

## Open questions

- Final Venmo handle, Zelle recipient, owner notification email, and sender identity will be supplied through deployment environment configuration before real submissions are enabled. Until then, the server should fail closed with a clear configuration error rather than display fabricated details.
