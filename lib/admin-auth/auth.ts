import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";

import { verifyAdminPassword } from "./password";
import { createAdminSession, getAdminSession } from "./session";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string | null;
};

export async function authenticateAdmin(email: string, password: string): Promise<AuthenticatedAdmin | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.email, normalizedEmail)).limit(1);

  if (!adminUser || adminUser.status !== "active") {
    return null;
  }

  if (!verifyAdminPassword(password, adminUser.passwordHash)) {
    return null;
  }

  await db.update(adminUsers).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(adminUsers.id, adminUser.id));

  await createAdminSession({
    adminUserId: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
  });

  return {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
  };
}

export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  const [adminUser] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.adminUserId)).limit(1);

  if (!adminUser || adminUser.status !== "active") {
    return null;
  }

  return {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
  };
}

export async function requireAuthenticatedAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
