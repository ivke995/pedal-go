'use server'

import { db } from '@/lib/db/client'
import type {
  CreatePendingReservationInput,
  CreatePendingReservationResult,
} from '@/lib/public-booking/reservations'

export async function createPendingReservationAction(
  input: CreatePendingReservationInput,
): Promise<CreatePendingReservationResult> {
  try {
    const { createPendingReservation } = await import(
      '@/lib/public-booking/reservations'
    )

    return createPendingReservation(input, db)
  } catch (error) {
    console.error('Unable to create pending reservation', error)

    return {
      status: 'error',
      message:
        'Reservation creation is temporarily unavailable. Please try again in a moment.',
      fieldErrors: {},
    }
  }
}
