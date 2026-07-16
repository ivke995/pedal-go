import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAdminCalendarMonth,
  formatCalendarMonthParam,
  parseAdminCalendarMonth,
  type AdminCalendarEvent,
} from "@/lib/admin-dashboard/calendar";

process.env.TURSO_DATABASE_URL ??= "file::memory:";

describe("admin availability calendar", () => {
  it("parses valid month params and falls back to the current UTC month", () => {
    const fallback = new Date("2026-07-16T12:00:00.000Z");

    assert.equal(parseAdminCalendarMonth("2026-08", fallback).toISOString(), "2026-08-01T00:00:00.000Z");
    assert.equal(parseAdminCalendarMonth("bad", fallback).toISOString(), "2026-07-01T00:00:00.000Z");
    assert.equal(formatCalendarMonthParam(new Date("2026-08-10T00:00:00.000Z")), "2026-08");
  });

  it("places reservations and availability blocks onto overlapping calendar days", () => {
    const events: AdminCalendarEvent[] = [
      {
        id: "reservation-1",
        type: "reservation",
        title: "PG-TEST-0001 · Jane Rider",
        resourceLabel: "PedalGo City Bike · BIKE-1",
        startsAt: new Date("2026-07-10T12:00:00.000Z"),
        endsAt: new Date("2026-07-12T10:00:00.000Z"),
        status: "confirmed",
      },
      {
        id: "block-1",
        type: "availability_block",
        title: "Brake repair",
        resourceLabel: "PedalGo City Bike · BIKE-2",
        startsAt: new Date("2026-07-12T08:00:00.000Z"),
        endsAt: new Date("2026-07-13T08:00:00.000Z"),
        status: "maintenance",
      },
    ];

    const calendar = buildAdminCalendarMonth(new Date("2026-07-01T00:00:00.000Z"), events);
    const july10 = calendar.days.find((day) => day.date.toISOString() === "2026-07-10T00:00:00.000Z");
    const july12 = calendar.days.find((day) => day.date.toISOString() === "2026-07-12T00:00:00.000Z");
    const july14 = calendar.days.find((day) => day.date.toISOString() === "2026-07-14T00:00:00.000Z");

    assert.equal(calendar.previousMonth, "2026-06");
    assert.equal(calendar.nextMonth, "2026-08");
    assert.equal(july10?.events.length, 1);
    assert.equal(july10?.availabilityLabel, "partial");
    assert.equal(july12?.events.length, 2);
    assert.equal(july12?.events[1].title, "Brake repair");
    assert.equal(july14?.events.length, 0);
    assert.equal(july14?.availabilityLabel, "open");
  });
});
