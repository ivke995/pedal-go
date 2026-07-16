import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cancelReservation, canCancelAdminReservation } from "@/lib/admin-dashboard/cancellations";
import { reservations, type ReservationStatus } from "@/lib/db/schema";

process.env.TURSO_DATABASE_URL ??= "file::memory:";

type Row = typeof reservations.$inferSelect;

const baseReservation: Row = {
  id: "reservation-1",
  reference: "PG-TEST-0001",
  bikeTypeId: "bike-type-mvp-city-bike",
  bikeId: "bike-1",
  customerName: "Jane Rider",
  customerEmail: "jane@example.com",
  customerPhone: "+1 555 123 4567",
  pickupAt: new Date("2026-07-20T10:00:00.000Z"),
  returnAt: new Date("2026-07-22T10:00:00.000Z"),
  rentalDays: 2,
  dailyRateUsdCents: 2500,
  totalUsdCents: 5000,
  status: "confirmed",
  notes: JSON.stringify({ source: "admin_manual", adminNote: "VIP" }),
  createdAt: new Date("2026-07-16T10:00:00.000Z"),
  updatedAt: new Date("2026-07-16T10:00:00.000Z"),
};

function fakeDatabase(row: Row | null) {
  const updates: Partial<Row>[] = [];

  return {
    updates,
    select() {
      return {
        from(table: unknown) {
          assert.equal(table, reservations);

          return {
            where() {
              return {
                limit(count: number) {
                  return Promise.resolve(row ? [row].slice(0, count) : []);
                },
              };
            },
          };
        },
      };
    },
    update(table: unknown) {
      assert.equal(table, reservations);

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

describe("admin reservation cancellation", () => {
  it("marks confirmed reservations cancelled and appends cancellation metadata", async () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const database = fakeDatabase(baseReservation);

    const result = await cancelReservation(
      { reservationId: baseReservation.id, reason: "Customer called" },
      database as never,
      { now },
    );

    assert.equal(result.status, "cancelled");
    assert.equal(result.reservation.reference, "PG-TEST-0001");
    assert.equal(result.reservation.previousStatus, "confirmed");
    assert.equal(database.updates.length, 1);
    assert.equal(database.updates[0].status, "cancelled");
    assert.equal(database.updates[0].updatedAt, now);
    assert.deepEqual(JSON.parse(String(database.updates[0].notes)), {
      source: "admin_manual",
      adminNote: "VIP",
      cancellation: {
        cancelledBy: "admin",
        cancelledAt: "2026-07-16T12:00:00.000Z",
        reason: "Customer called",
      },
    });
  });

  it("blocks invalid status transitions without updating", async () => {
    const database = fakeDatabase({ ...baseReservation, status: "completed" });

    const result = await cancelReservation({ reservationId: baseReservation.id }, database as never);

    assert.equal(result.status, "invalid_transition");
    assert.equal(result.currentStatus, "completed");
    assert.equal(database.updates.length, 0);
  });

  it("only treats pending and confirmed reservations as cancellable", () => {
    const statuses: ReservationStatus[] = ["pending", "confirmed", "cancelled", "completed", "failed", "refunded"];

    assert.deepEqual(statuses.filter(canCancelAdminReservation), ["pending", "confirmed"]);
  });
});
