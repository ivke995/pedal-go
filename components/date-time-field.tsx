'use client'

import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'

interface DateTimeFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  error?: string
  icon?: React.ReactNode
}

export function DateTimeField({
  label,
  value,
  onChange,
  min,
  error,
  icon,
}: DateTimeFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id} className="flex items-center gap-1.5">
        {icon}
        {label}
      </FieldLabel>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11"
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  )
}
