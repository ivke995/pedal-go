'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/pricing'
import type { BikeType } from '@/lib/types'

interface BikeCardProps {
  bike: BikeType
  onSelect?: () => void
}

export function BikeCard({ bike, onSelect }: BikeCardProps) {
  return (
    <Card className="overflow-hidden pt-0">
      <div className="relative aspect-[4/3] w-full bg-[var(--wm-blue)]/30">
        <Image
          src={bike.image || '/placeholder.svg'}
          alt={`${bike.name} — side profile`}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
          <CardTitle className="font-display text-3xl uppercase">{bike.name}</CardTitle>
            <CardDescription className="text-pretty">
              {bike.description}
            </CardDescription>
          </div>
          <div className="shrink-0 text-right">
             <p className="font-display text-3xl font-bold text-[var(--wm-forest)]">
              {formatCurrency(bike.dailyRate)}
            </p>
            <p className="text-xs text-muted-foreground">per day</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {bike.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-foreground"
            >
               <span className="flex size-5 items-center justify-center rounded-full bg-[var(--wm-forest)]/10 text-[var(--wm-forest)]">
                <Check className="size-3" aria-hidden="true" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button size="lg" className="w-full bg-[var(--wm-forest)] hover:bg-[var(--wm-navy)]" onClick={onSelect}>
          Check Availability
        </Button>
      </CardFooter>
    </Card>
  )
}
