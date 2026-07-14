import Link from 'next/link'
import { Bike } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  href?: string
  className?: string
  variant?: 'default' | 'onDark'
  subtitle?: string
}

export function BrandLogo({
  href = '/',
  className,
  variant = 'default',
  subtitle,
}: BrandLogoProps) {
  const content = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-xl',
          variant === 'onDark'
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'bg-primary text-primary-foreground',
        )}
      >
        <Bike className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading text-lg font-extrabold tracking-tight',
            variant === 'onDark' ? 'text-sidebar-foreground' : 'text-foreground',
          )}
        >
          PedalGo
        </span>
        {subtitle ? (
          <span
            className={cn(
              'text-[0.65rem] font-medium uppercase tracking-widest',
              variant === 'onDark'
                ? 'text-sidebar-foreground/60'
                : 'text-muted-foreground',
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} className="inline-flex" aria-label="PedalGo home">
      {content}
    </Link>
  )
}
