'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { BrandLogo } from '@/components/brand-logo'

const NAV_LINKS = [
  { href: '/#home', label: 'Home' },
  { href: '/#rentals', label: 'Rentals' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#contact', label: 'Contact' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--wm-navy)] text-white shadow-lg shadow-[var(--wm-navy)]/10">
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo variant="onDark" />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wm-gold)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/booking" />}
            nativeButton={false}
            className="hidden bg-[var(--wm-gold)] text-[var(--wm-navy)] hover:bg-[#d0ab70] md:inline-flex"
            size="lg"
          >
            Book a Bike
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white md:hidden"
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="right" className="w-80 bg-[var(--wm-navy)] text-white">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLogo href="" variant="onDark" />
                </SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile"
                className="flex flex-col gap-1 px-4"
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wm-gold)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4">
                <Button
                  render={<Link href="/booking" />}
                  nativeButton={false}
                  size="lg"
                  className="w-full bg-[var(--wm-gold)] text-[var(--wm-navy)] hover:bg-[#d0ab70]"
                  onClick={() => setOpen(false)}
                >
                  Book a Bike
                </Button>
              </div>
              <a
                href="tel:603-348-1320"
                className="flex items-center gap-2 px-7 pb-5 text-sm text-white/70 hover:text-white"
              >
                <Phone className="size-4" aria-hidden="true" />
                (603) 348-1320
              </a>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
