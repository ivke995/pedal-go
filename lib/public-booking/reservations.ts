import { randomUUID } from 'node:crypto'

import { PAYMENT_METHODS, reservations, type PaymentMethod } from '@/lib/db/schema'
import { getBikeAvailability } from '@/lib/domain/availability'
import { CURRENT_DAILY_RATE_USD_CENTS, formatUsdCents, quoteRentalPrice } from '@/lib/domain/pricing'
import type { BookingDraft } from '@/lib/types'
import {
  buildReservationNotificationMessages,
  createResendReservationEmailSender,
  type ReservationEmailSender,
} from './confirmation-email'
import {
  FEATURED_BIKE_TYPE_ID,
  FEATURED_BIKE_DISPLAY_NAME,
  type AvailabilityQuoteInput,
  validateAvailabilityQuoteInput,
} from './availability'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HOLD_MINUTES = 30

export type CreatePendingReservationInput = AvailabilityQuoteInput & {
  fullName: string
  email: string
  phone: string
  paymentMethod?: string
}

export type PendingReservationFieldErrors = {
  pickupAt?: string
  returnAt?: string
  fullName?: string
  email?: string
  phone?: string
  paymentMethod?: string
}

export type ManualPaymentProfile = {
  fullName: string
  email: string
  phone: string
  handle?: string
}

export type ManualPaymentConfiguration = {
  venmo: ManualPaymentProfile & { handle: string }
  zelle: ManualPaymentProfile & { handle?: never }
  ownerNotificationEmail: string
  emailFrom: string
}

export type ManualPaymentInstructions = {
  method: PaymentMethod
  profile: ManualPaymentProfile
  recipient: string
  instructions: string
}

export type PendingReservationSummary = {
  id: string
  reference: string
  bikeTypeId: string
  bikeName: string
  bikeId: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupAt: string
  returnAt: string
  rentalDays: number
  dailyRateUsdCents: number
  totalUsdCents: number
  status: 'pending_verification'
  paymentMethod: PaymentMethod
  paymentInstructions: ManualPaymentInstructions
  holdExpiresAt: string
  draft: BookingDraft
}

export type CreatePendingReservationResult =
  | {
      status: 'created'
      reservation: PendingReservationSummary
    }
  | {
      status: 'unavailable'
      message: string
    }
  | {
      status: 'error'
      message: string
      fieldErrors: PendingReservationFieldErrors
    }
  | {
      status: 'notification_error'
      message: string
      reservation: PendingReservationSummary
    }

type ReservationDatabase = Parameters<typeof getBikeAvailability>[1] & {
  insert: (table: typeof reservations) => {
    values: (row: typeof reservations.$inferInsert) => {
      returning: () => Promise<(typeof reservations.$inferSelect)[]>
    }
  }
}

type CreatePendingReservationOptions = {
  now?: Date
  idFactory?: () => string
  referenceFactory?: (now: Date) => string
  paymentConfig?: ManualPaymentConfiguration
  emailSender?: ReservationEmailSender
}

