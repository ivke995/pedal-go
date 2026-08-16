import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { reservations, type ReservationStatus } from "@/lib/db/schema";
import {
  parseReservationVerification,
  verifyReservation,
  type ReservationVerificationAdmin,
} from "@/lib/admin-dashboard/verification";

process.env.TURSO_DATABASE_URL ??= "file::memory:";

type Row = typeof reservations.$inferSelect;

const admin: ReservationVerificationAdmin = {
  id: "admin-1",
  email: "owner@example.com",
  name: "Owner",
};

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
  dailyRateUsdCents: 4800,
  totalUsdCents: 9600,
  status: "pending_verification",
  paymentMethod: "venmo",
  notes: JSON.stringify({ source: "public_booking", holdStrategy: "assigned_bike" }),
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

describe("admin reservation verification", () => {
  it("confirms a pending reservation and records the verifying admin", async () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const database = fakeDatabase(baseReservation);

    const result = await verifyReservation(
      { reservationId: baseReservation.id, note: "Matched Venmo receipt" },
      admin,
      database as never,
      { now },
    );

    assert.equal(result.status, "verified");
    assert.equal(result.reservation.previousStatus, "pending_verification");
    assert.deepEqual(JSON.parse(String(database.updates[0].notes)), {
      source: "public_booking",
      holdStrategy: "assigned_bike",
      verification: {
        verifiedAt: "2026-07-16T12:00:00.000Z",
        verifiedBy: {
          adminId: "admin-1",
          email: "owner@example.com",
          name: "Owner",
        },
        note: "Matched Venmo receipt",
      },
    });
    assert.equal(database.updates[0].status, "confirmed");
    assert.equal(database.updates[0].updatedAt, now);
  });

  it("rejects cancelled and already confirmed reservations without updating", async () => {
    const statuses: ReservationStatus[] = ["cancelled", "confirmed", "completed", "failed", "refunded"];

    for (const status of statuses) {
      const database = fakeDatabase({ ...baseReservation, status });
      const result = await verifyReservation({ reservationId: baseReservation.id }, admin, database as never);

      assert.equal(result.status, "invalid_transition");
      assert.equal(result.currentStatus, status);
      assert.equal(database.updates.length, 0);
    }
  });

  it("parses verification metadata without exposing unrelated notes", () => {
    const verification = parseReservationVerification(String(baseReservation.notes));
    assert.equal(verification, null);

    const withVerification = JSON.stringify({
      source: "public_booking",
      verification: {
        verifiedAt: "2026-07-16T12:00:00.000Z",
        verifiedBy: { adminId: "admin-1", email: "owner@example.com", name: "Owner" },
        note: "Matched receipt",
      },
    });

    assert.deepEqual(parseReservationVerification(withVerification), {
      verifiedAt: "2026-07-16T12:00:00.000Z",
      verifiedBy: { adminId: "admin-1", email: "owner@example.com", name: "Owner" },
      note: "Matched receipt",
    });
  });
});
