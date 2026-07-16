import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/pricing";
import { getAdminDashboardSummary } from "@/lib/admin-dashboard/summary";

export const metadata = {
  title: "Admin dashboard — PedalGo",
};

export default async function AdminDashboardPage() {
  const summary = await getAdminDashboardSummary();
  const metrics = [
    { label: "Total reservations", value: summary.totalReservations.toLocaleString(), hint: "All reservation records" },
    { label: "Pending reservations", value: summary.pendingReservations.toLocaleString(), hint: "Awaiting payment or admin review" },
    { label: "Confirmed reservations", value: summary.confirmedReservations.toLocaleString(), hint: "Booked rentals" },
    { label: "Pending payments", value: summary.pendingPayments.toLocaleString(), hint: "Open Stripe/admin payment records" },
    {
      label: "Confirmed revenue",
      value: formatCurrency(summary.confirmedRevenueUsdCents / 100),
      hint: "Confirmed payment total",
    },
    { label: "Active blocks", value: summary.activeAvailabilityBlocks.toLocaleString(), hint: "Current or future unavailable periods" },
    { label: "Active bike types", value: summary.activeBikeTypes.toLocaleString(), hint: "Rentable categories" },
    { label: "Physical bikes", value: summary.physicalBikes.toLocaleString(), hint: "Inventory units" },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Operations summary</CardTitle>
          <CardDescription>
            Live database-backed boundaries for reservations, payments, inventory, and availability.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next operations</CardTitle>
            <CardDescription>Use the dashboard navigation to move into each MVP admin workflow.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Reservations will list and search customer bookings.</li>
              <li>Pricing will update the featured rental daily rate.</li>
              <li>Availability and calendar views will expose maintenance blocks and booking gaps.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Protected access</CardTitle>
            <CardDescription>All dashboard sections inherit the authenticated admin layout.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Unauthenticated visitors are redirected to `/admin/login`; signed-in active admins can navigate the admin
              route tree and log out from the shared header.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
