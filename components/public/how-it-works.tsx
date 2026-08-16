import { CalendarDays, ClipboardCheck, Bike } from 'lucide-react'
import { FeatureCard } from '@/components/public/feature-card'

const STEPS = [
  {
    icon: CalendarDays,
    title: 'Choose Your Dates',
    description:
      'Select your pickup and return date and time, then check availability instantly.',
  },
  {
    icon: ClipboardCheck,
    title: 'Choose how to pay',
    description:
      'Choose Venmo or Zelle, then receive simple instructions for the exact rental total.',
  },
  {
    icon: Bike,
    title: 'Pick Up Your Bike',
    description:
      'We confirm your reservation manually, deliver to your hotel, and get you rolling.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-[var(--wm-offwhite)] py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--wm-forest)]">
              How it works
            </p>
          <h2 className="font-display text-5xl font-bold uppercase leading-none tracking-tight text-[var(--wm-navy)] text-balance sm:text-6xl">
            Adventure, made simple
          </h2>
          <p className="max-w-xl text-muted-foreground text-pretty">
            From first click to first turn, we keep the rental process easy so
            you can spend more time outside.
          </p>
        </div>
        <div className="relative mt-12 grid gap-6 md:grid-cols-3 md:gap-0">
          {STEPS.map((step, i) => (
            <FeatureCard
              key={step.title}
              icon={step.icon}
              title={step.title}
              description={step.description}
              step={i + 1}
              className="rounded-none border-y border-x-0 bg-transparent p-6 shadow-none first:border-l md:border-y-0 md:border-l md:first:border-l-0"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
