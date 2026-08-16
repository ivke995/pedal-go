import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Compass, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingSearchForm } from '@/components/public/booking-search-form'

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-[var(--wm-navy)] text-white"
    >
      <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(120deg,transparent_30%,var(--wm-blue)_30.2%,transparent_30.5%),linear-gradient(35deg,transparent_58%,var(--wm-olive)_58.2%,transparent_58.5%)] [background-size:34rem_34rem]" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col items-start gap-7">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--wm-blue)]">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 text-[var(--wm-gold)]" aria-hidden="true" />
              Lincoln · Woodstock · White Mountains
            </span>
          </div>
          <div className="max-w-2xl">
            <p className="mb-4 font-display text-lg font-semibold uppercase tracking-[0.25em] text-[var(--wm-gold)] sm:text-xl">
              Explore more. Ride more.
            </p>
            <h1 className="font-display text-6xl font-bold uppercase leading-[0.88] tracking-tight text-balance sm:text-8xl lg:text-9xl">
              Your ride to the mountains starts here.
            </h1>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-white/75 text-pretty sm:text-xl">
            Simple, comfortable bike rentals for days spent discovering the
            White Mountains. Reserve online and we&apos;ll bring the ride to
            your hotel.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="h-12 bg-[var(--wm-gold)] px-6 text-[var(--wm-navy)] hover:bg-[#d0ab70]"
            >
              Check availability
              <ArrowRight data-icon="inline-end" />
            </Button>
            <a
              href="tel:603-348-1320"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wm-gold)]"
            >
              <Phone className="size-4" aria-hidden="true" />
              (603) 348-1320
            </a>
          </div>
          <a
            href="#how-it-works"
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wm-gold)]"
          >
            See how it works
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-3 rounded-[2rem] border border-[var(--wm-gold)]/35 sm:-inset-5" />
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[var(--wm-forest)] shadow-2xl shadow-black/30 sm:rounded-[2rem]">
            <Image
              src="/images/hero-bike.png"
              alt="City bike ready for a ride through the White Mountains"
              width={1024}
              height={1024}
              priority
              className="aspect-[4/5] w-full object-cover object-center mix-blend-multiply sm:aspect-square"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--wm-navy)] via-[var(--wm-navy)]/70 to-transparent p-6 pt-24 sm:p-8 sm:pt-32">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-3xl font-semibold uppercase tracking-wide">
                    Ride the Kanc
                  </p>
                  <p className="mt-1 text-sm text-white/70">Free hotel delivery + pickup</p>
                </div>
                <Compass className="size-9 text-[var(--wm-gold)]" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-white/15 bg-white p-4 text-[var(--wm-navy)] shadow-xl sm:-bottom-8 sm:left-8 sm:right-8 sm:p-5">
            <BookingSearchForm />
          </div>
        </div>
      </div>
      <div className="h-10 bg-[var(--wm-offwhite)] [clip-path:polygon(0_55%,12%_15%,25%_50%,39%_5%,53%_52%,68%_0,82%_55%,100%_12%,100%_100%,0_100%)]" />
    </section>
  )
}
