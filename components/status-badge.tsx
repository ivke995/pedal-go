import { cn } from '@/lib/utils'
import type { AvailabilityStatus, ReservationStatus } from '@/lib/types'

type AnyStatus = ReservationStatus | AvailabilityStatus

const STATUS_CONFIG: Record<
  AnyStatus,
  { label: string; className: string }
> = {
  // Reservation / payment statuses
  pending: {
    label: 'Pending Payment',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground border-border',
  },
  completed: {
    label: 'Completed',
    className: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  failed: {
    label: 'Payment Failed',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  // Availability statuses
  available: {
    label: 'Available',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  reserved: {
    label: 'Reserved',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  rented: {
    label: 'Rented',
    className: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

interface StatusBadgeProps {
  status: AnyStatus
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        config.className,
        className,
      )}
    >
      <span
        className="size-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {label ?? config.label}
    </span>
  )
}
