import { redirect } from "next/navigation";

import { getAuthenticatedAdmin } from "@/lib/admin-auth/auth";

import { AdminLoginForm } from "./login-form";

export const metadata = {
  title: "Admin sign in — PedalGo",
};

export default async function AdminLoginPage() {
  const admin = await getAuthenticatedAdmin();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <AdminLoginForm />
    </main>
  );
}
