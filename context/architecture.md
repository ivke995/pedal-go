# Architecture

## Current structure

- `app/` — Next.js App Router routes and root layout.
  - `app/page.tsx` composes the public landing page.
  - `app/booking/page.tsx` hosts the booking flow inside `Suspense`.
  - `app/layout.tsx` defines metadata, fonts, analytics, and global toaster.
- `components/` — reusable React components.
  - `components/public/` contains public-site and booking-search presentation components.
  - `components/booking/` contains multi-step booking UI components.
  - `components/ui/` contains shadcn/Base UI-style primitives.
- `lib/` — shared utilities, domain types, mock data, and pricing logic.
- `public/` — static assets.

## Data and backend state

The current app appears frontend-first. Rental inventory, reservations, availability, dashboard-like sample data, and USD pricing constants/formatting live in `lib/mock-data.ts` and `lib/pricing.ts` rather than a backend or database integration.

## Verification commands

Use the scripts defined in `package.json`:
- `pnpm lint`
- `pnpm build`
- `pnpm dev` for local development
