# PedalGo MVP Architecture and Product Decisions

## Status

Accepted for the MVP release state; current implemented booking/payment behavior is summarized in `context/public-booking/` and admin behavior in `context/admin/`.

## Decision

PedalGo MVP is a web application for online bicycle rentals with a customer-first booking flow and an authenticated administrator interface.

## MVP product scope

- Customers do not create accounts or log in.
- Customers provide only full name, email address, and phone number during booking.
- A reservation is valid only after successful online payment.
- Stripe Checkout is the MVP payment provider.
- Verified Stripe webhook confirmation, not the success page, finalizes reservations.
- Resend is the MVP email provider for booking confirmations.
- Administrators authenticate at `/admin/login` before accessing the dashboard.
- Administrators manage reservations, pricing, bicycle availability, maintenance blocks, and payment status visibility.

## MVP rental model

- The MVP exposes one featured rental option in the customer UI.
- The UI and data model should support future multiple bike types without redesign.
- Pricing formula: `total price = rental days × daily rate`.
- Every started 24-hour period counts as one rental day.
- MVP currency is USD.

## Data platform

- Use Turso/libSQL with Drizzle ORM for the first implementation phase.
- Model future expansion from the start: `BikeType`, `Bike`, `Reservation`, `Payment`, `AvailabilityBlock`, and `AdminUser`.

## Core statuses

Reservation statuses in code/database:
- `pending`
- `confirmed`
- `cancelled`
- `completed`
- `failed`
- `refunded`

Payment statuses in code/database:
- `pending`
- `confirmed`
- `failed`
- `refunded`

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
