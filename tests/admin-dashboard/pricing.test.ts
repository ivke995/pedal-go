import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { updateBikeTypeDailyPrice } from "@/lib/admin-dashboard/pricing";
import { bikeTypes } from "@/lib/db/schema";

process.env.TURSO_DATABASE_URL ??= "file::memory:";

type Row = typeof bikeTypes.$inferSelect;

const activeBikeType: Row = {
  id: "bike-type-mvp-city-bike",
  name: "PedalGo City Bike",
  slug: "city-bike",
  description: "Comfortable all-purpose city bike.",
  dailyRateUsdCents: 2500,
  imagePath: null,
  featuresJson: [],
  isActive: true,
  sortOrder: 1,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
};

function fakeDatabase(row: Row | null) {
  const updates: Partial<Row>[] = [];

  return {
    updates,
    update(table: unknown) {
      assert.equal(table, bikeTypes);

      return {
        set(values: Partial<Row>) {
          updates.push(values);

          return {
            where() {
              return {
                returning() {
                  return Promise.resolve(row ? [{ ...row, ...values }] : []);
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("admin pricing management", () => {
  it("rejects invalid USD daily prices before updating", async () => {
    const database = fakeDatabase(activeBikeType);

    const result = await updateBikeTypeDailyPrice(
      { bikeTypeId: activeBikeType.id, dailyRateUsd: "12.345" },
      database as never,
    );

    assert.equal(result.status, "error");
    assert.equal(result.fieldErrors.dailyRateUsd, "Enter a USD daily price from 0.01 to 9,999.99 with up to two decimals.");
    assert.equal(database.updates.length, 0);
  });

  it("updates active bike-type daily price cents and updated timestamp", async () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const database = fakeDatabase(activeBikeType);

    const result = await updateBikeTypeDailyPrice(
      { bikeTypeId: activeBikeType.id, dailyRateUsd: "31.50" },
      database as never,
      { now },
    );

    assert.equal(result.status, "updated");
    assert.equal(result.bikeType.dailyRateUsdCents, 3150);
    assert.equal(result.bikeType.updatedAt, now);
    assert.deepEqual(database.updates[0], {
      dailyRateUsdCents: 3150,
      updatedAt: now,
    });
  });

  it("does not update reservation totals when pricing changes", async () => {
    const database = fakeDatabase(activeBikeType);
    const existingReservationTotalUsdCents = 7500;

    const result = await updateBikeTypeDailyPrice(
      { bikeTypeId: activeBikeType.id, dailyRateUsd: "40" },
      database as never,
    );

    assert.equal(result.status, "updated");
    assert.equal(database.updates[0]?.dailyRateUsdCents, 4000);
    assert.equal(existingReservationTotalUsdCents, 7500);
  });
});
