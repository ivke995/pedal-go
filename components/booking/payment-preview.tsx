'use client'

import { useState } from 'react'
import { Lock, ChevronLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/pricing'
import type { BookingDraft } from '@/lib/types'
import type { CustomerDetails } from '@/components/booking/customer-details-form'

interface PaymentPreviewProps {
  draft: BookingDraft
  customer: CustomerDetails
  onBack: () => void
  onPay: () => void
}

export function PaymentPreview({
  draft,
  customer,
  onBack,
  onPay,
}: PaymentPreviewProps) {
  const [processing, setProcessing] = useState(false)

  function handlePay() {
    setProcessing(true)
    // Frontend-only: simulate a redirect to a hosted checkout page.
    window.setTimeout(() => {
      onPay()
    }, 1200)
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
          <Lock className="size-4" aria-hidden="true" />
          <p className="font-heading text-base font-semibold">
            Secure checkout
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your order below and confirm your payment.
        </p>

        <dl className="mt-4 flex flex-col gap-2.5">
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
          onClick={handlePay}
          disabled={processing}
        >
          {processing ? (
            <>
              <Spinner data-icon="inline-start" />
              Processing…
            </>
          ) : (
            <>
              <Lock data-icon="inline-start" />
              {`Pay ${formatCurrency(draft.total)}`}
            </>
          )}
        </Button>
      </div>

      <Alert>
        <Info />
        <AlertTitle>This is a preview</AlertTitle>
        <AlertDescription>
          In production, this step redirects to a secure hosted checkout page
          (e.g. Stripe Checkout). No card details are collected here.
        </AlertDescription>
      </Alert>
    </div>
  )
}
