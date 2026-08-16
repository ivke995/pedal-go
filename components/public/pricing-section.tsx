import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, DAILY_RATE } from '@/lib/pricing'

const INCLUDED = [
  'One clear $48 daily rate',
  'No hidden booking fees',
  'Lock included with every rental',
  'Every started 24-hour period counts as one rental day',
  'Free hotel delivery and pickup',
]

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-[var(--wm-offwhite)] py-24 sm:py-32">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--wm-forest)]">
            Pricing
          </p>
          <h2 className="font-display text-5xl font-bold uppercase leading-none tracking-tight text-[var(--wm-navy)] text-balance sm:text-6xl">
            Keep it simple
          </h2>
          <p className="max-w-xl text-muted-foreground text-pretty">
            One clear daily rate, with the details you need before you ride.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-sm md:grid md:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-2 bg-[var(--wm-forest)] p-10 text-center text-white">
            <p className="text-sm font-medium uppercase tracking-widest opacity-90">
              Daily rate
            </p>
            <p className="font-heading text-5xl font-extrabold">
              {formatCurrency(DAILY_RATE)}
            </p>
            <p className="text-sm opacity-90">per day</p>
          </div>
          <div className="flex flex-col gap-5 p-8">
            <ul className="flex flex-col gap-3">
              {INCLUDED.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-foreground"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Button
              render={<Link href="/booking" />}
              nativeButton={false}
              size="lg"
              className="w-full bg-[var(--wm-navy)] hover:bg-[var(--wm-forest)]"
            >
              Book a Bike
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
