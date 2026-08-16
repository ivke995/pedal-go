'use client'

import { BikeCard } from '@/components/public/bike-card'
import { cityBike } from '@/lib/mock-data'

export function FeaturedBike() {
  function scrollToBooking() {
    const el = document.getElementById('home')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="rentals" className="scroll-mt-20 bg-white py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--wm-forest)]">
              The fleet
            </p>
            <h2 className="font-display text-5xl font-bold uppercase leading-none tracking-tight text-[var(--wm-navy)] text-balance sm:text-6xl">
              One great bike. Every kind of day.
            </h2>
            <p className="max-w-lg text-muted-foreground text-pretty">
              Our comfortable city bike is easy to ride and ready for scenic
              loops, town errands, and everything between. The current fleet is
              small, personal, and regularly maintained.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--wm-forest)]">
              <span className="rounded-full bg-[var(--wm-offwhite)] px-3 py-2">Comfort first</span>
              <span className="rounded-full bg-[var(--wm-offwhite)] px-3 py-2">Lock included</span>
              <span className="rounded-full bg-[var(--wm-offwhite)] px-3 py-2">Safety checked</span>
            </div>
          </div>
          <BikeCard bike={cityBike} onSelect={scrollToBooking} />
        </div>
      </div>
    </section>
  )
}
