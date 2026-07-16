import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBikeTypeDailyPriceAction } from "@/app/admin/actions";
import { getAdminPricingBikeTypes } from "@/lib/admin-dashboard/pricing";
import { formatCurrency } from "@/lib/pricing";

export const metadata = {
  title: "Pricing — PedalGo Admin",
};

type AdminPricingPageProps = {
  searchParams: Promise<{
    updated?: string | string[];
    priceError?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminPricingPage({ searchParams }: AdminPricingPageProps) {
  const [params, bikeTypePrices] = await Promise.all([searchParams, getAdminPricingBikeTypes()]);
  const updatedName = firstParam(params.updated).trim();
  const priceError = firstParam(params.priceError).trim();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>
            Manage active bike-type daily rates. New customer quotes and manual reservations use the latest rate, while
            existing reservation totals stay unchanged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {updatedName ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Updated daily pricing for {updatedName}. New booking quotes will use the new rate.
            </div>
          ) : null}
          {priceError ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {priceError}
            </div>
          ) : null}

          {bikeTypePrices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active bike types are available for pricing updates.</p>
          ) : (
            <div className="space-y-4">
              {bikeTypePrices.map((bikeType) => (
                <form
                  key={bikeType.id}
                  action={updateBikeTypeDailyPriceAction}
                  className="grid gap-4 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end"
                >
                  <input type="hidden" name="bikeTypeId" value={bikeType.id} />
                  <div>
                    <h2 className="text-base font-semibold">{bikeType.name}</h2>
                    <p className="text-sm text-muted-foreground">Slug: {bikeType.slug}</p>
                    <p className="mt-1 text-sm">
                      Current rate: <span className="font-medium">{formatCurrency(bikeType.dailyRateUsdCents / 100)} / day</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Last updated {formatDateTime(bikeType.updatedAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium" htmlFor={`daily-rate-${bikeType.id}`}>
                      New daily price (USD)
                    </label>
                    <Input
                      id={`daily-rate-${bikeType.id}`}
                      name="dailyRateUsd"
                      inputMode="decimal"
                      pattern="^\\d+(\\.\\d{1,2})?$"
                      required
                      min="0.01"
                      step="0.01"
                      defaultValue={(bikeType.dailyRateUsdCents / 100).toFixed(2)}
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit">Update price</Button>
                </form>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Price updates modify active bike-type rates only. Reservation rows store their own daily and total USD cents,
            so paid and historical totals are not recalculated.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
