# PedalGo MVP Architecture and Product Decisions

## Status

Accepted for the original MVP release state; the White Mountains redesign supersedes the provider-payment decisions below as implementation proceeds. Current behavior is summarized in `context/public-booking/` and `context/admin/`.

## Decision

PedalGo MVP is a web application for online bicycle rentals with a customer-first booking flow and an authenticated administrator interface.

## MVP product scope

- Customers do not create accounts or log in.
- Customers provide only full name, email address, and phone number during booking.
- A public reservation starts in `pending_verification`; external payment instructions do not prove payment.
- Venmo/Zelle are manual instruction methods; no provider API, payment table, or webhook finalizes reservations.
- Only a protected owner/admin verification action may later transition a pending-verification reservation to `confirmed`.
- Resend is the MVP email provider for booking confirmations.
- Administrators authenticate at `/admin/login` before accessing the dashboard.
- Administrators manage reservations, pricing, bicycle availability, maintenance blocks, and manual payment-method visibility.

## MVP rental model

- The MVP exposes one featured rental option in the customer UI.
- The UI and data model should support future multiple bike types without redesign.
- Pricing formula: `total price = rental days × daily rate`.
- Every started 24-hour period counts as one rental day.
- MVP currency is USD.

## Data platform

- Use Turso/libSQL with Drizzle ORM for the first implementation phase.
- Model future expansion from the start: `BikeType`, `Bike`, `Reservation`, `AvailabilityBlock`, and `AdminUser`; provider payment persistence is out of scope.

## Core statuses

Reservation statuses in code/database:
- `pending_verification`
- `confirmed`
- `cancelled`
- `completed`
- `failed`
- `refunded`

Reservation payment methods in code/database:
- `venmo`
- `zelle`

Bicycle statuses in code/database:
- `available`
- `reserved`
- `rented`
- `maintenance`
- `inactive`

## Explicit non-goals for MVP

- Customer accounts, login, and password management.
- Public bicycle category browsing, filters, or advanced search.
- Loyalty, reviews, discount codes, seasonal pricing, multilingual UI, native mobile app, and customer self-service cancellation.
