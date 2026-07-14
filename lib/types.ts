// Shared domain types for PedalGo. Designed so the app can later support
// multiple bicycle types and a real backend without reshaping the UI.

export type PaymentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'refunded'

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'refunded'

export type AvailabilityStatus =
  | 'available'
  | 'reserved'
  | 'rented'
  | 'maintenance'
  | 'inactive'

export interface Reservation {
  id: string
  reference: string
  customerName: string
  customerEmail: string
  customerPhone: string
  bikeType: string
  pickupAt: string // ISO string
  returnAt: string // ISO string
  days: number
  dailyRate: number
  total: number
  status: ReservationStatus
  createdAt: string
}

export interface BikeType {
  id: string
  name: string
  slug: string
  description: string
  dailyRate: number
  totalUnits: number
  availableUnits: number
  maintenanceUnits: number
  image: string
  features: string[]
}

export interface PhysicalBike {
  id: string
  code: string
  typeName: string
  status: AvailabilityStatus
  lastServiced: string
}

export interface AvailabilityBlock {
  id: string
  label: string
  status: AvailabilityStatus
  startDate: string
  endDate: string
  note?: string
}

export interface BookingDraft {
  pickupAt: string
  returnAt: string
  days: number
  dailyRate: number
  total: number
}
