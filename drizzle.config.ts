import { defineConfig } from "drizzle-kit";

import { loadLocalEnv } from "./lib/db/load-env";

loadLocalEnv();

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set ${name} in your deployment environment, .env.local, or .env file.`,
    );
  }

  return value;
}

const databaseUrl = getRequiredEnv("TURSO_DATABASE_URL");

if (!databaseUrl.startsWith("file:") && !process.env.TURSO_AUTH_TOKEN) {
  throw new Error(
    "Missing required environment variable: TURSO_AUTH_TOKEN. Remote Turso/libSQL databases require TURSO_AUTH_TOKEN; local file: databases do not.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
