import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Reservations — PedalGo Admin",
};

export default function AdminReservationsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reservations</CardTitle>
          <CardDescription>Reservation list, search, status filters, and payment visibility land here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This protected route establishes the reservation management boundary for upcoming list, search, manual
            creation, and cancellation tasks.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
