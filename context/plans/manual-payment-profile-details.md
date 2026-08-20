# Manual Payment Profile Details

## Change summary

Expand the existing server-configured manual Venmo/Zelle payment instructions so customers receive the complete account information for the payment method they selected. The current booking flow already supports manual Venmo/Zelle payments, reservation emails, and owner verification; this change adds the supplied account name, contact email, phone number, and Venmo handle to the selected-method presentation.

The supplied payment profile values are:

- Full name: `Radomir Kalkan`
- Venmo handle: `@Radomir-Kalkan`
- Email: `Kalkanradomir@gmail.com`
- Phone: `6033481320`

The same full name, email, and phone are used for both Venmo and Zelle. Zelle has no separate username in the supplied information.

## Success criteria

1. Venmo and Zelle have typed server-side payment profiles containing the supplied full name, email, phone, and, for Venmo, the supplied handle.
2. After a customer selects Venmo, the booking confirmation and customer/owner reservation emails show all Venmo details: full name, handle, email, and phone.
3. After a customer selects Zelle, the booking confirmation and customer/owner reservation emails show all Zelle details: full name, email, and phone.
4. Only the selected method's profile is returned to the customer; the existing exact amount, reservation reference, reservation note requirement, and `pending_verification` wording remain intact.
5. Missing or incomplete payment profile configuration fails safely before reservation insertion and never marks a reservation as paid or confirmed.
6. No Venmo/Zelle SDK, API, webhook, automated reconciliation, database payment table, or customer-controlled payment confirmation is added.
7. Environment documentation and current SCE context describe the expanded configuration without committing real environment secrets.

## Constraints and non-goals

- Keep payment handling instruction-only. The protected admin verification action remains the only path from `pending_verification` to `confirmed`.
- Keep all account profile values server-configured; do not hardcode them in application code or expose unselected method data in client results.
- Store real runtime values only in ignored local environment configuration or the deployment secret store. Do not commit `.env`, `.env.local`, API keys, or deployment credentials.
- Preserve the existing reservation, pricing, availability, email sender, and owner-notification behavior unless a change is required to carry the expanded selected-method details.
- Do not add a database migration; payment profile data is runtime configuration, not reservation data.
- The final typed profile contract is canonical: `VENMO_HANDLE` is required for Venmo, Zelle has no handle, and no legacy recipient fallback may display incomplete account information.
- Do not include the attached waiver/rental-agreement fields in this change; this plan concerns website payment instructions only.

## Task stack

- [x] T01: `Expand server-side Venmo/Zelle payment profiles` (status:done)
  - Task ID: T01
  - Goal: Replace the current single-recipient instruction model with typed method profiles that load the required Venmo and Zelle identity/contact fields from server-only environment configuration.
  - Boundaries (in/out of scope): In — update `ManualPaymentConfiguration`, selected-method instruction types, environment loading/validation, and reservation instruction construction; define the canonical environment variable names for Venmo name/handle/email/phone and Zelle name/email/phone; preserve exact amount, reservation reference, and pending-verification wording. Out — booking confirmation markup, email layout, admin verification, database schema/migrations, and provider APIs.
  - Done when: A Venmo submission produces a UI-safe Venmo profile with `Radomir Kalkan`, `@Radomir-Kalkan`, `Kalkanradomir@gmail.com`, and `6033481320`; a Zelle submission produces the same supplied name/email/phone without inventing a handle; all required selected-profile fields are validated server-side before insert; unselected profile data is not included in the returned summary.
  - Verification notes (commands or checks): Extend `tests/public-booking/reservations.test.ts` with Venmo and Zelle profile assertions, incomplete-configuration failure assertions, and no-insert checks; confirm no database schema or provider code is touched.
  - Completed: 2026-08-20
  - Files changed: `lib/public-booking/reservations.ts`, `tests/public-booking/reservations.test.ts`, `tests/public-booking/notifications.test.ts`
  - Evidence: Focused reservation and notification tests passed (11/11); `pnpm exec tsc --noEmit` passed; focused ESLint passed; `git diff --check` passed.
   - Notes: Canonical runtime variables are `VENMO_NAME`, `VENMO_HANDLE`, `VENMO_EMAIL`, `VENMO_PHONE`, `ZELLE_NAME`, `ZELLE_EMAIL`, and `ZELLE_PHONE`. Selected summaries expose only the selected profile; presentation and notification boundaries consume the typed profile details.

