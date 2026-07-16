import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Admin dashboard — PedalGo",
};

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin dashboard</CardTitle>
          <CardDescription>
            Authentication is active. Dashboard navigation and operational tools are implemented in later tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use this protected route to verify that signed-in administrators can access the admin area and unauthenticated
            visitors are redirected to the sign-in page.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
