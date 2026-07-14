import { formatCurrency, formatDateTime, formatDuration } from '@/lib/pricing'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { BookingDraft } from '@/lib/types'

interface PriceSummaryProps {
  draft: BookingDraft
  className?: string
}

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-right text-sm font-medium text-foreground',
          strong && 'text-base font-semibold',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function PriceSummary({ draft, className }: PriceSummaryProps) {
  return (
    <dl className={cn('flex flex-col gap-3', className)}>
      <Row label="Rental start" value={formatDateTime(draft.pickupAt)} />
      <Row label="Rental end" value={formatDateTime(draft.returnAt)} />
      <Row label="Duration" value={formatDuration(draft.days)} />
      <Row
        label="Daily rate"
        value={`${formatCurrency(draft.dailyRate)} / day`}
      />
      <Separator />
      <div className="flex items-baseline justify-between gap-4">
        <dt className="font-heading text-base font-semibold text-foreground">
          Total
        </dt>
        <dd className="font-heading text-2xl font-bold text-primary">
          {formatCurrency(draft.total)}
        </dd>
      </div>
    </dl>
  )
}
