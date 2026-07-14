const MS_PER_RENTAL_DAY = 24 * 60 * 60 * 1000;

export type RentalDateInput = Date | string | number;

export type RentalPriceQuote = {
  rentalDays: number;
  dailyRateUsdCents: number;
  totalUsdCents: number;
};

function toDate(input: RentalDateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

export function calculateRentalDays(pickupAt: RentalDateInput, returnAt: RentalDateInput): number {
  const pickupDate = toDate(pickupAt);
  const returnDate = toDate(returnAt);
  const durationMs = returnDate.getTime() - pickupDate.getTime();

  if (Number.isNaN(durationMs) || durationMs <= 0) {
    return 0;
  }

  return Math.ceil(durationMs / MS_PER_RENTAL_DAY);
}

export function calculateTotalUsdCents(rentalDays: number, dailyRateUsdCents: number): number {
  if (!Number.isInteger(rentalDays) || rentalDays <= 0) {
    return 0;
  }

  if (!Number.isInteger(dailyRateUsdCents) || dailyRateUsdCents <= 0) {
    return 0;
  }

  return rentalDays * dailyRateUsdCents;
}

export function quoteRentalPrice(
  pickupAt: RentalDateInput,
  returnAt: RentalDateInput,
  dailyRateUsdCents: number,
): RentalPriceQuote {
  const rentalDays = calculateRentalDays(pickupAt, returnAt);

  return {
    rentalDays,
    dailyRateUsdCents,
    totalUsdCents: calculateTotalUsdCents(rentalDays, dailyRateUsdCents),
  };
}

export function formatUsdCents(amountUsdCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUsdCents / 100);
}
