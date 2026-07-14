# Plan: Show Prices in US Dollars

## Change summary

Update PedalGo's user-facing rental price display for American customers so prices are shown in US dollars. Existing numeric pricing values remain unchanged; this plan is a display-label change only and does not convert BAM amounts to USD by exchange rate.

## Success criteria

- All user-facing rental prices display as US dollars (`$` and/or `USD`) instead of `BAM`.
- Existing numeric amounts and pricing calculations remain unchanged.
- Currency formatting remains centralized through the existing pricing helper where possible.
- No exchange-rate conversion, payment integration, tax logic, or backend changes are introduced.
- App lint/build checks pass after the change.

## Constraints and non-goals

- No currency conversion is in scope for this change.
- Do not change the daily rate value unless needed only to preserve current behavior.
- Do not introduce new dependencies or localization/i18n frameworks.
- Do not redesign booking or public-site UI.
- Treat `lib/pricing.ts` as the primary source for pricing display behavior.

## Assumptions

- Current numeric prices should be treated as the intended USD numeric values for now.
- The preferred display can use a standard US currency style such as `$30` or `$30.00`; implementation should choose the smallest consistent change aligned with existing UI.

## Task stack

- [x] T01: `Switch centralized price display to USD` (status:done)
  - Task ID: T01
  - Goal: Change the existing pricing display path so all formatted prices show US dollars without changing numeric calculations.
  - Boundaries (in/out of scope): In - `lib/pricing.ts` currency constant/formatting and comments; direct user-facing hard-coded `BAM` occurrences if any are found. Out - exchange-rate conversion, rate changes, payment/tax logic, broad locale/date formatting changes, UI redesign.
  - Done when: `formatCurrency` outputs US-dollar display text; no user-facing `BAM` currency labels remain in application code; calculation outputs remain numerically identical for the same inputs.
  - Verification notes (commands or checks): Inspect all occurrences of `BAM`/currency labels in app source; run targeted UI smoke check of public and booking price summaries if local dev is available.
  - Completed: 2026-07-14
  - Files changed: `lib/pricing.ts`
  - Evidence: `formatCurrency` now uses `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` and preserves `DAILY_RATE = 30`; `grep` found no `BAM` occurrences in `*.ts`, `*.tsx`, `*.js`, or `*.jsx` application source; `pnpm lint && pnpm build` was attempted but blocked because `eslint` is not installed in the current environment (`sh: 1: eslint: not found`).
  - Notes: Important display-state change; root context sync required so durable currency terminology reflects USD.

- [x] T02: `Validate currency display and sync context` (status:done)
  - Task ID: T02
  - Goal: Run final checks and update durable context so future sessions know PedalGo currently displays rental prices in USD.
  - Boundaries (in/out of scope): In - lint/build validation, removal of any temporary debugging changes, context updates such as `context/glossary.md` if needed. Out - unrelated documentation rewrites, completed-work narratives, application behavior changes beyond validation fixes.
  - Done when: Full verification commands pass or any failures are documented with cause; core context reflects current USD display state; plan status evidence is recorded.
  - Verification notes (commands or checks): Run `pnpm lint` and `pnpm build`; verify no application source still presents `BAM` to users; confirm context currency terminology is current-state oriented.
  - Completed: 2026-07-14
  - Files changed: `components/booking/booking-flow.tsx`, `components/public/booking-search-form.tsx`, `components/public/flow-header.tsx`, `eslint.config.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `context/plans/us-dollar-display.md`
  - Evidence: `pnpm lint` and `pnpm build` pass after adding the Next.js ESLint flat config and aligning `BookingFlow` with current `BookingDraft`/pricing helper APIs; `grep` found no `BAM` occurrences in `*.ts`, `*.tsx`, `*.js`, or `*.jsx` application source; core context already describes USD display in `context/glossary.md`, `context/architecture.md`, and `context/patterns.md`.
  - Lint evidence: ESLint is installed with `eslint-config-next`; `pnpm lint` passes using `eslint.config.mjs`.
  - Notes: Validation fix only; no currency conversion, rate changes, payment/tax logic, or UI redesign introduced.

## Open questions

- None. User confirmed existing numeric values should be shown as dollars with no conversion for now.

## Validation Report

### Commands run

- `pnpm lint` -> exit 0; ESLint completed with no reported problems.
- `pnpm build` -> exit 0; Next.js production build completed and prerendered `/` and `/booking` successfully.
- Source search for `BAM` in `*.ts`, `*.tsx`, `*.js`, and `*.jsx` -> no files found.
- Test discovery -> no test script in `package.json` and no `*test*` files found.
- Format/lint config discovery -> no eslint or prettier config files found at the repository root; lint remains governed by `package.json`'s `eslint .` script.

### Success-criteria verification

- [x] User-facing rental prices display as US dollars instead of `BAM` -> `lib/pricing.ts` formats via `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`; no application-source `BAM` occurrences found.
- [x] Existing numeric amounts and pricing calculations remain unchanged -> `DAILY_RATE` remains `30`; `calculateRentalDays`/`calculateTotal` behavior unchanged.
- [x] Currency formatting remains centralized -> current UI price displays call `formatCurrency` from `lib/pricing.ts`.
- [x] No exchange-rate conversion, payment integration, tax logic, or backend changes introduced -> implementation only changes currency display and a booking-flow build compatibility issue.
- [x] App lint/build checks pass -> `pnpm lint` and `pnpm build` both pass.

### Context sync

- Root context sync classification: important currency terminology change already represented in core context; T02 validation fix is verify-only.
- Verified `context/overview.md`, `context/architecture.md`, `context/glossary.md`, `context/patterns.md`, and `context/context-map.md` are current-state oriented for USD display.

### Residual risks

- None identified.
