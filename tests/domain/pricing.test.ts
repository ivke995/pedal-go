import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateRentalDays, calculateTotalBamCents, formatBamCents, quoteRentalPrice } from "@/lib/domain/pricing";

const pickupAt = new Date("2026-07-14T10:00:00.000Z");

describe("pricing domain service", () => {
  it("counts an exact 24-hour rental as one rental day", () => {
    assert.equal(calculateRentalDays(pickupAt, new Date("2026-07-15T10:00:00.000Z")), 1);
  });

  it("rounds every started 24-hour period up to a full rental day", () => {
    assert.equal(calculateRentalDays(pickupAt, new Date("2026-07-15T10:00:01.000Z")), 2);
    assert.equal(calculateRentalDays(pickupAt, new Date("2026-07-14T10:01:00.000Z")), 1);
  });

  it("returns zero rental days and totals for invalid ranges or invalid rates", () => {
    assert.equal(calculateRentalDays(pickupAt, new Date("2026-07-14T09:59:00.000Z")), 0);
    assert.equal(calculateRentalDays("not-a-date", new Date("2026-07-15T10:00:00.000Z")), 0);
    assert.equal(calculateTotalBamCents(0, 2500), 0);
    assert.equal(calculateTotalBamCents(2, -1), 0);
  });

  it("quotes BAM totals and formats BAM minor units", () => {
    assert.deepEqual(quoteRentalPrice(pickupAt, new Date("2026-07-16T11:00:00.000Z"), 3000), {
      rentalDays: 3,
      dailyRateBamCents: 3000,
      totalBamCents: 9000,
    });
    assert.equal(calculateTotalBamCents(3, 2500), 7500);
    assert.match(formatBamCents(12345), /123[,.]45|123\s?KM|BAM/);
  });
});
