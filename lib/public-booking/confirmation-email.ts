import { Resend } from 'resend'

import { formatUsdCents } from '@/lib/domain/pricing'
import type {
  ManualPaymentConfiguration,
  ManualPaymentInstructions,
  PendingReservationSummary,
} from './reservations'

export type ReservationEmailMessage = {
  from: string
  to: string
  subject: string
  text: string
  html: string
}

export type ReservationEmailSender = (message: ReservationEmailMessage) => Promise<void>

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`)
  }

  return value
}

function formatBookingDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function methodLabel(instructions: ManualPaymentInstructions): string {
  return instructions.method === 'venmo' ? 'Venmo' : 'Zelle'
}

function buildRows(
  reservation: PendingReservationSummary,
  instructions: ManualPaymentInstructions,
): Array<[string, string]> {
  return [
    ['Reservation number', reservation.reference],
    ['Bike', reservation.bikeName],
    ['Pickup', formatBookingDateTime(new Date(reservation.pickupAt))],
    ['Return', formatBookingDateTime(new Date(reservation.returnAt))],
    ['Rental duration', `${reservation.rentalDays} day${reservation.rentalDays === 1 ? '' : 's'}`],
    ['Amount due', formatUsdCents(reservation.totalUsdCents)],
    ['Payment method', methodLabel(instructions)],
    ['Payment recipient', instructions.recipient],
    ['Account name', instructions.profile.fullName],
    ...(instructions.profile.handle ? [['Venmo handle', instructions.profile.handle] as [string, string]] : []),
    ['Payment email', instructions.profile.email],
    ['Payment phone', instructions.profile.phone],
    ['Payment instructions', instructions.instructions],
  ]
}

function buildText(
  greeting: string,
  reservation: PendingReservationSummary,
  instructions: ManualPaymentInstructions,
  includeCustomerDetails = false,
): string {
  const rows = buildRows(reservation, instructions)

  return [
    greeting,
    '',
    'Your White Mountains Bike Rentals reservation has been received.',
    'Payment pending manual confirmation: send the amount below using the selected payment method. Your reservation is not confirmed until the owner independently verifies the payment.',
    '',
    ...(includeCustomerDetails
      ? [
          `Customer: ${reservation.customerName}`,
          `Customer email: ${reservation.customerEmail}`,
          `Customer phone: ${reservation.customerPhone}`,
          '',
        ]
      : []),
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join('\n')
}

function buildHtml(
  greeting: string,
  reservation: PendingReservationSummary,
  instructions: ManualPaymentInstructions,
  includeCustomerDetails = false,
): string {
  const rows = buildRows(reservation, instructions)
    .map(([label, value]) => `<tr><th align="left" style="padding:6px 12px 6px 0;">${escapeHtml(label)}</th><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`)
    .join('')
  const customerRows = includeCustomerDetails
    ? `<p><strong>Customer</strong>: ${escapeHtml(reservation.customerName)}<br /><strong>Email</strong>: ${escapeHtml(reservation.customerEmail)}<br /><strong>Phone</strong>: ${escapeHtml(reservation.customerPhone)}</p>`
    : ''

  return `<p>${escapeHtml(greeting)}</p><p>Your White Mountains Bike Rentals reservation has been received.</p><p><strong>Payment pending manual confirmation:</strong> send the amount below using the selected payment method. Your reservation is not confirmed until the owner independently verifies the payment.</p>${customerRows}<table>${rows}</table>`
}

export function buildReservationNotificationMessages(
  reservation: PendingReservationSummary,
  instructions: ManualPaymentInstructions,
  configuration: Pick<ManualPaymentConfiguration, 'emailFrom' | 'ownerNotificationEmail'>,
): { customer: ReservationEmailMessage; owner: ReservationEmailMessage } {
  return {
    customer: {
      from: configuration.emailFrom,
      to: reservation.customerEmail,
      subject: `White Mountains reservation received: ${reservation.reference}`,
      text: buildText(`Hi ${reservation.customerName},`, reservation, instructions),
      html: buildHtml(`Hi ${reservation.customerName},`, reservation, instructions),
    },
    owner: {
      from: configuration.emailFrom,
      to: configuration.ownerNotificationEmail,
      subject: `New White Mountains reservation: ${reservation.reference}`,
      text: buildText('New reservation received.', reservation, instructions, true),
      html: buildHtml('New reservation received.', reservation, instructions, true),
    },
  }
}

export function createResendReservationEmailSender(): ReservationEmailSender {
  const resend = new Resend(getRequiredEnv('RESEND_API_KEY'))

  return async (message) => {
    const result = await resend.emails.send(message)

    if (result.error) {
      throw new Error(result.error.message)
    }
  }
}
