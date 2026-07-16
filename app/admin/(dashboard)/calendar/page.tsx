import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminCalendarMonth,
  parseAdminCalendarMonth,
  type AdminCalendarDay,
  type AdminCalendarEvent,
} from "@/lib/admin-dashboard/calendar";
import { formatDateTime } from "@/lib/pricing";

export const metadata = {
  title: "Calendar — PedalGo Admin",
};

type AdminCalendarPageProps = {
  searchParams: Promise<{
    month?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function statusLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
}

function monthLabel(value: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(value);
}

function shortDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(value);
}

function EventBadge({ event }: { event: AdminCalendarEvent }) {
  const variant = event.type === "availability_block" ? "secondary" : event.status === "pending" ? "outline" : "default";

  return <Badge variant={variant}>{event.type === "availability_block" ? statusLabel(event.status) : statusLabel(event.status)}</Badge>;
}

function DayAvailabilityBadge({ day }: { day: AdminCalendarDay }) {
  if (!day.isCurrentMonth) return null;

  const variant = day.availabilityLabel === "open" ? "outline" : day.availabilityLabel === "partial" ? "secondary" : "destructive";

  return <Badge variant={variant}>{statusLabel(day.availabilityLabel)}</Badge>;
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const params = await searchParams;
  const monthStart = parseAdminCalendarMonth(firstParam(params.month));
  const calendar = await getAdminCalendarMonth(monthStart);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>
            Review booked rentals and maintenance blocks by month to spot unavailable windows and availability gaps.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{monthLabel(calendar.monthStart)}</h2>
              <p className="text-sm text-muted-foreground">
                Showing reservations and availability blocks that overlap this month.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" render={<a href={`/admin/calendar?month=${calendar.previousMonth}`} />}>
                Previous
              </Button>
              <Button variant="outline" render={<a href="/admin/calendar" />}>
                Current month
              </Button>
              <Button variant="outline" render={<a href={`/admin/calendar?month=${calendar.nextMonth}`} />}>
                Next
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
            {calendar.days.map((day) => (
              <div
                key={day.date.toISOString()}
                className={`min-h-32 rounded-lg border p-2 ${day.isCurrentMonth ? "bg-background" : "bg-muted/40 text-muted-foreground"}`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-medium">{day.dayNumber}</span>
                  <DayAvailabilityBadge day={day} />
                </div>
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((event) => (
                    <a
                      key={`${day.date.toISOString()}-${event.type}-${event.id}`}
                      href={event.href}
                      className="block rounded-md border bg-card p-1.5 text-xs hover:bg-muted"
                    >
                      <span className="block font-medium">{event.title}</span>
                      <span className="block text-muted-foreground">{event.resourceLabel}</span>
                    </a>
                  ))}
                  {day.events.length > 3 ? (
                    <div className="text-xs text-muted-foreground">+{day.events.length - 3} more scheduled item(s)</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule list</CardTitle>
          <CardDescription>
            {calendar.events.length.toLocaleString()} reservation or availability item
            {calendar.events.length === 1 ? "" : "s"} in {monthLabel(calendar.monthStart)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calendar.events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendar.events.map((event) => (
                  <TableRow key={`${event.type}-${event.id}`}>
                    <TableCell>
                      <a className="font-medium underline-offset-4 hover:underline" href={event.href}>
                        {event.title}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {event.type === "availability_block" ? "Availability block" : "Reservation"}
                      </div>
                    </TableCell>
                    <TableCell>{event.resourceLabel}</TableCell>
                    <TableCell>
                      <div>{formatDateTime(event.startsAt)}</div>
                      <div className="text-xs text-muted-foreground">Until {formatDateTime(event.endsAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {shortDate(event.startsAt)}–{shortDate(event.endsAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <EventBadge event={event} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No scheduled blocks or rentals</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This month is open unless bike inventory status changes outside reservations or availability blocks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
