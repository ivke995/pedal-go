'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingSummary } from '@/components/booking/booking-summary'
import {
  CustomerDetailsForm,
  type CustomerDetails,
} from '@/components/booking/customer-details-form'
import { PaymentPreview } from '@/components/booking/payment-preview'
import { calculateRentalDays, calculateTotal, DAILY_RATE } from '@/lib/pricing'
import type { BookingDraft } from '@/lib/types'

type Step = 'details' | 'payment'

function fallbackRange() {
  const start = new Date()
  start.setHours(start.getHours() + 2, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function BookingFlow() {
  const params = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)

  const draft = useMemo<BookingDraft>(() => {
    const fallback = fallbackRange()
    const pickupAt = params.get('pickup') ?? fallback.start
    const returnAt = params.get('return') ?? fallback.end
    const days = calculateRentalDays(new Date(pickupAt), new Date(returnAt))

    return {
      pickupAt,
      returnAt,
      days,
      dailyRate: DAILY_RATE,
      total: calculateTotal(days, DAILY_RATE),
    }
  }, [params])

  function handlePaymentComplete() {
    router.push('/')
  }

  function handleDetailsSubmit(details: CustomerDetails) {
    setCustomer(details)
    setStep('payment')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {step === 'details' ? 'Your details' : 'Review & pay'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step {step === 'details' ? '1' : '2'} of 2
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step === 'payment' ? setStep('details') : router.push('/'))}
        >
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          {step === 'details' ? (
            <CustomerDetailsForm
              defaultValues={customer ?? undefined}
              onSubmit={handleDetailsSubmit}
            />
          ) : (
            <PaymentPreview
              draft={draft}
              customer={customer!}
              onBack={() => setStep('details')}
              onPay={handlePaymentComplete}
            />
          )}
        </div>
        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-24">
            <BookingSummary draft={draft} />
          </div>
        </div>
      </div>
    </div>
  )
}