- [x] T02: `Show complete selected-method payment details` (status:done)
  - Task ID: T02
  - Goal: Present the expanded selected Venmo/Zelle profile consistently in the booking confirmation and reservation-received emails.
  - Boundaries (in/out of scope): In — update `components/booking/reservation-confirmation.tsx` and `lib/public-booking/confirmation-email.ts` (plus focused tests) to render labeled full name, handle when applicable, email, and phone; retain exact amount, reservation reference, payment-note instruction, and explicit pending-manual-confirmation language; HTML-escape all configured values. Out — changes to payment selection controls, reservation persistence, admin workflows, and automated payment status changes.
  - Done when: Venmo confirmation/email output contains all four Venmo values; Zelle confirmation/email output contains the three applicable Zelle values; each output contains only the selected method's details; text and HTML notification tests cover both methods and hostile/HTML-like configured values safely.
  - Verification notes (commands or checks): Run focused public-booking notification/reservation tests; statically review the confirmation component for accessible labels, readable mobile wrapping, and absence of the unselected method's details.
  - Completed: 2026-08-20
  - Files changed: `components/booking/reservation-confirmation.tsx`, `lib/public-booking/confirmation-email.ts`, `tests/public-booking/notifications.test.ts`
  - Evidence: Focused notification and reservation tests passed (13/13); `pnpm exec tsc --noEmit` passed; focused ESLint passed; `pnpm build` passed; `git diff --check` passed.
  - Notes: Confirmation UI and both customer/owner email formats render labeled selected-profile fields. React text rendering and email HTML escaping protect configured values; Zelle omits the Venmo handle.

- [x] T03: `Document and configure payment profile environment` (status:done)
  - Task ID: T03
  - Goal: Make the expanded runtime configuration deployable and unambiguous without placing real values in tracked files.
   - Boundaries (in/out of scope): In — update `.env.example`/README configuration guidance and the relevant deployment checklist; configure the supplied Venmo and Zelle values in the operator's ignored local environment or deployment secret store; document that the same name/email/phone apply to both methods and that Zelle has no handle. Out — committing real runtime values, changing Resend/owner configuration, or adding a secrets-management service.
   - Done when: A fresh environment has a complete documented variable set, the application accepts the supplied profiles, incomplete configuration fails clearly before insert, and repository review shows no real payment values or credentials added to tracked files.
   - Verification notes (commands or checks): Review README and example variable names against the loader; run the reservation configuration tests with fake values; inspect `git status`/diff for accidental environment or secret files before handoff.
   - Completed: 2026-08-20
   - Files changed: `.env.example`, `README.md`, ignored local `.env`
   - Evidence: Focused reservation and notification tests passed (13/13); local ignored profile smoke check loaded the supplied Venmo/Zelle values; `pnpm lint` passed; `git diff --check` passed; `.env` remains ignored and absent from the tracked diff.
   - Notes: Tracked examples use placeholders and document the seven canonical profile variables. The ignored local profile uses the supplied full name, Venmo handle, shared email, and shared phone; owner/Resend values remain separately configured.

- [x] T04: `Validate release and synchronize payment context` (status:done)
  - Task ID: T04
  - Goal: Run complete validation and update durable SCE context to the final current-state payment contract.
   - Boundaries (in/out of scope): In — run tests, lint, TypeScript, production build, and relevant manual booking/email-output checks; search for stale single-recipient assumptions; update `context/public-booking/payments.md`, `context/public-booking/reservations.md`, `context/overview.md`, `context/architecture.md`, `context/glossary.md`, and `context/context-map.md` only where current-state descriptions require the expanded profile contract; remove temporary scaffolding. Out — new payment features, provider integration, waiver/PDF work, or unrelated context rewrites.
   - Done when: All success criteria have command or inspection evidence, all checks pass or blockers are explicitly recorded, no stale payment-profile documentation remains, and no temporary secrets/artifacts are tracked.
   - Verification notes (commands or checks): Run `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check`; perform a local selected-Venmo and selected-Zelle booking smoke review using non-production test configuration; verify context files describe selected-method full profile output and server-only configuration.
   - Completed: 2026-08-20
   - Files changed: `context/plans/manual-payment-profile-details.md`
   - Evidence: Focused reservation/notification tests passed 13/13; full `pnpm test` passed 47/47 across 12 suites; `pnpm lint` passed; `pnpm exec tsc --noEmit` passed; `pnpm build` passed with Next.js 16.2.6/Turbopack and generated the public, booking, admin, and not-found routes; `git diff --check` passed. A local non-production configuration smoke loaded both supplied Venmo and Zelle profiles with placeholder owner/sender values; focused booking tests covered selected Venmo/Zelle reservation summaries and notification tests covered text/HTML output, selected-profile isolation, and escaping. Repository search found no current-code `VENMO_RECIPIENT`/`ZELLE_RECIPIENT` assumptions; only historical plan records retain the prior contract wording. `.env` remains ignored and absent from the tracked diff, and no temporary validation artifacts were added.
   - Notes: Context sync classified T04 as verify-only because the current root and public-booking context already matched the final typed server-only profile contract; `context/overview.md`, `context/architecture.md`, `context/glossary.md`, `context/context-map.md`, `context/patterns.md`, `context/public-booking/payments.md`, and `context/public-booking/reservations.md` were reviewed with no additional edits required. No database migration or provider integration was introduced. The ignored local `.env` should still be reviewed/rotated by the operator before production release; no local secret values were copied into tracked files.

