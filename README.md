# PedalGo

PedalGo is a Next.js bicycle rental MVP with a White Mountains Bike Rentals public booking experience, manual Venmo/Zelle payment instructions, Resend reservation notifications, and protected admin operations backed by Turso/libSQL and Drizzle ORM.

## Deployment environment contract

Keep real values in `.env.local` for local development or in your deployment platform's secret store. Do not commit `.env`, `.env.local`, API keys, database tokens, admin passwords, or session secrets.

### Required and optional variables

| Variable | Required when | Purpose and notes |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Always, for app runtime and database commands | libSQL connection URL. Use `file:./local.db` for local development or a Turso/libSQL URL when deployed. |
| `TURSO_AUTH_TOKEN` | Remote Turso/libSQL URLs | Database auth token. Omit for local `file:` URLs. |
| `VENMO_NAME` | Public reservations | Server-only full name shown for the selected Venmo payment profile. |
| `VENMO_HANDLE` | Public reservations | Server-only Venmo handle shown for the selected payment profile. |
| `VENMO_EMAIL` | Public reservations | Server-only email shown for the selected Venmo payment profile. |
| `VENMO_PHONE` | Public reservations | Server-only phone shown for the selected Venmo payment profile. |
| `ZELLE_NAME` | Public reservations | Server-only full name shown for the selected Zelle payment profile. |
| `ZELLE_EMAIL` | Public reservations | Server-only email shown for the selected Zelle payment profile. |
| `ZELLE_PHONE` | Public reservations | Server-only phone shown for the selected Zelle payment profile. |
| `OWNER_NOTIFICATION_EMAIL` | Public reservations | Server-only destination for owner reservation-received notifications. |
| `EMAIL_FROM` | Public reservations | Server-only verified sender identity used for customer and owner notifications. |
| `RESEND_API_KEY` | Public reservations | Server-only Resend API key used to send reservation-received notifications. |
| `ADMIN_SESSION_SECRET` | Production admin sessions | HMAC signing secret for the `pedalgo_admin_session` admin cookie. |
| `ADMIN_BOOTSTRAP_PASSWORD` | Running `pnpm db:seed` | Password for the bootstrap admin user. |
| `ADMIN_BOOTSTRAP_EMAIL` | Optional when running `pnpm db:seed` | Bootstrap admin email. Defaults to `admin@pedalgo.local`. |
| `ADMIN_BOOTSTRAP_NAME` | Optional when running `pnpm db:seed` | Bootstrap admin display name. Defaults to `PedalGo Admin`. |

### Local development setup

1. Install dependencies with `pnpm install`.
2. Create `.env.local` with local-only values. Example shape:

   ```dotenv
   TURSO_DATABASE_URL=file:./local.db
   VENMO_NAME=replace-with-venmo-full-name
   VENMO_HANDLE=@replace-with-venmo-handle
   VENMO_EMAIL=venmo@example.com
   VENMO_PHONE=replace-with-venmo-phone
   ZELLE_NAME=replace-with-zelle-full-name
   ZELLE_EMAIL=zelle@example.com
   ZELLE_PHONE=replace-with-zelle-phone
   OWNER_NOTIFICATION_EMAIL=owner@example.com
   EMAIL_FROM="White Mountains Bike Rentals <verified-sender@example.com>"
   RESEND_API_KEY=re_placeholder
   ADMIN_SESSION_SECRET=replace-with-a-long-random-local-secret
   ADMIN_BOOTSTRAP_PASSWORD=replace-with-a-local-admin-password
   ADMIN_BOOTSTRAP_EMAIL=admin@pedalgo.local
   ```

3. Apply migrations and seed baseline data:

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

4. Run the app:

   ```bash
   pnpm dev
   ```

### Database setup

PedalGo uses Turso/libSQL with Drizzle ORM. Database commands load `.env.local` and `.env` automatically without overriding shell-provided variables.

Database commands:

- `pnpm db:generate` — generate Drizzle migrations from `lib/db/schema.ts` into `drizzle/`.
- `pnpm db:migrate` — apply generated migrations to the configured libSQL database.
- `pnpm db:check` — validate generated migration files.
- `pnpm db:seed` — seed the MVP city-bike inventory and bootstrap admin user.

Seed data is idempotent and creates:

- One active `PedalGo City Bike` bike type at the centralized $48/day public rate.
- Two available physical bikes: `CITY-001` and `CITY-002`.
- One active bootstrap admin user using the `ADMIN_BOOTSTRAP_*` variables.

### Manual payment and email setup

- Public reservations use the centralized $48/day rate and remain `pending_verification` after submission.
- Customers choose Venmo or Zelle. Only the selected method's complete profile and exact-amount instructions are returned to the customer. Venmo requires full name, handle, email, and phone; Zelle requires full name, email, and phone and has no handle.
- Configure the same payment-account full name, email, and phone in both profiles when they belong to the same account owner; configure the Venmo handle only in `VENMO_HANDLE`.
- `OWNER_NOTIFICATION_EMAIL`, `EMAIL_FROM`, and `RESEND_API_KEY` remain server-only. Missing manual-payment or email configuration fails before a reservation is inserted.
- Resend sends customer and owner reservation-received notifications immediately after insertion. Notification failure leaves the saved reservation pending manual confirmation.
- An authenticated admin must independently verify an external payment before moving a reservation to `confirmed`.

### Deployment checklist

- Configure all required secrets in the deployment environment; do not copy local placeholder values.
- Apply migrations to the target Turso/libSQL database with `pnpm db:migrate`.
- Run `pnpm db:seed` once with a strong `ADMIN_BOOTSTRAP_PASSWORD` to create the MVP inventory and bootstrap admin.
- Verify the `EMAIL_FROM` sender/domain in Resend and configure the owner notification recipient.
- Confirm the complete Venmo/Zelle profiles before enabling real public submissions: full name, email, and phone for both methods, plus the Venmo handle.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` before release.
