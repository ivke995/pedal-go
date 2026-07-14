'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PriceSummary } from '@/components/public/price-summary'
import type { BookingDraft } from '@/lib/types'

interface AvailabilityResultProps {
  draft: BookingDraft
}

export function AvailabilityResult({ draft }: AvailabilityResultProps) {
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
        A PedalGo City Bike is available for your selected dates.
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
