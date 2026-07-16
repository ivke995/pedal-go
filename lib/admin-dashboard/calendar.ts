import { and, asc, eq, gt, lt, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  availabilityBlocks,
  bikes,
  bikeTypes,
  reservations,
  type AvailabilityBlockStatus,
  type ReservationStatus,
} from "@/lib/db/schema";

export type AdminCalendarEventType = "reservation" | "availability_block";

export type AdminCalendarEvent = {
  id: string;
  type: AdminCalendarEventType;
  title: string;
  resourceLabel: string;
  startsAt: Date;
  endsAt: Date;
  status: ReservationStatus | AvailabilityBlockStatus;
  href?: string;
};

export type AdminCalendarDay = {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  events: AdminCalendarEvent[];
  availabilityLabel: "open" | "partial" | "unavailable";
};

export type AdminCalendarMonth = {
  monthStart: Date;
  monthEnd: Date;
  previousMonth: string;
  nextMonth: string;
  days: AdminCalendarDay[];
  events: AdminCalendarEvent[];
};

type CalendarDatabase = typeof db;

const BLOCKING_RESERVATION_STATUSES: ReservationStatus[] = ["pending", "confirmed"];

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(value: Date, months: number): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1));
}

export function formatCalendarMonthParam(value: Date): string {
  return value.toISOString().slice(0, 7);
}

export function parseAdminCalendarMonth(value: string | undefined, now: Date = new Date()): Date {
  if (!value) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (monthIndex < 0 || monthIndex > 11) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return new Date(Date.UTC(year, monthIndex, 1));
}

export function buildAdminCalendarMonth(monthStart: Date, events: AdminCalendarEvent[]): AdminCalendarMonth {
  const normalizedMonthStart = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1));
  const monthEnd = addMonths(normalizedMonthStart, 1);
  const gridStart = addDays(normalizedMonthStart, -normalizedMonthStart.getUTCDay());
  const gridEnd = addDays(monthEnd, (7 - monthEnd.getUTCDay()) % 7);
  const days: AdminCalendarDay[] = [];

  for (let date = gridStart; date < gridEnd; date = addDays(date, 1)) {
    const nextDate = addDays(date, 1);
    const dayEvents = events
      .filter((event) => event.startsAt < nextDate && event.endsAt > date)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const blockingEvents = dayEvents.filter(
      (event) =>
        event.type === "availability_block" || BLOCKING_RESERVATION_STATUSES.includes(event.status as ReservationStatus),
    );

    days.push({
      date,
      dayNumber: date.getUTCDate(),
      isCurrentMonth: date >= normalizedMonthStart && date < monthEnd,
      events: dayEvents,
      availabilityLabel: blockingEvents.length === 0 ? "open" : blockingEvents.length === 1 ? "partial" : "unavailable",
    });
  }

  return {
    monthStart: normalizedMonthStart,
    monthEnd,
    previousMonth: formatCalendarMonthParam(addMonths(normalizedMonthStart, -1)),
    nextMonth: formatCalendarMonthParam(addMonths(normalizedMonthStart, 1)),
    days,
    events: [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime()),
  };
}

export async function getAdminCalendarMonth(
  monthStart: Date,
  database: CalendarDatabase = db,
): Promise<AdminCalendarMonth> {
  const normalizedMonthStart = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1));
  const monthEnd = addMonths(normalizedMonthStart, 1);

  const [reservationRows, blockRows] = await Promise.all([
    database
      .select({
        id: reservations.id,
        reference: reservations.reference,
        customerName: reservations.customerName,
        pickupAt: reservations.pickupAt,
        returnAt: reservations.returnAt,
        status: reservations.status,
        bikeTypeName: bikeTypes.name,
        bikeCode: bikes.code,
      })
      .from(reservations)
      .innerJoin(bikeTypes, eq(reservations.bikeTypeId, bikeTypes.id))
      .leftJoin(bikes, eq(reservations.bikeId, bikes.id))
      .where(
        and(
          or(eq(reservations.status, "pending"), eq(reservations.status, "confirmed"), eq(reservations.status, "completed")),
          lt(reservations.pickupAt, monthEnd),
          gt(reservations.returnAt, normalizedMonthStart),
        ),
      )
      .orderBy(asc(reservations.pickupAt)),
    database
      .select({
        id: availabilityBlocks.id,
        label: availabilityBlocks.label,
        startsAt: availabilityBlocks.startsAt,
        endsAt: availabilityBlocks.endsAt,
        status: availabilityBlocks.status,
        bikeTypeName: bikeTypes.name,
        bikeCode: bikes.code,
      })
      .from(availabilityBlocks)
      .leftJoin(bikeTypes, eq(availabilityBlocks.bikeTypeId, bikeTypes.id))
      .leftJoin(bikes, eq(availabilityBlocks.bikeId, bikes.id))
      .where(and(lt(availabilityBlocks.startsAt, monthEnd), gt(availabilityBlocks.endsAt, normalizedMonthStart)))
      .orderBy(asc(availabilityBlocks.startsAt)),
  ]);

  const events: AdminCalendarEvent[] = [
    ...reservationRows.map((row) => ({
      id: row.id,
      type: "reservation" as const,
      title: `${row.reference} · ${row.customerName}`,
      resourceLabel: `${row.bikeTypeName}${row.bikeCode ? ` · ${row.bikeCode}` : " · Unassigned bike"}`,
      startsAt: row.pickupAt,
      endsAt: row.returnAt,
      status: row.status,
      href: `/admin/reservations?search=${encodeURIComponent(row.reference)}`,
    })),
    ...blockRows.map((row) => ({
      id: row.id,
      type: "availability_block" as const,
      title: row.label,
      resourceLabel: `${row.bikeTypeName ?? "All bike types"}${row.bikeCode ? ` · ${row.bikeCode}` : " · Entire type"}`,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: row.status,
      href: "/admin/availability",
    })),
  ];

  return buildAdminCalendarMonth(normalizedMonthStart, events);
}
