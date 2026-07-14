import Image from 'next/image'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PriceSummary } from '@/components/public/price-summary'
import { cityBike } from '@/lib/mock-data'
import type { BookingDraft } from '@/lib/types'

interface BookingSummaryProps {
  draft: BookingDraft
}

export function BookingSummary({ draft }: BookingSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Booking summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={cityBike.image || '/placeholder.svg'}
              alt={cityBike.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <p className="font-heading text-sm font-semibold text-foreground">
              {cityBike.name}
            </p>
            <p className="text-xs text-muted-foreground">
              1 bike · lock included
            </p>
          </div>
        </div>
        <PriceSummary draft={draft} />
      </CardContent>
    </Card>
  )
}
