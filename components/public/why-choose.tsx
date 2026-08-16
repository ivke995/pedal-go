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
    title: 'Free hotel delivery',
    description: 'Start the day at your door. We deliver and pick up in the local area.',
  },
  {
    icon: ShieldCheck,
    title: 'A local point of view',
    description: 'Ride the scenic roads, quiet lanes, and town paths we love most.',
  },
  {
    icon: Wrench,
    title: 'Ready-to-ride bikes',
    description: 'Our city bikes are comfortable, dependable, and safety-checked.',
  },
  {
    icon: Clock,
    title: 'Simple reservations',
    description: 'Choose your dates, select a payment method, and get clear next steps.',
  },
  {
    icon: HeartHandshake,
    title: 'More time outside',
    description: 'Less logistics. More fresh air, mountain views, and miles of exploring.',
  },
]

export function WhyChoose() {
  return (
    <section className="bg-[var(--wm-navy)] py-24 text-white sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--wm-gold)]">
            Why ride with us
          </p>
          <h2 className="font-display text-5xl font-bold uppercase leading-none tracking-tight text-balance sm:text-6xl">
            Made for mountain days
          </h2>
          <p className="max-w-2xl text-white/65 text-pretty">
            A better way to experience the White Mountains starts with a bike
            that is ready when you are.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="flex items-start gap-4 rounded-2xl border border-white/12 bg-white/8 p-6 shadow-sm"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--wm-olive)] text-white">
                <benefit.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-2xl font-semibold uppercase text-white">
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/65 text-pretty">
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
