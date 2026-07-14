const MS_PER_RENTAL_DAY = 24 * 60 * 60 * 1000;

export type RentalDateInput = Date | string | number;

export type RentalPriceQuote = {
  rentalDays: number;
  dailyRateBamCents: number;
  totalBamCents: number;
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

export function calculateTotalBamCents(rentalDays: number, dailyRateBamCents: number): number {
  if (!Number.isInteger(rentalDays) || rentalDays <= 0) {
    return 0;
  }

  if (!Number.isInteger(dailyRateBamCents) || dailyRateBamCents <= 0) {
    return 0;
  }

  return rentalDays * dailyRateBamCents;
}

export function quoteRentalPrice(
  pickupAt: RentalDateInput,
  returnAt: RentalDateInput,
  dailyRateBamCents: number,
): RentalPriceQuote {
  const rentalDays = calculateRentalDays(pickupAt, returnAt);

  return {
    rentalDays,
    dailyRateBamCents,
    totalBamCents: calculateTotalBamCents(rentalDays, dailyRateBamCents),
  };
}

export function formatBamCents(amountBamCents: number): string {
  return new Intl.NumberFormat("bs-BA", {
    style: "currency",
    currency: "BAM",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountBamCents / 100);
}
