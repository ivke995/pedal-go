'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '@/components/ui/field'

export interface CustomerDetails {
  fullName: string
  email: string
  phone: string
}

interface CustomerDetailsFormProps {
  defaultValues?: Partial<CustomerDetails>
  onSubmit: (details: CustomerDetails) => void
}

interface Errors {
  fullName?: string
  email?: string
  phone?: string
  terms?: string
  privacy?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CustomerDetailsForm({
  defaultValues,
  onSubmit,
}: CustomerDetailsFormProps) {
  const [fullName, setFullName] = useState(defaultValues?.fullName ?? '')
  const [email, setEmail] = useState(defaultValues?.email ?? '')
  const [phone, setPhone] = useState(defaultValues?.phone ?? '')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function validate(): Errors {
    const next: Errors = {}
    if (fullName.trim().length < 2)
      next.fullName = 'Please enter your full name.'
    if (!EMAIL_RE.test(email.trim()))
      next.email = 'Please enter a valid email address.'
    if (phone.trim().replace(/[^\d]/g, '').length < 6)
      next.phone = 'Please enter a valid phone number.'
    if (!terms) next.terms = 'You must accept the terms and conditions.'
    if (!privacy) next.privacy = 'You must accept the privacy policy.'
    return next
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.fullName ? true : undefined}>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            value={fullName}
            autoComplete="name"
            placeholder="Jane Doe"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            onChange={(e) => {
              setFullName(e.target.value)
              setErrors((p) => ({ ...p, fullName: undefined }))
            }}
          />
          {errors.fullName ? (
            <FieldError id="fullName-error">{errors.fullName}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="jane@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((p) => ({ ...p, email: undefined }))
            }}
          />
          {errors.email ? (
            <FieldError id="email-error">{errors.email}</FieldError>
          ) : (
            <FieldDescription>
              Your reservation confirmation will be sent here.
            </FieldDescription>
          )}
        </Field>

        <Field data-invalid={errors.phone ? true : undefined}>
          <FieldLabel htmlFor="phone">Phone number</FieldLabel>
          <Input
            id="phone"
            type="tel"
            value={phone}
            autoComplete="tel"
            placeholder="+387 61 234 567"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            onChange={(e) => {
              setPhone(e.target.value)
              setErrors((p) => ({ ...p, phone: undefined }))
            }}
          />
          {errors.phone ? (
            <FieldError id="phone-error">{errors.phone}</FieldError>
          ) : null}
        </Field>

        <Field
          orientation="horizontal"
          data-invalid={errors.terms ? true : undefined}
          className="items-start"
        >
          <Checkbox
            id="terms"
            checked={terms}
            aria-invalid={errors.terms ? true : undefined}
            onCheckedChange={(v) => {
              setTerms(v === true)
              setErrors((p) => ({ ...p, terms: undefined }))
            }}
          />
          <FieldLabel htmlFor="terms" className="font-normal">
            I accept the terms and conditions of rental.
          </FieldLabel>
        </Field>
        {errors.terms ? (
          <FieldError className="-mt-2">{errors.terms}</FieldError>
        ) : null}

        <Field
          orientation="horizontal"
          data-invalid={errors.privacy ? true : undefined}
          className="items-start"
        >
          <Checkbox
            id="privacy"
            checked={privacy}
            aria-invalid={errors.privacy ? true : undefined}
            onCheckedChange={(v) => {
              setPrivacy(v === true)
              setErrors((p) => ({ ...p, privacy: undefined }))
            }}
          />
          <FieldLabel htmlFor="privacy" className="font-normal">
            I have read and agree to the privacy policy.
          </FieldLabel>
        </Field>
        {errors.privacy ? (
          <FieldError className="-mt-2">{errors.privacy}</FieldError>
        ) : null}

        <Button type="submit" size="lg" className="w-full">
          Continue to Payment
          <ArrowRight data-icon="inline-end" />
        </Button>
      </FieldGroup>
    </form>
  )
}
