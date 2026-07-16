import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { availabilityBlocks, bikes, bikeTypes, reservations } from "@/lib/db/schema";
import { createManualReservation } from "@/lib/admin-dashboard/manual-reservations";

process.env.TURSO_DATABASE_URL ??= "file::memory:";

type Row = Record<string, unknown>;

type Fixture = {
  bikeType?: Row;
  bikeRows?: Row[];
  reservationRows?: Row[];
  blockRows?: Row[];
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
  pickupAt: "2026-07-14T10:00:00.000Z",
  returnAt: "2026-07-16T11:00:00.000Z",
  fullName: "Jane Admin",
  email: "Jane.Admin@example.com",
  phone: "+1 555 123 4567",
  status: "confirmed",
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

function fakeDatabase(fixture: Fixture) {
  const insertedRows: Row[] = [];

  return {
    insertedRows,
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
      assert.equal(table, reservations);

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
  };
}

function rowsForTable(table: unknown, fixture: Fixture): Row[] {
  if (table === bikeTypes) return fixture.bikeType ? [fixture.bikeType] : [];
  if (table === bikes) return fixture.bikeRows ?? [];
  if (table === reservations) return fixture.reservationRows ?? [];
  if (table === availabilityBlocks) return fixture.blockRows ?? [];

  throw new Error("Unexpected table requested by manual reservation");
}

describe("admin manual reservation creation", () => {
  it("returns field errors and does not insert invalid input", async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [bike("bike-1")] });

    const result = await createManualReservation(
      { ...validInput, fullName: "", email: "bad", phone: "12", returnAt: validInput.pickupAt },
      database as never,
    );

    assert.equal(result.status, "error");
    assert.equal(result.fieldErrors.fullName, "Enter the customer's full name.");
    assert.equal(result.fieldErrors.email, "Enter a valid customer email address.");
    assert.equal(result.fieldErrors.phone, "Enter a valid customer phone number.");
    assert.equal(result.fieldErrors.returnAt, "Return must be after pickup.");
    assert.equal(database.insertedRows.length, 0);
  });

  it("blocks creation when availability is unavailable", async () => {
    const database = fakeDatabase({ bikeType, bikeRows: [] });

    const result = await createManualReservation(validInput, database as never);

    assert.equal(result.status, "unavailable");
    assert.match(result.message, /No bikes are available/);
    assert.equal(database.insertedRows.length, 0);
  });

  it("creates a confirmed reservation with assigned bike, current price, and admin metadata", async () => {
    const now = new Date("2026-07-14T09:00:00.000Z");
    const database = fakeDatabase({ bikeType, bikeRows: [bike("bike-1")] });

    const result = await createManualReservation(
      { ...validInput, notes: "Walk-in customer" },
      database as never,
      {
        now,
        idFactory: () => "reservation-1",
        referenceFactory: () => "PG-ADM-TEST-0001",
      },
    );

    assert.equal(result.status, "created");
    assert.equal(result.reservation.reference, "PG-ADM-TEST-0001");
    assert.equal(result.reservation.status, "confirmed");
    assert.equal(database.insertedRows.length, 1);

    const inserted = database.insertedRows[0];
    assert.equal(inserted.status, "confirmed");
    assert.equal(inserted.bikeId, "bike-1");
    assert.equal(inserted.customerEmail, "jane.admin@example.com");
    assert.equal(inserted.rentalDays, 3);
    assert.equal(inserted.dailyRateUsdCents, 2500);
    assert.equal(inserted.totalUsdCents, 7500);
    assert.deepEqual(JSON.parse(String(inserted.notes)), {
      source: "admin_manual",
      holdStrategy: "assigned_bike",
      adminNote: "Walk-in customer",
    });
  });
});
