import Image from 'next/image'
import { ShieldCheck, Clock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingSearchForm } from '@/components/public/booking-search-form'

const TRUST = [
  { icon: Sparkles, label: 'Instant online booking' },
  { icon: ShieldCheck, label: 'Secure payment' },
  { icon: Clock, label: 'Flexible pickup times' },
]

export function HeroSection() {
  return (
    <section
      id="home"
      className="scroll-mt-20 border-b border-border bg-gradient-to-b from-secondary/50 to-background"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-20 lg:px-8">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Explore the city on two wheels
          </span>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
            Rent a Bike in Just a Few Clicks
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">
            Select your dates, pay online, and pick up your bike. No account
            needed — just choose when you want to ride and you&apos;re ready to
            roll.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {TRUST.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <item.icon className="size-4 text-primary" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>

          <div className="relative mt-2 hidden overflow-hidden rounded-3xl border border-border lg:block">
            <Image
              src="/images/hero-bike.png"
              alt="A mint-green PedalGo city bike leaning against a wall on a sunny day"
              width={640}
              height={420}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        </div>

        <Card className="shadow-lg lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              Check availability
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pick your rental window to see live pricing.
            </p>
          </CardHeader>
          <CardContent>
            <BookingSearchForm />
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-3xl border border-border lg:hidden">
          <Image
            src="/images/hero-bike.png"
            alt="A mint-green PedalGo city bike leaning against a wall on a sunny day"
            width={640}
            height={420}
            className="h-auto w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
