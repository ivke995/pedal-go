import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'

import { FlowHeader } from '@/components/public/flow-header'
import { buttonVariants } from '@/components/ui/button'
import { db } from '@/lib/db/client'
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/pricing'
import { getBookingStatusByCheckoutSession, type PublicBookingStatusSummary } from '@/lib/public-booking/status'

type BookingSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string | string[]
  }>
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function statusCopy(summary: PublicBookingStatusSummary) {
  switch (summary.kind) {
    case 'confirmed':
      return {
        icon: CheckCircle2,
        eyebrow: 'Payment confirmed',
        title: 'Your bike is booked',
        body: 'Stripe has confirmed your payment. We have confirmed your reservation and sent the pickup details to your email.',
        tone: 'text-primary',
      }
    case 'failed':
      return {
        icon: XCircle,
        eyebrow: 'Payment not completed',
        title: 'Your reservation is not confirmed',
        body: 'Stripe reported that payment failed or the checkout session expired. Please start a new booking if you still need a bike.',
        tone: 'text-destructive',
      }
    case 'cancelled':
      return {
        icon: XCircle,
        eyebrow: 'Reservation cancelled',
        title: 'Your reservation is not confirmed',
        body: 'This reservation is cancelled. If payment later succeeds, confirmation can still only happen from Stripe webhook processing.',
        tone: 'text-destructive',
      }
    case 'processing':
    default:
      return {
        icon: Clock,
        eyebrow: 'Payment processing',
        title: 'We are checking your payment',
        body: 'Stripe may still be notifying PedalGo. Your reservation is confirmed only after Stripe sends a successful webhook. Please check your email for the final confirmation.',
        tone: 'text-primary',
      }
  }
}

export default async function BookingSuccessPage({ searchParams }: BookingSuccessPageProps) {
  const params = await searchParams
  const sessionId = firstParam(params.session_id)
  const result = await getBookingStatusByCheckoutSession(sessionId, db)

  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <FlowHeader />
      <main className="flex-1 px-4 py-12">
        <section className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          {result.status === 'found' ? (
            <SuccessStatus summary={result.summary} />
          ) : (
            <LookupMessage message={result.message} />
          )}
        </section>
      </main>
    </div>
  )
}

function SuccessStatus({ summary }: { summary: PublicBookingStatusSummary }) {
  const copy = statusCopy(summary)
  const Icon = copy.icon

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${copy.tone}`}>
          <Icon className="size-5" aria-hidden="true" />
          {copy.eyebrow}
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.body}</p>
      </div>

      <dl className="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm md:grid-cols-2">
        <StatusRow label="Reservation" value={summary.reservationReference} />
        <StatusRow label="Reservation status" value={summary.reservationStatus} />
        <StatusRow label="Payment status" value={summary.paymentStatus ?? 'pending'} />
        <StatusRow label="Total paid" value={formatCurrency(summary.amountUsdCents / 100)} />
        <StatusRow label="Rental" value={formatDuration(summary.rentalDays)} />
        <StatusRow label="Pickup" value={formatDateTime(summary.pickupAt)} />
        <StatusRow label="Return" value={formatDateTime(summary.returnAt)} />
      </dl>

      <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
        Visiting this page does not confirm a reservation. PedalGo confirms bookings only after receiving Stripe&apos;s verified payment webhook.
      </p>
    </div>
  )
}

function LookupMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="size-5" aria-hidden="true" />
        <p className="text-sm font-semibold uppercase tracking-wide">Status unavailable</p>
      </div>
      <h1 className="font-heading text-3xl font-bold tracking-tight">We could not load your checkout status</h1>
      <p className="text-muted-foreground">{message}</p>
      <Link href="/" className={buttonVariants({ className: 'w-fit' })}>Start a new booking</Link>
    </div>
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
