# White Mountains Public Landing Page

The public `/` route presents the White Mountains Bike Rentals brand while retaining the existing booking and availability boundaries.

## Composition

- `app/page.tsx` composes the public header, hero/availability entry, how-it-works, featured rental, benefits, pricing, service-area, FAQ, final CTA, and footer sections.
- `components/public/public-header.tsx` provides sticky desktop navigation and an accessible mobile sheet. Booking buttons link to `/booking`.
- `components/public/hero-section.tsx` communicates `EXPLORE MORE. RIDE MORE.`, Lincoln/Woodstock/White Mountains service, the phone CTA, and the existing homepage availability form.
- `components/public/service-area.tsx` and `components/public/final-cta.tsx` provide location context and the closing reservation action.
- `components/brand-logo.tsx` is the interim text/icon brand treatment. It does not attempt to recreate the supplied logo in CSS.

## Current visual/content contract

- Palette variables are scoped as `--wm-navy`, `--wm-forest`, `--wm-olive`, `--wm-offwhite`, `--wm-blue`, and `--wm-gold` in `app/globals.css`.
- `Barlow Condensed` is exposed as `font-display` for uppercase tourism-style headings; body text remains Inter.
- Existing `/images/hero-bike.png` and `/images/city-bike.png` assets are reused with explicit aspect-ratio/object-fit classes.
- Public copy uses the supplied `(603) 348-1320`, `@whitemountainsbikerentals`, Lincoln/Woodstock/White Mountains service area, `$48/day`, and free hotel delivery/pickup. No public email, street address, or invented inventory claim is included.
- The featured database bike is shown as `White Mountains City Bike` at the public boundary even though the internal seed/package identifier remains PedalGo.

## Accessibility and navigation

- Navigation and CTA controls have semantic links, visible focus rings, touch-friendly minimum heights, and a dialog-managed mobile menu.
- Section headings and image alt text are present; the hero availability form remains the client entry point to the server-backed quote flow.

See also: [overview](../overview.md), [architecture](../architecture.md), and [public availability](../public-booking/availability.md).
