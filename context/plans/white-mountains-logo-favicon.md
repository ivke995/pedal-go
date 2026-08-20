# White Mountains Logo and Favicon

## Change summary

Replace the current text-and-Lucide-icon branding with a simplified, reusable White Mountains Bike Rentals identity based on the supplied reference image. Create a responsive logo asset set centered on the mountain-and-bike concept, add favicon/app-icon variants, and wire the new branding into the shared logo component, public site surfaces, admin shell, and Next.js metadata.

The implementation will use an original simplified vector treatment rather than embedding the full supplied flyer image. The primary source of truth will be SVG so the logo remains sharp at header sizes and can be exported to raster icon sizes without introducing a new runtime dependency.

## Success criteria

1. A simplified logo based on the supplied reference communicates White Mountains Bike Rentals through a mountain/bicycle mark and the existing navy/forest/olive/light-blue visual language.
2. The logo is available as a scalable SVG, with a compact mark suitable for small surfaces and favicon use; raster app-icon exports are provided where platform/browser compatibility requires them.
3. The existing `BrandLogo` no longer renders the temporary Lucide bicycle badge and instead renders the new asset with appropriate accessible labeling, link behavior, variants, and responsive sizing.
4. The new branding appears consistently in the public header, mobile navigation, booking flow header, footer, and protected admin dashboard shell without changing navigation or authentication behavior.
5. Next.js metadata points to the new favicon/icon assets for light and dark browser contexts plus Apple touch/app-icon usage; stale placeholder icon branding is no longer used by the application.
6. The logo preserves aspect ratio, remains legible at desktop/tablet/mobile sizes, has usable contrast on light and dark surfaces, and does not introduce layout overflow or broken image states.
7. Existing tests, lint, TypeScript/build checks, and targeted source/asset checks pass; durable public-site context is updated to describe the new current branding.

## Constraints and non-goals

- Use the supplied image only as the visual reference; do not ship the entire flyer as the site logo and do not recreate the flyer’s detailed marketing copy, delivery panel, or location ribbon in the header asset.
- Keep the simplified logo focused on the mountain-and-bike mark with the `WHITE MOUNTAINS` and `BIKE RENTALS` brand wording where space permits. The compact mark must omit small text that would be unreadable at favicon sizes.
- Prefer SVG assets and the existing project tooling; do not add an image-processing package or external logo service unless implementation discovers an unavoidable platform requirement.
- Preserve the existing `BrandLogo` API behavior (`href`, `className`, `variant`, and optional `subtitle`) unless a narrowly scoped accessibility or sizing adjustment is required.
- Do not change booking, pricing, availability, admin authentication, routes, or business copy as part of the branding work.
- Do not invent additional contact information, claims, product inventory, or a new public brand name. Keep the current public brand `White Mountains Bike Rentals`.
- Keep the logo usable on the current public palette and the admin sidebar; do not redesign protected admin screens beyond replacing the shared brand treatment.

## Assumptions

- The supplied reference image is available to the implementation session as the design reference, but no original editable logo source is required.
- The asset set will use a full lockup SVG for normal header/footer use, a compact mark SVG for narrow/mobile and favicon contexts, and generated PNG sizes for Apple/browser compatibility as needed.
- Existing files under `public/icon*.png`, `public/icon.svg`, and `public/apple-icon.png` are replaceable application icon assets rather than user-uploaded content.
- The existing `BrandLogo` is the shared integration point for all currently branded public and admin surfaces.

## Task stack

- [ ] T01: `Create simplified White Mountains logo asset set` (status:todo)
  - Task ID: T01
  - Goal: Create the finalized vector logo and compact mark derived from the supplied mountain-bike reference, plus the raster icon exports required by the app’s browser/platform targets.
  - Boundaries (in/out of scope): In — add organized static assets under `public/brand/` (full lockup and compact mark), replace or regenerate the current favicon/app-icon files where appropriate, use the established White Mountains palette, preserve transparent/background-safe variants, and ensure the artwork scales cleanly. Out — React integration, metadata changes, layout changes, new branding copy, and changes to public/admin behavior.
  - Done when: The full lockup visibly contains the simplified mountain-and-bike identity and `White Mountains Bike Rentals` wording; the compact mark remains recognizable without tiny text; SVG files have valid viewBox/aspect-ratio data; raster exports exist at the sizes needed by metadata; no asset embeds the full reference flyer or introduces external URLs.
  - Verification notes (commands or checks): Inspect SVGs at large and small sizes; confirm transparent/background-safe rendering on light and dark swatches; verify raster dimensions and file paths; run a repository asset listing/search to ensure the new files are tracked in the intended locations.

