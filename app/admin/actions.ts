"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAuthenticatedAdmin } from "@/lib/admin-auth/auth";
import { clearAdminSession } from "@/lib/admin-auth/session";
import { createManualReservation } from "@/lib/admin-dashboard/manual-reservations";

export async function logoutAdmin(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function createManualReservationAction(formData: FormData): Promise<void> {
  await requireAuthenticatedAdmin();

  const result = await createManualReservation({
    bikeTypeId: String(formData.get("bikeTypeId") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    pickupAt: String(formData.get("pickupAt") ?? ""),
    returnAt: String(formData.get("returnAt") ?? ""),
    status: String(formData.get("status") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/admin/reservations");

  if (result.status === "created") {
    redirect(`/admin/reservations?created=${encodeURIComponent(result.reservation.reference)}`);
  }

  redirect(`/admin/reservations?createError=${encodeURIComponent(result.message)}`);
}
