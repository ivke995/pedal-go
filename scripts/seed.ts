import { pbkdf2Sync, randomBytes } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "../lib/db/client";
import { adminUsers, bikes, bikeTypes } from "../lib/db/schema";

const MVP_BIKE_TYPE = {
  id: "bike-type-mvp-city-bike",
  name: "PedalGo City Bike",
  slug: "city-bike",
  description: "Comfortable all-purpose city bike for PedalGo MVP rentals.",
  dailyRateUsdCents: 2500,
  imagePath: "/bikes/city-bike.jpg",
  featuresJson: ["Step-through frame", "Front basket", "Integrated lights", "Helmet included"] as string[],
  isActive: true,
  sortOrder: 1,
} as const;

const MVP_BIKES = [
  {
    id: "bike-mvp-city-001",
    bikeTypeId: MVP_BIKE_TYPE.id,
    code: "CITY-001",
    status: "available" as const,
    notes: "MVP seed inventory.",
  },
  {
    id: "bike-mvp-city-002",
    bikeTypeId: MVP_BIKE_TYPE.id,
    code: "CITY-002",
    status: "available" as const,
    notes: "MVP seed inventory.",
  },
] as const;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Set ${name} before running pnpm db:seed.`);
  }

  return value;
}

function hashAdminPassword(password: string): string {
  const iterations = 310_000;
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64url");

  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

async function seed() {
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@pedalgo.local";
  const adminPassword = getRequiredEnv("ADMIN_BOOTSTRAP_PASSWORD");
  const adminName = process.env.ADMIN_BOOTSTRAP_NAME ?? "PedalGo Admin";

  await db
    .insert(bikeTypes)
    .values(MVP_BIKE_TYPE)
    .onConflictDoUpdate({
      target: bikeTypes.id,
      set: {
        name: MVP_BIKE_TYPE.name,
        slug: MVP_BIKE_TYPE.slug,
        description: MVP_BIKE_TYPE.description,
        dailyRateUsdCents: MVP_BIKE_TYPE.dailyRateUsdCents,
        imagePath: MVP_BIKE_TYPE.imagePath,
        featuresJson: MVP_BIKE_TYPE.featuresJson,
        isActive: MVP_BIKE_TYPE.isActive,
        sortOrder: MVP_BIKE_TYPE.sortOrder,
        updatedAt: new Date(),
      },
    });

  for (const bike of MVP_BIKES) {
    await db
      .insert(bikes)
      .values(bike)
      .onConflictDoUpdate({
        target: bikes.id,
        set: {
          bikeTypeId: bike.bikeTypeId,
          code: bike.code,
          status: bike.status,
          notes: bike.notes,
          updatedAt: new Date(),
        },
      });
  }

  await db
    .insert(adminUsers)
    .values({
      id: "admin-bootstrap",
      email: adminEmail,
      name: adminName,
      passwordHash: hashAdminPassword(adminPassword),
      status: "active",
    })
    .onConflictDoUpdate({
      target: adminUsers.id,
      set: {
        email: adminEmail,
        name: adminName,
        passwordHash: hashAdminPassword(adminPassword),
        status: "active",
        updatedAt: new Date(),
      },
    });

  const [seededBikeType] = await db.select().from(bikeTypes).where(eq(bikeTypes.id, MVP_BIKE_TYPE.id));
  const seededBikes = await db.select().from(bikes).where(eq(bikes.bikeTypeId, MVP_BIKE_TYPE.id));
  const [seededAdmin] = await db.select().from(adminUsers).where(eq(adminUsers.id, "admin-bootstrap"));

  console.info("Seed complete:");
  console.info(`- Bike type: ${seededBikeType?.name} (${seededBikeType?.dailyRateUsdCents} USD cents/day)`);
  console.info(`- Bikes: ${seededBikes.map((bike) => bike.code).join(", ")}`);
  console.info(`- Admin user: ${seededAdmin?.email} (${seededAdmin?.status})`);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
