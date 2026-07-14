import { Resend } from 'resend'

import type { reservations } from '@/lib/db/schema'
import { formatUsdCents } from '@/lib/domain/pricing'

type ReservationRow = typeof reservations.$inferSelect

export type ConfirmationEmailMessage = {
  from: string
  to: string
  subject: string
  text: string
  html: string
}

export type ConfirmationEmailSender = (message: ConfirmationEmailMessage) => Promise<void>

type BookingContactDetails = {
  pickupLocation: string
  contactEmail: string
  contactPhone: string
  supportHours: string
  pickupInstructions: string
}

const DEFAULT_CONTACT_DETAILS: BookingContactDetails = {
  pickupLocation: 'PedalGo, Obala Kulina bana 12, Sarajevo',
  contactEmail: 'hello@pedalgo.example',
  contactPhone: '+387 33 000 000',
  supportHours: 'Mon–Sun · 08:00 – 20:00',
  pickupInstructions: 'Bring your reservation number and a valid photo ID. Look for the green PedalGo sign at the central riverside shop.',
}

function getEnvOrDefault(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}.`)
  }

  return value
}

function getContactDetails(): BookingContactDetails {
  return {
    pickupLocation: getEnvOrDefault('PEDALGO_PICKUP_LOCATION', DEFAULT_CONTACT_DETAILS.pickupLocation),
    contactEmail: getEnvOrDefault('PEDALGO_CONTACT_EMAIL', DEFAULT_CONTACT_DETAILS.contactEmail),
    contactPhone: getEnvOrDefault('PEDALGO_CONTACT_PHONE', DEFAULT_CONTACT_DETAILS.contactPhone),
    supportHours: getEnvOrDefault('PEDALGO_SUPPORT_HOURS', DEFAULT_CONTACT_DETAILS.supportHours),
    pickupInstructions: getEnvOrDefault('PEDALGO_PICKUP_INSTRUCTIONS', DEFAULT_CONTACT_DETAILS.pickupInstructions),
  }
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

export function buildConfirmationEmailMessage(reservation: ReservationRow): ConfirmationEmailMessage {
  const contact = getContactDetails()
  const totalPaid = formatUsdCents(reservation.totalUsdCents)
  const pickupAt = formatBookingDateTime(reservation.pickupAt)
  const returnAt = formatBookingDateTime(reservation.returnAt)
  const subject = `PedalGo reservation confirmed: ${reservation.reference}`
  const from = getEnvOrDefault('RESEND_FROM_EMAIL', 'PedalGo <bookings@pedalgo.example>')

  const text = [
    `Hi ${reservation.customerName},`,
    '',
    'Your PedalGo bike rental is confirmed.',
    '',
    `Reservation number: ${reservation.reference}`,
    `Pickup: ${pickupAt}`,
    `Return: ${returnAt}`,
    `Total paid: ${totalPaid}`,
    '',
    `Pickup location: ${contact.pickupLocation}`,
    `Contact: ${contact.contactEmail} · ${contact.contactPhone}`,
    `Support hours: ${contact.supportHours}`,
    '',
    `Pickup instructions: ${contact.pickupInstructions}`,
    '',
    'Thank you for booking with PedalGo.',
  ].join('\n')

  const rows = [
    ['Reservation number', reservation.reference],
    ['Pickup', pickupAt],
    ['Return', returnAt],
    ['Total paid', totalPaid],
    ['Pickup location', contact.pickupLocation],
    ['Contact information', `${contact.contactEmail} · ${contact.contactPhone}`],
    ['Support hours', contact.supportHours],
    ['Pickup instructions', contact.pickupInstructions],
  ]

  const htmlRows = rows
    .map(([label, value]) => `<tr><th align="left" style="padding:6px 12px 6px 0;">${escapeHtml(label)}</th><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`)
    .join('')

  return {
    from,
    to: reservation.customerEmail,
    subject,
    text,
    html: `<p>Hi ${escapeHtml(reservation.customerName)},</p><p>Your PedalGo bike rental is confirmed.</p><table>${htmlRows}</table><p>Thank you for booking with PedalGo.</p>`,
  }
}

export function createResendConfirmationEmailSender(): ConfirmationEmailSender {
  const resend = new Resend(getRequiredEnv('RESEND_API_KEY'))

  return async (message) => {
    const result = await resend.emails.send(message)

    if (result.error) {
      throw new Error(result.error.message)
    }
  }
}
