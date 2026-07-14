# Patterns

## React and Next.js

- App Router route files live under `app/`.
- Client components use the `'use client'` directive when they need browser state/hooks.
- Route-level pages compose smaller feature components rather than embedding large UI directly.
- Shared imports use the `@/` path alias.

## Styling and UI

- Tailwind CSS utility classes are used throughout components.
- UI primitives live in `components/ui/` and should be reused before creating one-off controls.
- Public site sections live in `components/public/`.
- Booking-specific components live in `components/booking/`.

## Domain logic

- Keep domain types in `lib/types.ts`.
- Keep pricing calculations and USD display formatting helpers in `lib/pricing.ts`.
- Keep mock/static app data in `lib/mock-data.ts` until a real backend exists.

## SCE workflow

- Plan non-trivial changes in `context/plans/` before implementation.
- Use stable task IDs (`T01`, `T02`, ...).
- Keep durable context current-state oriented; do not store completed-work summaries in core context files.
