'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { CalendarClock, CalendarCheck, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateTimeField } from '@/components/date-time-field'
import { AvailabilityResult } from '@/components/public/availability-result'
import { checkFeaturedBikeAvailability } from '@/app/actions/check-featured-bike-availability'
import type {
  AvailabilityQuoteFieldErrors,
  AvailabilityQuoteResult,
} from '@/lib/public-booking/availability'

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function BookingSearchForm() {
  const [pickup, setPickup] = useState('')
  const [returnAt, setReturnAt] = useState('')
  const [errors, setErrors] = useState<AvailabilityQuoteFieldErrors>({})
  const [result, setResult] = useState<AvailabilityQuoteResult | null>(null)
  const [minPickup, setMinPickup] = useState<string | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  // Prefill sensible defaults after mount to avoid hydration mismatch.
  useEffect(() => {
    const now = new Date()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinPickup(toLocalInput(now))
    const start = new Date(now)
    start.setDate(start.getDate() + 1)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 2)
    setPickup(toLocalInput(start))
    setReturnAt(toLocalInput(end))
  }, [])

  // Live validation: return must be after pickup.
  const returnError = useMemo(() => {
    if (!pickup || !returnAt) return undefined
    if (new Date(returnAt).getTime() <= new Date(pickup).getTime()) {
      return 'Return date and time must be after the pickup.'
    }
    return undefined
  }, [pickup, returnAt])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: AvailabilityQuoteFieldErrors = {}
    if (!pickup) nextErrors.pickupAt = 'Please choose a pickup date and time.'
    if (!returnAt) nextErrors.returnAt = 'Please choose a return date and time.'
    if (returnError) nextErrors.returnAt = returnError
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setResult(null)
      return
    }

    startTransition(async () => {
      const availability = await checkFeaturedBikeAvailability({
        pickupAt: pickup,
        returnAt,
      })

      if (availability.status === 'error') {
        setErrors(availability.fieldErrors)
      } else {
        setErrors({})
      }

      setResult(availability)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <DateTimeField
          label="Pickup date & time"
          value={pickup}
          min={minPickup}
          onChange={(v) => {
            setPickup(v)
            setErrors((prev) => ({ ...prev, pickupAt: undefined }))
          }}
          error={errors.pickupAt}
          icon={<CalendarClock className="size-4 text-primary" />}
        />
        <DateTimeField
          label="Return date & time"
          value={returnAt}
          min={pickup || minPickup}
          onChange={(v) => {
            setReturnAt(v)
            setErrors((prev) => ({ ...prev, returnAt: undefined }))
          }}
          error={errors.returnAt ?? returnError}
          icon={<CalendarCheck className="size-4 text-primary" />}
        />
        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          disabled={isPending}
        >
          <Search data-icon="inline-start" />
          {isPending ? 'Checking…' : 'Check Availability'}
        </Button>
      </form>

      {result?.status === 'error' ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {result.message}
        </p>
      ) : null}

      {result?.status === 'available' || result?.status === 'unavailable' ? (
        <AvailabilityResult result={result} />
      ) : null}
    </div>
  )
}
