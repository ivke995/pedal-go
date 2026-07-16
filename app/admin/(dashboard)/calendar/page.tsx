import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Calendar — PedalGo Admin",
};

export default function AdminCalendarPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>Calendar-oriented reservation and maintenance visibility lands here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This protected route establishes the schedule view boundary for reservations, rentals, unavailable periods,
            and future date navigation.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
