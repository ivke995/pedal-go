'use client'

import { useState } from 'react'
import { Lock, ChevronLeft, Info, CheckCircle2 } from 'lucide-react'
import { createCheckoutSessionAction } from '@/app/actions/create-checkout-session'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/pricing'
import type { BookingDraft } from '@/lib/types'
import type { CustomerDetails } from '@/components/booking/customer-details-form'
import type { PendingReservationSummary } from '@/lib/public-booking/reservations'

interface PaymentPreviewProps {
  draft: BookingDraft
  customer: CustomerDetails
  reservation: PendingReservationSummary
  onBack: () => void
}

export function PaymentPreview({
  draft,
  customer,
  reservation,
  onBack,
}: PaymentPreviewProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  async function handleCheckout() {
    setIsRedirecting(true)
    setCheckoutError(null)

    const result = await createCheckoutSessionAction({
      reservationId: reservation.id,
    })

    if (result.status === 'error') {
      setCheckoutError(result.message)
      setIsRedirecting(false)
      return
    }

    window.location.assign(result.checkoutUrl)
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to details
      </button>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <p className="font-heading text-base font-semibold">
            Reservation held
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Your reservation has been created and is pending payment.
        </p>

        <dl className="mt-4 flex flex-col gap-2.5">
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Reservation</dt>
            <dd className="text-right font-medium">{reservation.reference}</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Rental</dt>
            <dd className="text-right font-medium">PedalGo City Bike</dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Period</dt>
            <dd className="text-right font-medium">
              {formatDuration(draft.days)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Pickup</dt>
            <dd className="text-right font-medium">
              {formatDateTime(draft.pickupAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Return</dt>
            <dd className="text-right font-medium">
              {formatDateTime(draft.returnAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="text-right font-medium break-all">
              {customer.email}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Hold expires</dt>
            <dd className="text-right font-medium">
              {formatDateTime(reservation.holdExpiresAt)}
            </dd>
          </div>
          <Separator className="my-1" />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-heading font-semibold">Total amount</dt>
            <dd className="font-heading text-2xl font-bold text-primary">
              {formatCurrency(draft.total)}
            </dd>
          </div>
        </dl>

        <Button
          size="lg"
          className="mt-5 w-full"
          disabled={isRedirecting}
          onClick={handleCheckout}
        >
          <Lock data-icon="inline-start" />
          {isRedirecting ? 'Redirecting to Stripe…' : `Pay with Stripe (${formatCurrency(draft.total)})`}
        </Button>
        {checkoutError ? (
          <p className="mt-3 text-sm font-medium text-destructive" role="alert">
            {checkoutError}
          </p>
        ) : null}
      </div>

      <Alert>
        <Info />
        <AlertTitle>Secure Stripe Checkout</AlertTitle>
        <AlertDescription>
          You will be redirected to Stripe to complete payment. Your
          reservation is confirmed only after Stripe reports a successful
          payment.
        </AlertDescription>
      </Alert>
    </div>
  )
}
