# PedalGo

PedalGo is a Next.js bicycle rental MVP with public booking, Stripe Checkout payment confirmation, Resend confirmation email, and protected admin operations backed by Turso/libSQL and Drizzle ORM.

## Deployment environment contract

Keep real values in `.env.local` for local development or in your deployment platform's secret store. Do not commit `.env`, `.env.local`, API keys, webhook secrets, database tokens, admin passwords, or session secrets.

### Required and optional variables

| Variable | Required when | Purpose and notes |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Always, for app runtime and database commands | libSQL connection URL. Use `file:./local.db` or another `file:` URL for local development; use the Turso/libSQL remote URL for deployed environments. |
| `TURSO_AUTH_TOKEN` | Remote Turso/libSQL URLs | Database auth token. Omit for local `file:` URLs. |
| `STRIPE_SECRET_KEY` | Creating Checkout Sessions and receiving Stripe webhooks | Stripe server-side secret key for the same mode/account as the webhook endpoint. Use test keys locally/staging and live keys only in production. |
| `STRIPE_WEBHOOK_SECRET` | Receiving Stripe webhooks | Signing secret for the configured Stripe webhook endpoint, used to verify `stripe-signature`. Local Stripe CLI forwarding creates a different secret than a deployed webhook endpoint. |
| `RESEND_API_KEY` | Sending confirmation emails after paid Stripe webhooks | Resend API key. A paid webhook will fail and leave the reservation pending if the email provider rejects the send. |
| `RESEND_FROM_EMAIL` | Recommended for all real email delivery | Sender used for confirmation emails. Must be verified/allowed in Resend. If omitted, the app falls back to a placeholder sender that is not suitable for production delivery. |
| `ADMIN_SESSION_SECRET` | Production admin sessions | HMAC signing secret for the `pedalgo_admin_session` admin cookie. Local non-production runs have a development fallback, but production must set a strong secret. |
| `ADMIN_BOOTSTRAP_PASSWORD` | Running `pnpm db:seed` | Password for the bootstrap admin user created by the seed script. Required by the seed command and should never be committed. |
| `ADMIN_BOOTSTRAP_EMAIL` | Optional when running `pnpm db:seed` | Bootstrap admin email. Defaults to `admin@pedalgo.local`. |
| `ADMIN_BOOTSTRAP_NAME` | Optional when running `pnpm db:seed` | Bootstrap admin display name. Defaults to `PedalGo Admin`. |
| `NEXT_PUBLIC_APP_URL` | Recommended for deployed booking checkout | Public origin used to build Stripe Checkout success/cancel URLs. Example shape: `https://your-domain.example`. |
| `APP_URL` | Optional fallback for deployed booking checkout | Server-side fallback origin if `NEXT_PUBLIC_APP_URL` is not set. If both URL variables are omitted, checkout URLs default to `http://localhost:3000`. |
| `PEDALGO_PICKUP_LOCATION` | Optional | Overrides the pickup location shown in confirmation emails. |
| `PEDALGO_CONTACT_EMAIL` | Optional | Overrides the contact email shown in confirmation emails. |
| `PEDALGO_CONTACT_PHONE` | Optional | Overrides the contact phone shown in confirmation emails. |
| `PEDALGO_SUPPORT_HOURS` | Optional | Overrides support hours shown in confirmation emails. |
| `PEDALGO_PICKUP_INSTRUCTIONS` | Optional | Overrides pickup instructions shown in confirmation emails. |

### Local development setup

1. Install dependencies with `pnpm install`.
2. Create `.env.local` with local-only values. Example shape, using placeholders:

   ```dotenv
   TURSO_DATABASE_URL=file:./local.db
   STRIPE_SECRET_KEY=sk_test_placeholder
   STRIPE_WEBHOOK_SECRET=whsec_placeholder_from_stripe_cli
   RESEND_API_KEY=re_placeholder
   RESEND_FROM_EMAIL="PedalGo <onboarding@resend.dev>"
   ADMIN_SESSION_SECRET=replace-with-a-long-random-local-secret
   ADMIN_BOOTSTRAP_PASSWORD=replace-with-a-local-admin-password
   ADMIN_BOOTSTRAP_EMAIL=admin@pedalgo.local
   NEXT_PUBLIC_APP_URL=http://localhost:3000
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

5. For local Stripe webhook testing, forward Stripe events to the app and copy the generated `whsec_...` value into `STRIPE_WEBHOOK_SECRET`:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### Database setup

PedalGo uses Turso/libSQL with Drizzle ORM. Database commands load `.env.local` and `.env` automatically without overriding shell-provided variables.

Database commands:

- `pnpm db:generate` — generate Drizzle migrations from `lib/db/schema.ts` into `drizzle/`.
- `pnpm db:migrate` — apply generated migrations to the configured libSQL database.
- `pnpm db:check` — validate generated migration files.
- `pnpm db:seed` — seed the MVP city bike inventory and bootstrap admin user.

Seed data is idempotent and creates:

- One active `PedalGo City Bike` bike type at 25.00 USD/day.
- Two available physical bikes: `CITY-001` and `CITY-002`.
- One active bootstrap admin user using `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_NAME`.

### Stripe setup

- Checkout creation uses `STRIPE_SECRET_KEY` and creates success/cancel URLs from `NEXT_PUBLIC_APP_URL`, then `APP_URL`, then the local fallback `http://localhost:3000`.
- Configure a Stripe webhook endpoint for the exact deployed route: `/api/stripe/webhook`.
  - Local route: `http://localhost:3000/api/stripe/webhook` via Stripe CLI forwarding.
  - Deployed route shape: `https://your-domain.example/api/stripe/webhook`.
- Store that endpoint's signing secret in `STRIPE_WEBHOOK_SECRET`.
- The MVP expects `checkout.session.completed` events. Reservations are confirmed by verified webhooks, not by customer visits to the success page.

### Resend setup

- Set `RESEND_API_KEY` for the environment that receives paid Stripe webhooks.
- Set `RESEND_FROM_EMAIL` to a sender/domain verified or otherwise allowed by Resend.
- Optional `PEDALGO_*` contact variables control pickup/contact copy in confirmation emails.
- If Resend rejects the email send, the webhook returns an error and the reservation remains pending for retry/follow-up.

### Deployment checklist

- Configure all required secrets in the deployment environment; do not copy local placeholder values.
- Set `NEXT_PUBLIC_APP_URL` or `APP_URL` to the deployed public origin before taking payments.
- Apply migrations to the target Turso/libSQL database with `pnpm db:migrate`.
- Run `pnpm db:seed` once with a strong `ADMIN_BOOTSTRAP_PASSWORD` to create the MVP inventory and bootstrap admin.
- Configure the deployed Stripe webhook endpoint at `https://<public-domain>/api/stripe/webhook` and save its signing secret as `STRIPE_WEBHOOK_SECRET`.
- Verify the Resend sender/domain used by `RESEND_FROM_EMAIL`.
- Use distinct test/staging/production values for Turso, Stripe, Resend, admin password, and admin session secret.
- Run `pnpm lint` and `pnpm build` before release.
