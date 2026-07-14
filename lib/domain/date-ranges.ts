import type { RentalDateInput } from "./pricing";

function toDate(input: RentalDateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

export function rangesOverlap(
  firstStart: RentalDateInput,
  firstEnd: RentalDateInput,
  secondStart: RentalDateInput,
  secondEnd: RentalDateInput,
): boolean {
  const firstStartMs = toDate(firstStart).getTime();
  const firstEndMs = toDate(firstEnd).getTime();
  const secondStartMs = toDate(secondStart).getTime();
  const secondEndMs = toDate(secondEnd).getTime();

  if ([firstStartMs, firstEndMs, secondStartMs, secondEndMs].some(Number.isNaN)) {
    return false;
  }

  return firstStartMs < secondEndMs && firstEndMs > secondStartMs;
}
