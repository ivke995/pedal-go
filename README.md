# pedal-go

## Database setup

PedalGo uses Turso/libSQL with Drizzle ORM.

Required environment variables:

- `TURSO_DATABASE_URL` — libSQL connection URL. Use `file:./local.db` for local development or a Turso URL for remote databases.
- `TURSO_AUTH_TOKEN` — required for remote Turso databases; omit for local `file:` URLs.

Local database commands load `.env.local` and `.env` automatically. Keep real Turso tokens in `.env.local` or deployment secrets; do not commit them.

Database commands:

- `pnpm db:generate` — generate Drizzle migrations from `lib/db/schema.ts` into `drizzle/`.
- `pnpm db:migrate` — apply generated migrations to the configured libSQL database.
- `pnpm db:check` — validate generated migration files.
- `pnpm db:seed` — seed the MVP city bike inventory and bootstrap admin user.

Local seed example:

```bash
pnpm db:migrate
pnpm db:seed
```

Seed data is idempotent and creates:

- One active `PedalGo City Bike` bike type at 25.00 USD/day.
- Two available physical bikes: `CITY-001` and `CITY-002`.
- One active bootstrap admin user. `ADMIN_BOOTSTRAP_EMAIL` defaults to `admin@pedalgo.local`, and `ADMIN_BOOTSTRAP_NAME` defaults to `PedalGo Admin`.
