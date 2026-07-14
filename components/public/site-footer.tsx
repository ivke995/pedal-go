import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, Camera, Share2, Send } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

const FOOTER_LINKS = [
  { href: '/#home', label: 'Home' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/admin/login', label: 'Admin' },
]

const CONTACT = [
  { icon: MapPin, label: 'Obala Kulina bana 12, Sarajevo' },
  { icon: Phone, label: '+387 33 000 000' },
  { icon: Mail, label: 'hello@pedalgo.example' },
  { icon: Clock, label: 'Mon–Sun · 08:00 – 20:00' },
]

const SOCIALS = [
  { icon: Camera, label: 'Instagram' },
  { icon: Share2, label: 'Facebook' },
  { icon: Send, label: 'Twitter' },
]

export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <BrandLogo href="" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
              Rent a well-maintained bike online in minutes. Flexible pickup
              times and friendly local support.
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
                >
                  <social.icon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Contact
            </h3>
            <ul className="flex flex-col gap-3">
              {CONTACT.map((item) => (
                <li
                  key={item.label}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <item.icon
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Explore
            </h3>
            <ul className="flex flex-col gap-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-heading text-sm font-semibold text-foreground">
              Pickup location
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              Central riverside shop, a short walk from the Old Town. Look for
              the green PedalGo sign.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} PedalGo. All rights reserved.</p>
          <p>Made for riders in the city and beyond.</p>
        </div>
      </div>
    </footer>
  )
}
