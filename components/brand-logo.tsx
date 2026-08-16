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
            'font-display text-lg font-bold uppercase tracking-[0.04em] sm:text-xl',
            variant === 'onDark' ? 'text-sidebar-foreground' : 'text-foreground',
          )}
        >
          White Mountains
        </span>
        <span
          className={cn(
            'text-[0.62rem] font-semibold uppercase tracking-[0.2em]',
            variant === 'onDark'
              ? 'text-sidebar-foreground/60'
              : 'text-muted-foreground',
          )}
        >
          {subtitle ?? 'Bike Rentals'}
        </span>
      </span>
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} className="inline-flex" aria-label="White Mountains Bike Rentals home">
      {content}
    </Link>
  )
}
