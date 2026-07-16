import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminReservations,
  parsePaymentStatus,
  parseReservationStatus,
  type AdminReservationListItem,
} from "@/lib/admin-dashboard/reservations";
import { PAYMENT_STATUSES, RESERVATION_STATUSES } from "@/lib/db/schema";
import { formatCurrency, formatDateTime, formatDuration } from "@/lib/pricing";

export const metadata = {
  title: "Reservations — PedalGo Admin",
};

type AdminReservationsPageProps = {
  searchParams: Promise<{
    search?: string | string[];
    status?: string | string[];
    paymentStatus?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function statusLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
}

function ReservationStatusBadge({ status }: { status: AdminReservationListItem["reservationStatus"] }) {
  const variant = status === "cancelled" || status === "failed" ? "destructive" : status === "pending" ? "secondary" : "default";

  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

function PaymentStatusBadge({ status }: { status: AdminReservationListItem["paymentStatus"] }) {
  if (status === "none") return <Badge variant="outline">No payment</Badge>;

  const variant = status === "failed" ? "destructive" : status === "pending" ? "secondary" : "default";

  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

export default async function AdminReservationsPage({ searchParams }: AdminReservationsPageProps) {
  const params = await searchParams;
  const search = firstParam(params.search).trim();
  const reservationStatus = parseReservationStatus(firstParam(params.status));
  const paymentStatus = parsePaymentStatus(firstParam(params.paymentStatus));
  const result = await getAdminReservations({ search, reservationStatus, paymentStatus });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
          <CardDescription>
            Search bookings by reference or customer details, filter by reservation/payment status, and review rental
            state in one protected admin view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]" action="/admin/reservations">
            <div>
              <label className="text-sm font-medium" htmlFor="reservation-search">
                Search
              </label>
              <Input
                id="reservation-search"
                name="search"
                defaultValue={search}
                placeholder="Reference, name, email, or phone"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="reservation-status">
                Reservation status
              </label>
              <select
                id="reservation-status"
                name="status"
                defaultValue={reservationStatus}
                className="mt-1 h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="all">All statuses</option>
                {RESERVATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="payment-status">
                Payment status
              </label>
              <select
                id="payment-status"
                name="paymentStatus"
                defaultValue={paymentStatus}
                className="mt-1 h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                <option value="all">All payments</option>
                <option value="none">No payment</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply</Button>
              <Button type="reset" variant="outline" render={<a href="/admin/reservations" />}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservation records</CardTitle>
          <CardDescription>
            Showing {result.totalShown.toLocaleString()} reservation{result.totalShown === 1 ? "" : "s"}; newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.reservations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reservation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rental window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div className="font-medium">{reservation.reference}</div>
                      <div className="text-xs text-muted-foreground">
                        {reservation.bikeTypeName} · {reservation.bikeCode ?? "Unassigned bike"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{reservation.customerName}</div>
                      <div className="text-xs text-muted-foreground">{reservation.customerEmail}</div>
                      <div className="text-xs text-muted-foreground">{reservation.customerPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatDateTime(reservation.pickupAt)}</div>
                      <div className="text-xs text-muted-foreground">Return {formatDateTime(reservation.returnAt)}</div>
                      <div className="text-xs text-muted-foreground">{formatDuration(reservation.rentalDays)}</div>
                    </TableCell>
                    <TableCell>
                      <ReservationStatusBadge status={reservation.reservationStatus} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={reservation.paymentStatus} />
                      {reservation.paymentProvider ? (
                        <div className="mt-1 text-xs text-muted-foreground">{reservation.paymentProvider}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(reservation.totalUsdCents / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No reservations found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting the search text or status filters.</p>
            </div>
          )}
          {result.totalShown >= result.limit ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Showing the first {result.limit.toLocaleString()} matching rows. Narrow the filters to locate older
              reservations.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
