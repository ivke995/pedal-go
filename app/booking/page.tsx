import { Suspense } from 'react'
import { FlowHeader } from '@/components/public/flow-header'
import { BookingFlow } from '@/components/booking/booking-flow'

export default function BookingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <FlowHeader />
      <main className="flex-1">
        <Suspense fallback={<BookingFallback />}>
          <BookingFlow />
        </Suspense>
      </main>
    </div>
  )
}

function BookingFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center text-muted-foreground">
      Loading your booking…
    </div>
  )
}