function getRequiredConfiguration(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`)
  }

  return value
}

export function getManualPaymentConfiguration(): ManualPaymentConfiguration {
  return {
    venmo: {
      fullName: getRequiredConfiguration('VENMO_NAME'),
      handle: getRequiredConfiguration('VENMO_HANDLE'),
      email: getRequiredConfiguration('VENMO_EMAIL'),
      phone: getRequiredConfiguration('VENMO_PHONE'),
    },
    zelle: {
      fullName: getRequiredConfiguration('ZELLE_NAME'),
      email: getRequiredConfiguration('ZELLE_EMAIL'),
      phone: getRequiredConfiguration('ZELLE_PHONE'),
    },
    ownerNotificationEmail: getRequiredConfiguration('OWNER_NOTIFICATION_EMAIL'),
    emailFrom: getRequiredConfiguration('EMAIL_FROM'),
  }
}

function validateManualPaymentConfiguration(configuration: ManualPaymentConfiguration): void {
  const profiles = [configuration.venmo, configuration.zelle]

  for (const profile of profiles) {
    if (!profile || !profile.fullName.trim() || !EMAIL_RE.test(profile.email.trim()) || !profile.phone.trim()) {
      throw new Error('Manual payment profile configuration is incomplete.')
    }
  }

  if (!configuration.venmo.handle?.trim()) {
    throw new Error('Manual payment profile configuration is incomplete.')
  }
}

function isPaymentMethod(value: string | undefined): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod)
}

function getPaymentInstructions(
  paymentMethod: PaymentMethod,
  totalUsdCents: number,
  reference: string,
  configuration: ManualPaymentConfiguration,
): ManualPaymentInstructions {
  const amount = formatUsdCents(totalUsdCents)
  const profile = paymentMethod === 'venmo' ? configuration.venmo : configuration.zelle
  const recipient = paymentMethod === 'venmo' ? configuration.venmo.handle : configuration.zelle.email
  const methodLabel = paymentMethod === 'venmo' ? 'Venmo' : 'Zelle'

  return {
    method: paymentMethod,
    profile,
    recipient,
    instructions: `Send ${amount} via ${methodLabel} to ${recipient}. Include reservation ${reference} in the payment note. Payment remains pending manual confirmation until the owner verifies the transaction.`,
  }
}

function validateCustomerDetails(input: CreatePendingReservationInput): PendingReservationFieldErrors {
  const fieldErrors: PendingReservationFieldErrors = {}

  if (input.fullName.trim().length < 2) {
    fieldErrors.fullName = 'Please enter your full name.'
  }

  if (!EMAIL_RE.test(input.email.trim())) {
    fieldErrors.email = 'Please enter a valid email address.'
  }

  if (input.phone.trim().replace(/[^\d]/g, '').length < 6) {
    fieldErrors.phone = 'Please enter a valid phone number.'
  }

  if (!isPaymentMethod(input.paymentMethod)) {
    fieldErrors.paymentMethod = 'Please choose Venmo or Zelle.'
  }

  return fieldErrors
}

function generateReservationReference(now: Date): string {
  const datePart = now.toISOString().slice(0, 10).replaceAll('-', '')
  const randomPart = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()

  return `PG-${datePart}-${randomPart}`
}

function toPublicSummary(
  row: typeof reservations.$inferSelect,
  bikeName: string,
  holdExpiresAt: Date,
  paymentInstructions: ManualPaymentInstructions,
): PendingReservationSummary {
  return {
    id: row.id,
    reference: row.reference,
    bikeTypeId: row.bikeTypeId,
    bikeName,
    bikeId: row.bikeId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    pickupAt: row.pickupAt.toISOString(),
    returnAt: row.returnAt.toISOString(),
    rentalDays: row.rentalDays,
    dailyRateUsdCents: row.dailyRateUsdCents,
    totalUsdCents: row.totalUsdCents,
    status: 'pending_verification',
    paymentMethod: paymentInstructions.method,
    paymentInstructions,
    holdExpiresAt: holdExpiresAt.toISOString(),
    draft: {
      pickupAt: row.pickupAt.toISOString(),
      returnAt: row.returnAt.toISOString(),
      days: row.rentalDays,
      dailyRate: row.dailyRateUsdCents / 100,
      total: row.totalUsdCents / 100,
    },
  }
}

export async function createPendingReservation(
  input: CreatePendingReservationInput,
  database: ReservationDatabase,
  options: CreatePendingReservationOptions = {},
): Promise<CreatePendingReservationResult> {
  const dateValidation = validateAvailabilityQuoteInput(input)
  const customerFieldErrors = validateCustomerDetails(input)

  if (!dateValidation.ok || Object.keys(customerFieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Please fix the highlighted fields before continuing.',
      fieldErrors: {
        ...(!dateValidation.ok ? dateValidation.fieldErrors : {}),
        ...customerFieldErrors,
      },
    }
  }

  let paymentConfiguration: ManualPaymentConfiguration
  let emailSender: ReservationEmailSender

  try {
    paymentConfiguration = options.paymentConfig ?? getManualPaymentConfiguration()
    validateManualPaymentConfiguration(paymentConfiguration)
    emailSender = options.emailSender ?? createResendReservationEmailSender()
  } catch (error) {
    console.error('Manual payment reservation configuration is incomplete', error)

    return {
      status: 'error',
      message: 'Manual payment reservations are not configured yet. Please contact the rental team.',
      fieldErrors: {},
    }
  }

  const availability = await getBikeAvailability(
    {
      bikeTypeId: FEATURED_BIKE_TYPE_ID,
      pickupAt: dateValidation.pickupAt,
      returnAt: dateValidation.returnAt,
    },
    database,
  )

  if (!availability.bikeType || !availability.isAvailable) {
    return {
      status: 'unavailable',
       message: 'No city bikes are available for the selected dates. Please choose another time.',
    }
  }

  const quote = quoteRentalPrice(
    dateValidation.pickupAt,
    dateValidation.returnAt,
    CURRENT_DAILY_RATE_USD_CENTS,
  )
  const now = options.now ?? new Date()
  const paymentMethod = input.paymentMethod as PaymentMethod
  const holdExpiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000)
  const selectedBike = availability.availableBikes[0] ?? null
  const [created] = await database
    .insert(reservations)
    .values({
      id: options.idFactory?.() ?? randomUUID(),
      reference: options.referenceFactory?.(now) ?? generateReservationReference(now),
      bikeTypeId: availability.bikeType.id,
      bikeId: selectedBike?.id ?? null,
      customerName: input.fullName.trim(),
      customerEmail: input.email.trim().toLowerCase(),
      customerPhone: input.phone.trim(),
      pickupAt: dateValidation.pickupAt,
      returnAt: dateValidation.returnAt,
      rentalDays: quote.rentalDays,
      dailyRateUsdCents: quote.dailyRateUsdCents,
      totalUsdCents: quote.totalUsdCents,
      status: 'pending_verification',
      paymentMethod,
      notes: JSON.stringify({
        source: 'public_booking',
        holdStrategy: selectedBike ? 'assigned_bike' : 'capacity_hold',
        holdExpiresAt: holdExpiresAt.toISOString(),
      }),
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  const paymentInstructions = getPaymentInstructions(
    paymentMethod,
    created.totalUsdCents,
    created.reference,
    paymentConfiguration,
  )
  const reservation = toPublicSummary(
    created,
     FEATURED_BIKE_DISPLAY_NAME,
    holdExpiresAt,
    paymentInstructions,
  )
  const messages = buildReservationNotificationMessages(
    reservation,
    paymentInstructions,
    paymentConfiguration,
  )

  try {
    await Promise.all([emailSender(messages.customer), emailSender(messages.owner)])
  } catch (error) {
    console.error('Unable to send manual payment reservation notifications', error)

    return {
      status: 'notification_error',
      message:
        'Your reservation was received and remains pending manual confirmation, but the notification emails could not be sent. Please contact the rental team with your reservation reference.',
      reservation,
    }
  }

  return { status: 'created', reservation }
}
