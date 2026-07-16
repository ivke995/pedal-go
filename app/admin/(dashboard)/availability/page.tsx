import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Availability — PedalGo Admin",
};

export default function AdminAvailabilityPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>Maintenance, inactive periods, and internal-use blocks land here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This protected route establishes the availability-block management boundary for later conflict-aware CRUD.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
