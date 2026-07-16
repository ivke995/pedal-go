import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { upsertAvailabilityBlock, deleteAvailabilityBlock } from "@/lib/admin-dashboard/availability-blocks";
import { getBikeAvailability } from "@/lib/domain/availability";
import { availabilityBlocks, bikes, bikeTypes, reservations } from "@/lib/db/schema";

process.env.TURSO_DATABASE_URL ??= "file::memory:";

type Row = Record<string, unknown>;

type Fixture = {
  bikeType?: Row;
  bikeRows?: Row[];
  reservationRows?: Row[];
  blockRows?: Row[];
  selectBlockRows?: Row[];
};

const bikeType = {
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

const validInput = {
  bikeTypeId: "bike-type-mvp-city-bike",
  bikeId: "bike-1",
  label: "Brake repair",
  status: "maintenance",
  startsAt: "2026-07-20T10:00:00.000Z",
  endsAt: "2026-07-21T10:00:00.000Z",
  note: "Rear brake service",
};

function bike(id: string): Row {
  return {
    id,
    bikeTypeId: "bike-type-mvp-city-bike",
    code: id.toUpperCase(),
    status: "available",
    notes: null,
    lastServicedAt: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };
}

function reservation(id: string, bikeId: string | null = "bike-1"): Row {
  return {
    id,
    reference: "PG-TEST-0001",
    bikeTypeId: "bike-type-mvp-city-bike",
    bikeId,
    customerName: "Jane Rider",
    customerEmail: "jane@example.com",
    customerPhone: "+1 555 123 4567",
    pickupAt: new Date("2026-07-20T12:00:00.000Z"),
    returnAt: new Date("2026-07-21T09:00:00.000Z"),
    rentalDays: 1,
    dailyRateUsdCents: 2500,
    totalUsdCents: 2500,
    status: "confirmed",
    notes: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };
}

function block(id: string, bikeId: string | null = "bike-1"): Row {
  return {
    id,
    bikeTypeId: "bike-type-mvp-city-bike",
    bikeId,
    label: "Maintenance",
    status: "maintenance",
    startsAt: new Date("2026-07-20T10:00:00.000Z"),
    endsAt: new Date("2026-07-21T10:00:00.000Z"),
    note: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };
}

function fakeDatabase(fixture: Fixture) {
  const insertedRows: Row[] = [];
  const updatedRows: Row[] = [];
  const deletedRows: Row[] = [];

  return {
    insertedRows,
    updatedRows,
    deletedRows,
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
    insert(table: unknown) {
      assert.equal(table, availabilityBlocks);

      return {
        values(row: Row) {
          insertedRows.push(row);

          return {
            returning() {
              return Promise.resolve([row]);
            },
          };
        },
      };
    },
    update(table: unknown) {
      assert.equal(table, availabilityBlocks);

      return {
        set(values: Row) {
          updatedRows.push(values);

          return {
            where() {
              return {
                returning() {
                  return Promise.resolve(fixture.blockRows?.[0] ? [{ ...fixture.blockRows[0], ...values }] : []);
                },
              };
            },
          };
        },
      };
    },
    delete(table: unknown) {
      assert.equal(table, availabilityBlocks);

      return {
        where() {
          return {
            returning() {
              const deleted = fixture.blockRows?.[0];
              if (deleted) deletedRows.push(deleted);
              return Promise.resolve(deleted ? [deleted] : []);
            },
          };
        },
      };
    },
  };
}

function rowsForTable(table: unknown, fixture: Fixture): Row[] {
  if (table === bikeTypes) return fixture.bikeType ? [fixture.bikeType] : [];
  if (table === bikes) return fixture.bikeRows ?? [];
  if (table === reservations) return fixture.reservationRows ?? [];
  if (table === availabilityBlocks) return fixture.selectBlockRows ?? fixture.blockRows ?? [];

  throw new Error("Unexpected table requested by availability block management");
}

describe("admin availability block management", () => {
  it("returns validation errors and does not insert invalid blocks", async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike("bike-1")] });

    const result = await upsertAvailabilityBlock(
      { ...validInput, label: "", status: "bad", endsAt: validInput.startsAt },
      database as never,
    );

    assert.equal(result.status, "error");
    assert.equal(result.fieldErrors.label, "Enter a reason or label.");
    assert.equal(result.fieldErrors.status, "Choose a valid block status.");
    assert.equal(result.fieldErrors.endsAt, "End must be after start.");
    assert.equal(database.insertedRows.length, 0);
  });

  it("creates a maintenance block for a bike when there are no conflicts", async () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const database = fakeDatabase({ bikeType, bikeRows: [bike("bike-1")] });

    const result = await upsertAvailabilityBlock(validInput, database as never, {
      now,
      idFactory: () => "block-1",
    });

    assert.equal(result.status, "created");
    assert.equal(result.block.id, "block-1");
    assert.equal(database.insertedRows.length, 1);
    assert.deepEqual(database.insertedRows[0], {
      id: "block-1",
      bikeTypeId: "bike-type-mvp-city-bike",
      bikeId: "bike-1",
      label: "Brake repair",
      status: "maintenance",
      startsAt: new Date("2026-07-20T10:00:00.000Z"),
      endsAt: new Date("2026-07-21T10:00:00.000Z"),
      note: "Rear brake service",
      createdAt: now,
      updatedAt: now,
    });
  });

  it("blocks creation when the requested window overlaps a confirmed reservation", async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike("bike-1")], reservationRows: [reservation("reservation-1")] });

    const result = await upsertAvailabilityBlock(validInput, database as never);

    assert.equal(result.status, "conflict");
    assert.match(result.message, /overlaps an existing pending or confirmed reservation/);
    assert.equal(database.insertedRows.length, 0);
  });

  it("updates and deletes existing availability blocks", async () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const database = fakeDatabase({
      bikeType,
      bikeRows: [bike("bike-1")],
      blockRows: [block("block-1")],
      selectBlockRows: [],
    });

    const updated = await upsertAvailabilityBlock(
      { ...validInput, blockId: "block-1", label: "Updated repair" },
      database as never,
      { now },
    );
    const deleted = await deleteAvailabilityBlock({ blockId: "block-1" }, database as never);

    assert.equal(updated.status, "updated");
    assert.equal(database.updatedRows[0].label, "Updated repair");
    assert.equal(database.updatedRows[0].updatedAt, now);
    assert.equal(deleted.status, "deleted");
    assert.equal(deleted.blockId, "block-1");
  });

  it("makes matching availability unavailable through the shared availability service", async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike("bike-1")], blockRows: [block("block-1")] });

    const availability = await getBikeAvailability(
      {
        bikeTypeId: "bike-type-mvp-city-bike",
        pickupAt: "2026-07-20T12:00:00.000Z",
        returnAt: "2026-07-21T09:00:00.000Z",
      },
      database as never,
    );

    assert.equal(availability.isAvailable, false);
    assert.deepEqual(availability.unavailableBikeIds, ["bike-1"]);
  });
});
