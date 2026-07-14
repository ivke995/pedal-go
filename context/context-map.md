# Context Map

Use this file first to find relevant durable context before changing code.

## Core files

- `context/overview.md` — High-level project purpose and current product scope.
- `context/architecture.md` — Current app structure, data boundaries, and verification commands.
- `context/patterns.md` — Coding, UI, domain, and SCE workflow conventions.
- `context/glossary.md` — Project and domain terms.

## Working artifacts

- `context/plans/` — Active implementation plans. Completed plans are disposable and should not be treated as durable history.
- `context/handovers/` — Handover notes for interrupted work or session transitions.
- `context/decisions/` — Durable architecture/product decisions when a decision needs long-term recall.
- `context/tmp/` — Temporary scratch space ignored by git except `.gitignore`.

## Code landmarks

- `app/page.tsx` — Public homepage composition.
- `app/booking/page.tsx` — Booking route entry.
- `components/public/` — Public-facing page and search/availability components.
- `components/booking/` — Booking flow components.
- `components/ui/` — Shared UI primitives.
- `lib/types.ts` — Shared domain types.
- `lib/pricing.ts` — Pricing and formatting helpers.
- `lib/mock-data.ts` — Mock inventory, reservations, availability, and metrics data.
