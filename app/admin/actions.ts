"use server";

import { redirect } from "next/navigation";

import { clearAdminSession } from "@/lib/admin-auth/session";

export async function logoutAdmin(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}
