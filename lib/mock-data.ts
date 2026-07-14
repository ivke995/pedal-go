import type { BikeType } from '@/lib/types'
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
