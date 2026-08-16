import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="bg-[var(--wm-olive)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--wm-navy)]/70">
            Your next good day is waiting
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-5xl font-bold uppercase leading-none tracking-tight text-[var(--wm-navy)] text-balance sm:text-6xl">
            Pick a date. We&apos;ll handle the rest.
          </h2>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:items-end">
          <Button
            render={<Link href="/booking" />}
            nativeButton={false}
            size="lg"
            className="h-12 w-full bg-[var(--wm-navy)] px-6 text-white hover:bg-[var(--wm-forest)] sm:w-auto"
          >
            Reserve your bike
            <ArrowRight data-icon="inline-end" />
          </Button>
          <a
            href="tel:603-348-1320"
            className="inline-flex min-h-10 items-center justify-center gap-2 text-sm font-semibold text-[var(--wm-navy)]/75 hover:text-[var(--wm-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wm-navy)]"
          >
            <Phone className="size-4" aria-hidden="true" />
            Or call (603) 348-1320
          </a>
        </div>
      </div>
    </section>
  )
}
