import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE_NAME = "pedalgo_admin_session";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export type AdminSession = {
  adminUserId: string;
  email: string;
  name: string | null;
  expiresAt: number;
};

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: ADMIN_SESSION_SECRET.");
  }

  return "pedalgo-local-admin-session-secret-change-me";
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

function decodeSession(cookieValue: string | undefined): AdminSession | null {
  if (!cookieValue) {
    return null;
  }

  const [payload, signature] = cookieValue.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AdminSession>;

    if (
      typeof decoded.adminUserId !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.expiresAt !== "number"
    ) {
      return null;
    }

    if (decoded.expiresAt <= Date.now()) {
      return null;
    }

    return {
      adminUserId: decoded.adminUserId,
      email: decoded.email,
      name: typeof decoded.name === "string" ? decoded.name : null,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function createAdminSession(input: Omit<AdminSession, "expiresAt">): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, encodeSession({ ...input, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    expires: new Date(expiresAt),
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  return decodeSession(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    expires: new Date(0),
  });
}
