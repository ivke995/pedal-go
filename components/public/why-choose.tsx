import {
  Zap,
  ShieldCheck,
  Wrench,
  Clock,
  HeartHandshake,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: Zap,
    title: 'Fast online booking',
    description: 'Reserve your bike in under two minutes, any time of day.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure payment',
    description: 'Your payment is processed through trusted, encrypted checkout.',
  },
  {
    icon: Wrench,
    title: 'Well-maintained bicycles',
    description: 'Every bike is regularly serviced and safety-checked.',
  },
  {
    icon: Clock,
    title: 'Flexible pickup times',
    description: 'Choose a pickup window that fits your plans, not ours.',
  },
  {
    icon: HeartHandshake,
    title: 'Friendly local support',
    description: 'Real people, ready to help you plan the perfect ride.',
  },
]

export function WhyChoose() {
  return (
    <section className="bg-secondary/40 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Why PedalGo
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
            Everything you need for a great ride
          </h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <benefit.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
