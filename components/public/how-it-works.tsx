import { CalendarDays, CreditCard, Bike } from 'lucide-react'
import { FeatureCard } from '@/components/public/feature-card'

const STEPS = [
  {
    icon: CalendarDays,
    title: 'Choose Your Dates',
    description:
      'Select your pickup and return date and time, then check availability instantly.',
  },
  {
    icon: CreditCard,
    title: 'Pay Online',
    description:
      'Confirm your details and pay securely online. No queues, no paperwork.',
  },
  {
    icon: Bike,
    title: 'Pick Up Your Bike',
    description:
      'Show your reservation number at our shop and hit the road on a freshly serviced bike.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
            Three simple steps to your ride
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <FeatureCard
              key={step.title}
              icon={step.icon}
              title={step.title}
              description={step.description}
              step={i + 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
