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
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {step ? (
          <span className="font-heading text-sm font-bold text-muted-foreground">
            {`Step ${step}`}
          </span>
        ) : null}
      </div>
      <h3 className="font-heading text-lg font-semibold text-foreground text-balance">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
        {description}
      </p>
    </div>
  )
}
