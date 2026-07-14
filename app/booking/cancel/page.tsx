import Link from 'next/link'
import { AlertCircle, Info } from 'lucide-react'

import { FlowHeader } from '@/components/public/flow-header'
import { buttonVariants } from '@/components/ui/button'
import { db } from '@/lib/db/client'
import { formatCurrency, formatDateTime } from '@/lib/pricing'
import { getBookingStatusByReservationReference, type PublicBookingStatusSummary } from '@/lib/public-booking/status'

type BookingCancelPageProps = {
  searchParams: Promise<{
    reservation?: string | string[]
  }>
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function BookingCancelPage({ searchParams }: BookingCancelPageProps) {
  const params = await searchParams
  const reservationReference = firstParam(params.reservation)
  const result = await getBookingStatusByReservationReference(reservationReference, db)

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <FlowHeader />
      <main className="flex-1 px-4 py-12">
        <section className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                <Info className="size-5" aria-hidden="true" />
                Checkout cancelled
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">No confirmed reservation yet</h1>
              <p className="text-muted-foreground">
                Your Stripe Checkout session was cancelled or closed before payment confirmation. No reservation is confirmed unless Stripe later reports a successful payment through PedalGo&apos;s verified webhook.
              </p>
            </div>

            {result.status === 'found' ? (
              <CancelStatus summary={result.summary} />
            ) : (
              <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <AlertCircle className="size-4" aria-hidden="true" />
                  Reservation lookup unavailable
                </div>
                {result.message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/" className={buttonVariants()}>Start a new booking</Link>
              <Link href="/booking" className={buttonVariants({ variant: 'outline' })}>Return to booking</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function CancelStatus({ summary }: { summary: PublicBookingStatusSummary }) {
  return (
    <dl className="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm md:grid-cols-2">
      <StatusRow label="Reservation" value={summary.reservationReference} />
      <StatusRow label="Reservation status" value={summary.reservationStatus} />
      <StatusRow label="Payment status" value={summary.paymentStatus ?? 'pending'} />
      <StatusRow label="Amount" value={formatCurrency(summary.amountUsdCents / 100)} />
      <StatusRow label="Pickup" value={formatDateTime(summary.pickupAt)} />
      <StatusRow label="Return" value={formatDateTime(summary.returnAt)} />
    </dl>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 md:flex-col md:justify-start md:gap-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize md:text-base">{value}</dd>
    </div>
  )
}