- [ ] T02: `Integrate logo into shared brand surfaces` (status:todo)
  - Task ID: T02
  - Goal: Update the shared `BrandLogo` component to render the new full/compact asset treatment and make every existing consumer display the same brand consistently.
  - Boundaries (in/out of scope): In — update `components/brand-logo.tsx` and, only if required by the shared component contract, its direct styling/consumer usage; preserve the existing link, subtitle, className, `default`, and `onDark` behavior; cover public header desktop/mobile, flow header, footer, and admin dashboard consumers; retain accessible home labeling and decorative-image semantics. Out — favicon metadata, route behavior, admin auth, landing-page copy/layout redesign, and unrelated component cleanup.
  - Done when: No shared branded surface renders the temporary Lucide bicycle badge; normal surfaces use the full lockup, constrained surfaces use a legible responsive treatment, dark surfaces have sufficient contrast, the home link remains keyboard/screen-reader accessible, and existing navigation/auth behavior is unchanged.
  - Verification notes (commands or checks): Search all `BrandLogo` consumers; inspect rendered markup/classes for image sizing and alt/aria behavior; run `pnpm lint`; run the relevant TypeScript/build check if the component contract changes.

- [ ] T03: `Wire favicon and Next metadata to new icons` (status:todo)
  - Task ID: T03
  - Goal: Replace stale icon references in the root metadata with the new compact brand mark and ensure browser, dark-mode, and Apple touch-icon entry points resolve correctly.
  - Boundaries (in/out of scope): In — update `app/layout.tsx` metadata icon declarations and the corresponding static icon files; use the compact mark for small icons, preserve the existing title/description/theme color unless a brand-color correction is necessary, and remove references to superseded placeholder branding. Out — SEO copy rewrite, browser manifest/PWA work unless already required by the existing metadata contract, favicon generation tooling, and visual changes outside icon/metadata wiring.
  - Done when: Light and dark favicon entries resolve to the new mark, the SVG icon entry has the correct MIME type/path, Apple icon resolves to the new app icon, no stale icon asset is selected by metadata, and the metadata remains valid for the Next.js App Router.
  - Verification notes (commands or checks): Inspect `app/layout.tsx` and resolve every referenced file path; run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`; if available, perform a local route smoke check and inspect the generated document head for icon links.

- [ ] T04: `Validate branding release and synchronize context` (status:todo)
  - Task ID: T04
  - Goal: Perform final validation and update durable context so future sessions know the logo asset locations and integration contract.
  - Boundaries (in/out of scope): In — run full tests, lint, TypeScript, production build, asset/source searches, and responsive/accessibility smoke checks; remove temporary/generated scaffolding; update `context/public-site/landing-page.md` and any concise root context references that still describe the interim text/icon treatment. Out — new visual redesign, unrelated fixes, deployment configuration, and changes discovered outside logo/favicon scope.
  - Done when: Full validation passes or failures are recorded with evidence; desktop/tablet/mobile header/footer/booking/admin surfaces show the new logo without overflow; keyboard focus and accessible home labeling remain intact; source search finds no active interim-brand implementation; context describes the new current asset paths and favicon contract.
  - Verification notes (commands or checks): `pnpm test`; `pnpm lint`; `pnpm exec tsc --noEmit`; `pnpm build`; `git diff --check`; targeted search for old icon/temporary `BrandLogo` rendering; inspect `/`, `/booking`, and `/admin/login` plus narrow/desktop viewport behavior; review the updated context files against code truth.

## Open questions

- None blocking. The implementation may choose the exact SVG geometry and raster export sizes while preserving the asset and integration constraints above.
