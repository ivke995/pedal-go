import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Reports — PedalGo Admin",
};

export default function AdminReportsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Operational reports and dashboard summaries land here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This protected route establishes the reporting boundary for future booking, revenue, and utilization views.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
