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
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Featured rental
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
              Meet the PedalGo City Bike
            </h2>
            <p className="text-muted-foreground text-pretty">
              Our do-it-all city bike is comfortable, reliable, and ready for
              anything from a riverside cruise to a day of sightseeing. More
              bike types are on the way.
            </p>
          </div>
          <BikeCard bike={cityBike} onSelect={scrollToBooking} />
        </div>
      </div>
    </section>
  )
}
