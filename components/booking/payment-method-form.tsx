'use client'

import { useState } from 'react'
import { ChevronLeft, CircleDollarSign } from 'lucide-react'
import { createPendingReservationAction } from '@/app/actions/create-pending-reservation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { formatCurrency } from '@/lib/pricing'
import type { BookingDraft, PaymentMethod } from '@/lib/types'
import type {
  PendingReservationFieldErrors,
  PendingReservationSummary,
} from '@/lib/public-booking/reservations'
import type { CustomerDetails } from '@/components/booking/customer-details-form'

interface PaymentMethodFormProps {
  draft: BookingDraft
  customer: CustomerDetails
  onBack: () => void
  onSuccess: (reservation: PendingReservationSummary, message?: string) => void
}

const paymentOptions: Array<{
  value: PaymentMethod
  label: string
  description: string
}> = [
  {
    value: 'venmo',
    label: 'Venmo',
    description: 'Receive Venmo instructions after submitting your request.',
  },
  {
    value: 'zelle',
    label: 'Zelle',
    description: 'Receive Zelle instructions after submitting your request.',
  },
]

export function PaymentMethodForm({
  draft,
  customer,
  onBack,
  onSuccess,
}: PaymentMethodFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<PendingReservationFieldErrors>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!paymentMethod) {
      setFieldErrors({ paymentMethod: 'Please choose Venmo or Zelle.' })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createPendingReservationAction({
        ...customer,
        pickupAt: draft.pickupAt,
        returnAt: draft.returnAt,
        paymentMethod,
      })

      if (result.status === 'created') {
        onSuccess(result.reservation)
        return
      }

      if (result.status === 'notification_error') {
        onSuccess(result.reservation, result.message)
        return
      }

      setError(result.message)
      if (result.status === 'error') {
        setFieldErrors(result.fieldErrors)
      }
    } catch {
      setError('We could not submit your reservation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        disabled={isSubmitting}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to details
      </button>

      <div>
        <h2 className="font-heading text-xl font-semibold">Choose how you will pay</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your reservation stays pending until the rental team manually confirms the external payment.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>We could not complete that request</AlertTitle>
          <AlertDescription>{error} You can review your selection and try again.</AlertDescription>
        </Alert>
      ) : null}

      <Field
        role="radiogroup"
        aria-labelledby="payment-method-label"
        aria-describedby={fieldErrors.paymentMethod ? 'payment-method-error' : undefined}
        data-invalid={fieldErrors.paymentMethod ? true : undefined}
        className="gap-3"
      >
        <FieldLabel id="payment-method-label" className="text-base font-semibold">
          Payment method
        </FieldLabel>
        <FieldDescription>
          We will show only the selected method’s payment instructions after submission.
        </FieldDescription>
        <div className="grid gap-3 sm:grid-cols-2">
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className="flex min-h-28 cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/60 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={paymentMethod === option.value}
                disabled={isSubmitting}
                onChange={() => {
                  setPaymentMethod(option.value)
                  setFieldErrors((current) => ({ ...current, paymentMethod: undefined }))
                }}
                className="mt-1 size-4 accent-primary"
              />
              <span className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{option.label}</span>
                <span className="text-sm leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        {fieldErrors.paymentMethod ? (
          <FieldError id="payment-method-error">{fieldErrors.paymentMethod}</FieldError>
        ) : null}
      </Field>

      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <CircleDollarSign className="size-4 text-primary" aria-hidden="true" />
          Amount due: {formatCurrency(draft.total)}
        </div>
        <p className="mt-1 text-muted-foreground">
          This is a request to reserve your bike, not a payment confirmation.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting reservation…' : `Submit reservation · ${formatCurrency(draft.total)}`}
      </Button>
    </form>
  )
}
