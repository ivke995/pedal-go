# Overview

PedalGo is a Next.js application for a bicycle rental booking experience.

Current user-facing scope:
- Public marketing/home page for renting bikes.
- Booking flow under `/booking` for selecting/reviewing rental details.
- Homepage availability checks use database-backed bike availability and USD pricing for the featured MVP rental option.
- The `/booking` customer flow creates a database-backed pending payment reservation for the featured bike after re-validating availability, then creates a Stripe Checkout session for hosted payment. Post-checkout success/cancel pages are read-only status views; verified Stripe webhooks, not success-page visits, confirm paid reservations and send the customer confirmation email through Resend.
- Administrators sign in through `/admin/login`; authenticated active admins can reach the protected `/admin` dashboard shell, navigate summary/reservations/pricing/availability/calendar/reports sections, see database-backed operations summary metrics, search/filter reservations with payment status visibility, manually create non-card-charged reservations after availability/price checks, cancel pending/confirmed reservations without automated refunds, and log out.

Current backend foundation:
- Turso/libSQL and Drizzle ORM are configured for database-backed domain work.
- `lib/db/schema.ts` defines the rental domain schema for bike types, bikes, reservations, payments, availability blocks, and admin users.
- `lib/domain/` contains server-side USD rental pricing and availability helpers for database-backed booking paths.
- `lib/admin-auth/` contains server-only active-admin credential verification, PBKDF2 password hash verification, and signed HTTP-only admin session-cookie handling.
- `lib/admin-dashboard/` contains server-side admin operations summary, reservation listing, manual reservation creation, and reservation cancellation helpers for the protected dashboard.
- `scripts/seed.ts` seeds the MVP city-bike inventory and a bootstrap admin user for local/libSQL environments.
- Server-side pricing helpers, database money fields, seed output, README seed docs, current UI display helpers, and active future implementation plans use USD terminology. Database-backed money values are stored as USD cents; remaining static featured-bike display data uses USD UI pricing helpers, while public availability/reservation/payment paths use database-backed pricing.

Known project metadata:
- Package name: `my-project`.
- App branding/title: `PedalGo — Rent a Bike in Just a Few Clicks`.
- Runtime framework: Next.js with React and TypeScript.
- Package manager: pnpm.
