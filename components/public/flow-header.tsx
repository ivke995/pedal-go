import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

export function FlowHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo />
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Secure booking
        </div>
      </div>
    </header>
  )
}
