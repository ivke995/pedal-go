"use server";

import { redirect } from "next/navigation";

import { authenticateAdmin } from "@/lib/admin-auth/auth";

export type LoginFormState = {
  error: string | null;
};

export async function loginAdmin(_previousState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const admin = await authenticateAdmin(email, password);

  if (!admin) {
    return { error: "Invalid email or password." };
  }

  redirect("/admin");
}
