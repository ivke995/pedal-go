# Glossary

- **PedalGo** — The bicycle rental app/brand.
- **Bike type** — A rentable category of bicycle, represented in the database by `bike_types` and in current UI types by `BikeType`.
- **Physical bike** — A specific inventory unit, represented in the database by `bikes` and in current UI types by `PhysicalBike`.
- **Reservation** — A customer rental booking with pickup/return dates, price, and status.
- **Availability block** — A date range that affects rental availability, such as maintenance, reserved demand, or inactive shop days.
- **Bootstrap admin** — Initial active admin user created by `pnpm db:seed`; credentials are supplied through seed environment variables rather than committed to the repository.
- **Rental day** — Current pricing rule: every started 24-hour period counts as one full rental day.
- **USD** — Legacy/mock UI display currency used by current frontend-only rental data until UI paths migrate to database-backed BAM pricing.
- **BAM** — Bosnia and Herzegovina convertible mark. Database-backed rental prices are stored as BAM minor units (`*_bam_cents`) and formatted by server-side domain helpers.
- **Turso** — Hosted libSQL database provider used for PedalGo database environments.
- **libSQL** — SQLite-compatible database engine/client used by PedalGo through `@libsql/client`.
- **Drizzle ORM** — TypeScript ORM and migration tooling used for PedalGo database schema and queries.
- **SCE** — Shared Context Engineering: durable AI-first project memory stored under `context/`.
