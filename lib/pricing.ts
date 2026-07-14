// Frontend-only pricing rules for the MVP.
// Daily rate is 30 USD and every started 24-hour period counts as one rental day.

export const DAILY_RATE = 30
export const CURRENCY = 'USD'

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Number of rental days. Every started 24h period counts as one full day.
 * Returns 0 when the range is empty or invalid.
 */
export function calculateRentalDays(pickup: Date, returnDate: Date): number {
  const diff = returnDate.getTime() - pickup.getTime()
  if (Number.isNaN(diff) || diff <= 0) return 0
  return Math.ceil(diff / MS_PER_DAY)
}

export function calculateTotal(days: number, dailyRate: number = DAILY_RATE): number {
  return days * dailyRate
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Human-friendly duration label, e.g. "2 days (48h)".
 */
export function formatDuration(days: number): string {
  if (days <= 0) return '—'
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
