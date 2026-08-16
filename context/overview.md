# Overview

White Mountains Bike Rentals is a Next.js application for a bicycle rental booking experience. The public brand serves Lincoln, Woodstock, and the surrounding White Mountains; PedalGo remains an internal/package/admin identifier in the current MVP codebase.

Current user-facing scope:
- Public White Mountains Bike Rentals marketing/home page with responsive navigation, mountain-oriented hero, rentals, benefits, how-it-works, $48/day pricing, service-area, FAQ, contact, and booking CTA sections.
- Booking flow under `/booking` for selecting/reviewing rental details; public reservations now use the manual-payment verification state and server-side reservation-received notifications.
- Homepage availability checks use database-backed bike availability and USD pricing for the featured MVP rental option. The public display label is White Mountains City Bike and the featured asset remains `public/images/hero-bike.png`/`city-bike.png`.
- The `/booking` customer flow re-validates availability and creates a database-backed reservation in `pending_verification`; the current public/manual quote rate is the centralized $48/day rate. Server-side submission validates Venmo/Zelle, returns only the selected method's instructions, and sends customer/owner Resend notifications. Missing `VENMO_HANDLE`, `ZELLE_RECIPIENT`, `OWNER_NOTIFICATION_EMAIL`, `EMAIL_FROM`, or `RESEND_API_KEY` fails before insert; notification delivery failure leaves the saved reservation pending. No provider return or webhook boundary exists.
- Administrators sign in through `/admin/login`; authenticated active admins can reach the protected `/admin` dashboard shell, navigate summary/reservations/pricing/availability/calendar/reports sections, see reservation-derived operations metrics, search/filter reservations with Venmo/Zelle method visibility, manually create reservations after availability/price checks, explicitly verify externally received manual payments to move pending reservations to confirmed, cancel pending-verification/confirmed reservations without automated refunds, update bike-type pricing data, create/update/delete availability blocks for maintenance/inactive/internal-use windows, review a month-navigation availability calendar/list hybrid for rentals and blocks, and log out.

Current backend foundation:
- Turso/libSQL and Drizzle ORM are configured for database-backed domain work.
- `lib/db/schema.ts` defines the rental domain schema for bike types, bikes, reservations, availability blocks, and admin users. Reservations carry an optional `venmo`/`zelle` payment method and use `pending_verification` for manual review; there is no payment-provider table.
- `lib/domain/` contains server-side USD rental pricing and availability helpers for database-backed booking paths.
- `lib/admin-auth/` contains server-only active-admin credential verification, PBKDF2 password hash verification, and signed HTTP-only admin session-cookie handling.
- `lib/admin-dashboard/` contains server-side admin operations summary, reservation listing, manual reservation creation, owner-controlled reservation verification, reservation cancellation, pricing management, availability-block management, and calendar helpers for the protected dashboard.
- `scripts/seed.ts` seeds the MVP city-bike inventory and a bootstrap admin user for local/libSQL environments.
- Server-side pricing helpers, database money fields, seed output, README seed docs, and current UI display helpers use USD terminology. Database-backed money values are stored as USD cents; public availability and reservation paths use the centralized `4800` USD-cent daily rate abstraction.

Public contact copy currently uses `(603) 348-1320`, `@whitemountainsbikerentals`, and Lincoln/Woodstock/White Mountains service-area language; no public email or street address is asserted.

Known project metadata:
- Package name: `my-project`.
- App branding/title: `White Mountains Bike Rentals | Ride More`.
- Runtime framework: Next.js with React and TypeScript.
- Package manager: pnpm.
