'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight, CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PriceSummary } from '@/components/public/price-summary'
import type { AvailabilityQuoteResult } from '@/lib/public-booking/availability'

interface AvailabilityResultProps {
  result: Extract<AvailabilityQuoteResult, { status: 'available' | 'unavailable' }>
}

export function AvailabilityResult({ result }: AvailabilityResultProps) {
  if (result.status === 'unavailable') {
    return (
      <div
        className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-destructive">
          <CircleAlert className="size-5" aria-hidden="true" />
          <p className="font-heading text-base font-semibold">Not available</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
        <p className="mt-3 text-sm font-medium text-foreground">
          Try a different pickup or return time to continue.
        </p>
      </div>
    )
  }

  const { draft } = result
  const bookingHref = `/booking?pickup=${encodeURIComponent(
    draft.pickupAt,
  )}&return=${encodeURIComponent(draft.returnAt)}`

  return (
    <div
      className="rounded-2xl border border-primary/20 bg-primary/5 p-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle2 className="size-5" aria-hidden="true" />
        <p className="font-heading text-base font-semibold">Bike available</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {result.availableUnits} {result.bikeName} rental
        {result.availableUnits === 1 ? ' is' : 's are'} available for your
        selected dates.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <PriceSummary draft={draft} />
      </div>

      <Button
        render={<Link href={bookingHref} />}
        nativeButton={false}
        size="lg"
        className="mt-4 w-full"
      >
        Continue to Booking
        <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  )
}
