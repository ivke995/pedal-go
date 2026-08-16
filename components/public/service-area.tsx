import { ArrowRight, MapPin, Mountain, Route } from 'lucide-react'

const AREAS = [
  {
    icon: Mountain,
    title: 'Lincoln',
    description: 'Your home base for big views, river paths, and mountain-town miles.',
  },
  {
    icon: Route,
    title: 'Woodstock',
    description: 'A relaxed launch point for exploring the quieter side of the Whites.',
  },
  {
    icon: MapPin,
    title: 'Your hotel',
    description: 'Free delivery and pickup make the first and last mile easy.',
  },
]

export function ServiceArea() {
  return (
    <section id="area" className="scroll-mt-20 bg-[var(--wm-blue)]/35 py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--wm-forest)]">
            Local miles, big views
          </p>
          <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-none tracking-tight text-[var(--wm-navy)] text-balance sm:text-6xl">
            See more of the White Mountains.
          </h2>
          <p className="mt-5 max-w-lg text-muted-foreground text-pretty">
            Whether you are here for a weekend or a whole week, a bike gives
            you a fresh way to connect the places you came to see.
          </p>
          <a
            href="tel:603-348-1320"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--wm-forest)] underline decoration-[var(--wm-gold)] decoration-2 underline-offset-4 hover:text-[var(--wm-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wm-forest)]"
          >
            Talk with a local
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {AREAS.map((area) => (
            <article key={area.title} className="border-t-2 border-[var(--wm-forest)] pt-5">
              <area.icon className="size-7 text-[var(--wm-forest)]" aria-hidden="true" />
              <h3 className="mt-6 font-display text-3xl font-semibold uppercase text-[var(--wm-navy)]">
                {area.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                {area.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