## T04 Validation Report

### Commands and inspections

- `pnpm exec tsx --test tests/public-booking/reservations.test.ts tests/public-booking/notifications.test.ts` -> exit 0; 13/13 focused tests passed.
- Focused `pnpm exec eslint` over the changed booking, email, and test files -> exit 0.
- `pnpm exec tsc --noEmit` -> exit 0.
- `pnpm test` -> exit 0; 47/47 tests passed across 12 suites.
- `pnpm lint` -> exit 0.
- `pnpm build` -> exit 0; Next.js 16.2.6/Turbopack compiled and generated the public, booking, admin, and not-found routes.
- `git diff --check` -> exit 0.
- Local non-production profile smoke using ignored `.env` values plus placeholder owner/sender values -> exit 0; both Venmo and Zelle profiles loaded with the supplied full name, Venmo handle, shared email, and shared phone. No secret values were printed or changed.
- Current-code search for `VENMO_RECIPIENT` and `ZELLE_RECIPIENT` -> no matches in application or test code. Historical completed-plan records retain prior contract wording as historical evidence only.
- Tracked-artifact review -> `.env` is ignored and absent from tracked status; no temporary validation files were added.

### Success-criteria verification

- [x] Typed server-side Venmo/Zelle profiles contain the supplied values — `tests/public-booking/reservations.test.ts` asserts the complete configuration shape; the local non-production smoke loaded both profiles.
- [x] Venmo confirmation and customer/owner email output includes full name, handle, email, and phone — `components/booking/reservation-confirmation.tsx` and `lib/public-booking/confirmation-email.ts` render labeled profile fields; notification tests cover the Venmo fields in text and HTML boundaries.
- [x] Zelle confirmation and customer/owner email output includes full name, email, and phone — the same presentation boundary renders the typed Zelle profile and notification tests assert no Venmo fields leak.
- [x] Only the selected profile is returned while amount, reference, payment note, and pending wording remain intact — reservation tests assert selected-profile isolation; notification tests assert exact amount/reference and pending-manual-confirmation wording.
- [x] Incomplete configuration fails before insertion without confirming payment — reservation tests assert missing/incomplete configuration errors and zero inserted rows; all created reservations remain `pending_verification`.
- [x] No provider SDK/API/webhook/payment table/customer confirmation was added — current source and schema review found only reservation-level manual methods and the protected admin verification boundary; no migration or provider code changed in T04.
- [x] Documentation and secret handling are current — `.env.example`, `README.md`, and the reviewed context files describe the seven canonical variables and selected-profile contract; the ignored local `.env` is not tracked.

### Failed checks and follow-ups

- No validation command failed. Negative-path error logs during the focused/full tests are expected assertions for missing/incomplete configuration and simulated notification failure.
- No real Venmo/Zelle transfer, production Resend delivery, or browser automation was run; those require deployment configuration and are outside this validation task.

### Residual risks

- Review and rotate the ignored local `.env` before release, then configure only current documented Turso, manual-payment, Resend, and admin values in the deployment secret store.
- Perform a deployment browser smoke and one verified Resend/payment-instruction check after production environment configuration.

## Open questions

- None blocking. This plan assumes the supplied full name, email, and phone are intentionally shared for both Venmo and Zelle, and that the phone should remain displayed as the exact supplied digits `6033481320`.

## Assumptions

- The payment profile values are customer-facing business payment instructions, not authentication credentials; nevertheless, they must be configured through runtime environment/deployment secrets rather than committed source files.
- The existing manual-payment and admin-verification architecture remains authoritative; this is a presentation/configuration expansion only.
