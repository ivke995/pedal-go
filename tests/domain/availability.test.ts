import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { availabilityBlocks, bikes, bikeTypes, reservations } from "@/lib/db/schema";

process.env.TURSO_DATABASE_URL ??= "file::memory:";

type Row = Record<string, unknown>;

type AvailabilityFixture = {
  bikeType?: Row;
  bikeRows?: Row[];
  reservationRows?: Row[];
  blockRows?: Row[];
};

const request = {
  bikeTypeId: "type-city",
  pickupAt: new Date("2026-07-14T10:00:00.000Z"),
  returnAt: new Date("2026-07-15T10:00:00.000Z"),
};

const bikeType = {
  id: "type-city",
  name: "City Bike",
  slug: "city-bike",
  description: "Comfort rental bike",
  dailyRateBamCents: 2500,
  imagePath: null,
  featuresJson: [],
  isActive: true,
  sortOrder: 0,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
};

function bike(id: string): Row {
  return {
    id,
    bikeTypeId: "type-city",
    code: id.toUpperCase(),
    status: "available",
    notes: null,
    lastServicedAt: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };
}

function fakeDatabase(fixture: AvailabilityFixture) {
  return {
    select() {
      return {
        from(table: unknown) {
          const rows = rowsForTable(table, fixture);

          return {
            where() {
              return {
                limit(count: number) {
                  return Promise.resolve(rows.slice(0, count));
                },
                then(resolve: (value: Row[]) => void, reject?: (reason: unknown) => void) {
                  return Promise.resolve(rows).then(resolve, reject);
                },
              };
            },
          };
        },
      };
    },
  };
}

function rowsForTable(table: unknown, fixture: AvailabilityFixture): Row[] {
  if (table === bikeTypes) {
    return fixture.bikeType ? [fixture.bikeType] : [];
  }

  if (table === bikes) {
    return fixture.bikeRows ?? [];
  }

  if (table === reservations) {
    return fixture.reservationRows ?? [];
  }

  if (table === availabilityBlocks) {
    return fixture.blockRows ?? [];
  }

  throw new Error("Unexpected table requested by availability service");
}

async function availability(fixture: AvailabilityFixture) {
  const { getBikeAvailability } = await import("@/lib/domain/availability");

  return getBikeAvailability(request, fakeDatabase(fixture) as never);
}

describe("availability domain service", () => {
  it("returns unavailable when no active bikes are available for the type", async () => {
    const result = await availability({ bikeType, bikeRows: [] });

    assert.equal(result.isAvailable, false);
    assert.deepEqual(result.availableBikes, []);
  });

  it("excludes bikes with assigned confirmed reservation conflicts", async () => {
    const result = await availability({
      bikeType,
      bikeRows: [bike("bike-1"), bike("bike-2")],
      reservationRows: [{ bikeId: "bike-1" }],
    });

    assert.equal(result.isAvailable, true);
    assert.deepEqual(
      result.availableBikes.map((availableBike) => availableBike.id),
      ["bike-2"],
    );
    assert.deepEqual(result.unavailableBikeIds, ["bike-1"]);
  });

  it("reduces capacity for unassigned confirmed reservations", async () => {
    const result = await availability({
      bikeType,
      bikeRows: [bike("bike-1"), bike("bike-2")],
      reservationRows: [{ bikeId: null }],
    });

    assert.equal(result.isAvailable, true);
    assert.equal(result.availableBikes.length, 1);
    assert.deepEqual(result.unavailableBikeIds, []);
  });

  it("blocks bikes with reserved, maintenance, and inactive availability blocks", async () => {
    const result = await availability({
      bikeType,
      bikeRows: [bike("bike-1"), bike("bike-2"), bike("bike-3"), bike("bike-4")],
      blockRows: [{ bikeId: "bike-1" }, { bikeId: "bike-2" }, { bikeId: "bike-3" }],
    });

    assert.equal(result.isAvailable, true);
    assert.deepEqual(
      result.availableBikes.map((availableBike) => availableBike.id),
      ["bike-4"],
    );
    assert.deepEqual(result.unavailableBikeIds, ["bike-1", "bike-2", "bike-3"]);
  });

  it("treats a type-wide block as making all active bikes unavailable", async () => {
    const result = await availability({
      bikeType,
      bikeRows: [bike("bike-1"), bike("bike-2")],
      blockRows: [{ bikeId: null }],
    });

    assert.equal(result.isAvailable, false);
    assert.deepEqual(result.availableBikes, []);
    assert.deepEqual(result.unavailableBikeIds, ["bike-1", "bike-2"]);
  });
});
