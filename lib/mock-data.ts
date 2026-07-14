import type {
  AvailabilityBlock,
  BikeType,
  PhysicalBike,
  Reservation,
} from '@/lib/types'
import { DAILY_RATE } from '@/lib/pricing'

export const cityBike: BikeType = {
  id: 'bt_city',
  name: 'PedalGo City Bike',
  slug: 'city-bike',
  description:
    'A comfortable, easy-riding city bike perfect for exploring town, the riverside, and everything in between.',
  dailyRate: DAILY_RATE,
  totalUnits: 5,
  availableUnits: 4,
  maintenanceUnits: 1,
  image: '/images/city-bike.png',
  features: [
    'Comfortable city riding',
    'Adjustable seat',
    'Lock included',
    'Regularly maintained',
  ],
}

// Placeholder for future expansion. Not shown in the booking form yet.
export const futureBikeTypes = [
  'City bikes',
  'Mountain bikes',
  'Road bikes',
  'Electric bikes',
  'Kids bikes',
]

export const physicalBikes: PhysicalBike[] = [
  { id: 'b1', code: 'CITY-001', typeName: 'PedalGo City Bike', status: 'available', lastServiced: '2026-06-28' },
  { id: 'b2', code: 'CITY-002', typeName: 'PedalGo City Bike', status: 'available', lastServiced: '2026-06-30' },
  { id: 'b3', code: 'CITY-003', typeName: 'PedalGo City Bike', status: 'rented', lastServiced: '2026-06-15' },
  { id: 'b4', code: 'CITY-004', typeName: 'PedalGo City Bike', status: 'available', lastServiced: '2026-07-02' },
  { id: 'b5', code: 'CITY-005', typeName: 'PedalGo City Bike', status: 'maintenance', lastServiced: '2026-05-20' },
]

export const reservations: Reservation[] = [
  {
    id: 'r1',
    reference: 'PG-2026-00042',
    customerName: 'Amila Hodžić',
    customerEmail: 'amila.h@example.com',
    customerPhone: '+387 61 234 567',
    bikeType: 'PedalGo City Bike',
    pickupAt: '2026-07-15T09:00:00',
    returnAt: '2026-07-17T09:00:00',
    days: 2,
    dailyRate: 30,
    total: 60,
    status: 'confirmed',
    createdAt: '2026-07-12T14:22:00',
  },
  {
    id: 'r2',
    reference: 'PG-2026-00041',
    customerName: 'Marco Rossi',
    customerEmail: 'marco.rossi@example.com',
    customerPhone: '+39 340 118 220',
    bikeType: 'PedalGo City Bike',
    pickupAt: '2026-07-14T10:00:00',
    returnAt: '2026-07-15T10:00:00',
    days: 1,
    dailyRate: 30,
    total: 30,
    status: 'pending',
    createdAt: '2026-07-13T08:10:00',
  },
  {
    id: 'r3',
    reference: 'PG-2026-00040',
    customerName: 'Sara Novak',
    customerEmail: 'sara.novak@example.com',
    customerPhone: '+386 41 552 900',
    bikeType: 'PedalGo City Bike',
    pickupAt: '2026-07-10T08:30:00',
    returnAt: '2026-07-13T08:30:00',
    days: 3,
    dailyRate: 30,
    total: 90,
    status: 'completed',
    createdAt: '2026-07-08T19:45:00',
  },
  {
    id: 'r4',
    reference: 'PG-2026-00039',
    customerName: 'Luka Perić',
    customerEmail: 'luka.peric@example.com',
    customerPhone: '+385 91 776 431',
    bikeType: 'PedalGo City Bike',
    pickupAt: '2026-07-11T12:00:00',
    returnAt: '2026-07-12T12:00:00',
    days: 1,
    dailyRate: 30,
    total: 30,
    status: 'cancelled',
    createdAt: '2026-07-09T11:05:00',
  },
  {
    id: 'r5',
    reference: 'PG-2026-00038',
    customerName: 'Emma Johnson',
    customerEmail: 'emma.j@example.com',
    customerPhone: '+44 7700 900321',
    bikeType: 'PedalGo City Bike',
    pickupAt: '2026-07-09T09:00:00',
    returnAt: '2026-07-11T09:00:00',
    days: 2,
    dailyRate: 30,
    total: 60,
    status: 'failed',
    createdAt: '2026-07-07T16:30:00',
  },
  {
    id: 'r6',
    reference: 'PG-2026-00037',
    customerName: 'Nina Kovač',
    customerEmail: 'nina.kovac@example.com',
    customerPhone: '+387 62 908 112',
    bikeType: 'PedalGo City Bike',
    pickupAt: '2026-07-05T10:00:00',
    returnAt: '2026-07-08T10:00:00',
    days: 3,
    dailyRate: 30,
    total: 90,
    status: 'refunded',
    createdAt: '2026-07-02T09:15:00',
  },
  {
    id: 'r7',
    reference: 'PG-2026-00036',
    customerName: 'David Miller',
    customerEmail: 'david.miller@example.com',
    customerPhone: '+1 415 555 0132',
    bikeType: 'PedalGo City Bike',
    pickupAt: '2026-07-16T14:00:00',
    returnAt: '2026-07-18T14:00:00',
    days: 2,
    dailyRate: 30,
    total: 60,
    status: 'confirmed',
    createdAt: '2026-07-13T20:41:00',
  },
]

export const availabilityBlocks: AvailabilityBlock[] = [
  {
    id: 'ab1',
    label: 'Fleet maintenance — brake checks',
    status: 'maintenance',
    startDate: '2026-07-20',
    endDate: '2026-07-21',
    note: 'Routine safety inspection for all city bikes.',
  },
  {
    id: 'ab2',
    label: 'Local cycling festival — high demand',
    status: 'reserved',
    startDate: '2026-07-26',
    endDate: '2026-07-27',
    note: 'Most units pre-booked for the weekend event.',
  },
  {
    id: 'ab3',
    label: 'Shop closed — public holiday',
    status: 'inactive',
    startDate: '2026-08-01',
    endDate: '2026-08-01',
  },
]

export const recentActivity = [
  { id: 'a1', text: 'New reservation PG-2026-00042 confirmed', time: '12 min ago' },
  { id: 'a2', text: 'Payment received from Marco Rossi', time: '1 hour ago' },
  { id: 'a3', text: 'CITY-005 marked as in maintenance', time: '3 hours ago' },
  { id: 'a4', text: 'Reservation PG-2026-00039 cancelled by customer', time: '5 hours ago' },
  { id: 'a5', text: 'Daily rate reviewed — no change', time: 'Yesterday' },
]

export const revenueData = [
  { month: 'Jan', revenue: 1240 },
  { month: 'Feb', revenue: 980 },
  { month: 'Mar', revenue: 1560 },
  { month: 'Apr', revenue: 2100 },
  { month: 'May', revenue: 2680 },
  { month: 'Jun', revenue: 3120 },
  { month: 'Jul', revenue: 3480 },
]

export const dashboardMetrics = {
  todaysPickups: 3,
  activeRentals: 2,
  upcomingReservations: 5,
  monthlyRevenue: 3480,
}
