import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  step?: number
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  step,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--wm-forest)] text-white">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {step ? (
            <span className="font-display text-2xl font-semibold uppercase tracking-wide text-[var(--wm-gold)]">
              {`0${step}`}
          </span>
        ) : null}
      </div>
      <h3 className="font-display text-3xl font-semibold uppercase leading-none text-[var(--wm-navy)] text-balance">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
        {description}
      </p>
    </div>
  )
}
