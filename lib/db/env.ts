import { loadLocalEnv } from "./load-env";

loadLocalEnv();

export type LibSqlConfig = {
  url: string;
  authToken?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set ${name} before initializing the database client.`,
    );
  }

  return value;
}

export function getLibSqlConfig(): LibSqlConfig {
  const url = getRequiredEnv("TURSO_DATABASE_URL");
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url.startsWith("file:") && !authToken) {
    throw new Error(
      "Missing required environment variable: TURSO_AUTH_TOKEN. Remote Turso/libSQL databases require TURSO_AUTH_TOKEN; local file: databases do not.",
    );
  }

  return {
    url,
    authToken,
  };
}
