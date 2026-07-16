# Admin Authentication

PedalGo has a database-backed MVP administrator sign-in flow for `/admin` routes.

## Routes and files

- `app/admin/(auth)/login/page.tsx` renders `/admin/login`.
- `app/admin/(auth)/login/actions.ts` submits admin credentials through a server action.
- `app/admin/(dashboard)/layout.tsx` protects authenticated admin dashboard routes with `requireAuthenticatedAdmin()`.
- `app/admin/actions.ts` exposes admin logout.
- `lib/admin-auth/` contains password verification, signed session-cookie handling, and active-admin lookup.

## Auth model

- Admin records live in `admin_users` and are seeded by `pnpm db:seed` as the bootstrap admin.
- Login normalizes the submitted email to lowercase and accepts only `status = active` admin users.
- Password hashes use the seeded `pbkdf2_sha256$iterations$salt$hash` format.
- Successful login updates `last_login_at` and `updated_at`, then sets an HTTP-only `pedalgo_admin_session` cookie scoped to `/admin`.
- Session cookies are HMAC-signed with `ADMIN_SESSION_SECRET`, expire after 8 hours, use `sameSite=lax`, and use the secure flag in production.
- Production admin sessions require `ADMIN_SESSION_SECRET`; local development falls back to a non-production default.
- Logout clears the admin session cookie and redirects to `/admin/login`.

## Route protection

`requireAuthenticatedAdmin()` validates the signed cookie, re-checks that the referenced admin user still exists and is active, and redirects unauthenticated or inactive users to `/admin/login`.

Future admin dashboard sections should live under the protected `app/admin/(dashboard)/` route group unless they are public admin-auth entry points.
