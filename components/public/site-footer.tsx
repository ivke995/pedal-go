import Link from 'next/link'
import { Camera, MapPin, Phone } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

const FOOTER_LINKS = [
  { href: '/#rentals', label: 'Rentals' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/admin/login', label: 'Admin' },
]

export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-[var(--wm-navy)] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-[1.3fr_0.7fr_0.9fr]">
          <div className="flex flex-col items-start gap-5">
            <BrandLogo href="" variant="onDark" />
            <p className="max-w-sm text-sm leading-relaxed text-white/65 text-pretty">
              White Mountains bike rentals for scenic days in Lincoln,
              Woodstock, and the surrounding mountains.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:603-348-1320"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--wm-gold)] px-4 text-sm font-semibold text-[var(--wm-navy)] transition-colors hover:bg-[#d0ab70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Phone className="size-4" aria-hidden="true" />
                (603) 348-1320
              </a>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm text-white/75">
                <Camera className="size-4" aria-hidden="true" />
                @whitemountainsbikerentals
              </span>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-[var(--wm-gold)]">
              Explore
            </h2>
            <nav aria-label="Footer" className="mt-4">
              <ul className="flex flex-col gap-3">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/65 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wm-gold)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-[var(--wm-gold)]">
              Find us here
            </h2>
            <div className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-white/65">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--wm-blue)]" aria-hidden="true" />
              <p>Serving Lincoln, Woodstock, and the White Mountains.</p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} White Mountains Bike Rentals.</p>
          <p>Explore more. Ride more.</p>
        </div>
      </div>
    </footer>
  )
}
