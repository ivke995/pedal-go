import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Pricing — PedalGo Admin",
};

export default function AdminPricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Featured rental daily-rate management lands here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This protected route establishes the pricing boundary for the MVP bike type without changing current booking
            calculations yet.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
