import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { bikeTypes } from "@/lib/db/schema";

const USD_PRICE_RE = /^\d+(?:\.\d{1,2})?$/;
const MAX_DAILY_RATE_USD_CENTS = 999_999;

export type AdminPricingBikeType = {
  id: string;
  name: string;
  slug: string;
  dailyRateUsdCents: number;
  updatedAt: Date;
};

export type UpdateBikeTypePriceInput = {
  bikeTypeId: string;
  dailyRateUsd: string;
};

export type UpdateBikeTypePriceResult =
  | { status: "updated"; bikeType: AdminPricingBikeType }
  | { status: "error"; message: string; fieldErrors: Partial<Record<keyof UpdateBikeTypePriceInput, string>> };

type PricingDatabase = Pick<typeof db, "update">;

type UpdateBikeTypePriceOptions = {
  now?: Date;
};

function parseDailyRateUsdCents(value: string): number | null {
  const normalized = value.trim();

  if (!USD_PRICE_RE.test(normalized)) {
    return null;
  }

  const [dollarsPart, centsPart = ""] = normalized.split(".");
  const dollars = Number(dollarsPart);
  const cents = Number(centsPart.padEnd(2, "0"));
  const total = dollars * 100 + cents;

  if (!Number.isSafeInteger(total) || total <= 0 || total > MAX_DAILY_RATE_USD_CENTS) {
    return null;
  }

  return total;
}

function toAdminPricingBikeType(row: typeof bikeTypes.$inferSelect): AdminPricingBikeType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    dailyRateUsdCents: row.dailyRateUsdCents,
    updatedAt: row.updatedAt,
  };
}

export async function getAdminPricingBikeTypes(): Promise<AdminPricingBikeType[]> {
  const rows = await db
    .select({
      id: bikeTypes.id,
      name: bikeTypes.name,
      slug: bikeTypes.slug,
      dailyRateUsdCents: bikeTypes.dailyRateUsdCents,
      updatedAt: bikeTypes.updatedAt,
    })
    .from(bikeTypes)
    .where(eq(bikeTypes.isActive, true))
    .orderBy(asc(bikeTypes.sortOrder), asc(bikeTypes.name));

  return rows;
}

export async function updateBikeTypeDailyPrice(
  input: UpdateBikeTypePriceInput,
  database: PricingDatabase = db,
  options: UpdateBikeTypePriceOptions = {},
): Promise<UpdateBikeTypePriceResult> {
  const bikeTypeId = input.bikeTypeId.trim();
  const dailyRateUsdCents = parseDailyRateUsdCents(input.dailyRateUsd);
  const fieldErrors: Partial<Record<keyof UpdateBikeTypePriceInput, string>> = {};

  if (!bikeTypeId) {
    fieldErrors.bikeTypeId = "Choose an active bike type.";
  }

  if (dailyRateUsdCents === null) {
    fieldErrors.dailyRateUsd = "Enter a USD daily price from 0.01 to 9,999.99 with up to two decimals.";
  }

  if (Object.keys(fieldErrors).length > 0 || dailyRateUsdCents === null) {
    return {
      status: "error",
      message: "Please fix the highlighted fields before updating pricing.",
      fieldErrors,
    };
  }

  const [updated] = await database
    .update(bikeTypes)
    .set({
      dailyRateUsdCents,
      updatedAt: options.now ?? new Date(),
    })
    .where(and(eq(bikeTypes.id, bikeTypeId), eq(bikeTypes.isActive, true)))
    .returning();

  if (!updated || !updated.isActive) {
    return {
      status: "error",
      message: "Active bike type pricing could not be updated.",
      fieldErrors: { bikeTypeId: "Choose an active bike type." },
    };
  }

  return {
    status: "updated",
    bikeType: toAdminPricingBikeType(updated),
  };
}
