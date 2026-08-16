import { CheckCircle2, ClipboardCheck, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDateTime, formatDuration } from '@/lib/pricing'
import type { CustomerDetails } from '@/components/booking/customer-details-form'
import type { PendingReservationSummary } from '@/lib/public-booking/reservations'

interface ReservationConfirmationProps {
  customer: CustomerDetails
  reservation: PendingReservationSummary
  notificationMessage?: string | null
}

export function ReservationConfirmation({
  customer,
  reservation,
  notificationMessage,
}: ReservationConfirmationProps) {
  const paymentMethod = reservation.paymentInstructions.method === 'venmo' ? 'Venmo' : 'Zelle'
  const total = formatCurrency(reservation.totalUsdCents / 100)

  return (
    <div className="flex flex-col gap-5">
      <Alert className="border-primary/30 bg-primary/5">
        <CheckCircle2 />
        <AlertTitle>Reservation received</AlertTitle>
        <AlertDescription>
          Payment pending manual confirmation. The rental team will review your {paymentMethod} payment before confirming the reservation.
        </AlertDescription>
      </Alert>

      {notificationMessage ? (
        <Alert variant="destructive">
          <Info />
          <AlertTitle>Keep this confirmation</AlertTitle>
          <AlertDescription>{notificationMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="confirmation-details-heading">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardCheck className="size-4" aria-hidden="true" />
          <h2 id="confirmation-details-heading" className="font-heading text-base font-semibold">
            Your reservation details
          </h2>
        </div>

        <dl className="mt-4 flex flex-col gap-2.5">
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Reservation reference</dt>
            <dd className="font-medium sm:text-right">{reservation.reference}</dd>
          </div>
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Bike</dt>
            <dd className="font-medium sm:text-right">{reservation.bikeName}</dd>
          </div>
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Rental period</dt>
            <dd className="font-medium sm:text-right">{formatDuration(reservation.rentalDays)}</dd>
          </div>
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Pickup</dt>
            <dd className="font-medium sm:text-right">{formatDateTime(reservation.pickupAt)}</dd>
          </div>
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Return</dt>
            <dd className="font-medium sm:text-right">{formatDateTime(reservation.returnAt)}</dd>
          </div>
          <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">Confirmation email</dt>
            <dd className="break-all font-medium sm:text-right">{customer.email}</dd>
          </div>
          <Separator className="my-1" />
          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-heading font-semibold">Amount due</dt>
            <dd className="font-heading text-2xl font-bold text-primary">{total}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5" aria-labelledby="payment-instructions-heading">
        <h2 id="payment-instructions-heading" className="font-heading text-lg font-semibold">
          Pay by {paymentMethod}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send the exact amount below and include your reservation reference in the payment note.
        </p>
        <p className="mt-4 break-words rounded-lg bg-background p-3 text-sm font-semibold">
          {reservation.paymentInstructions.recipient}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {reservation.paymentInstructions.instructions}
        </p>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Next step: keep this reference and wait for the rental team to manually confirm your payment.
        </p>
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Your bike is held until {formatDateTime(reservation.holdExpiresAt)} while the request is reviewed.
      </p>
    </div>
  )
}
