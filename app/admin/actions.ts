"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAuthenticatedAdmin } from "@/lib/admin-auth/auth";
import { deleteAvailabilityBlock, upsertAvailabilityBlock } from "@/lib/admin-dashboard/availability-blocks";
import { cancelReservation } from "@/lib/admin-dashboard/cancellations";
import { clearAdminSession } from "@/lib/admin-auth/session";
import { createManualReservation } from "@/lib/admin-dashboard/manual-reservations";
import { updateBikeTypeDailyPrice } from "@/lib/admin-dashboard/pricing";

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

export async function cancelReservationAction(formData: FormData): Promise<void> {
  await requireAuthenticatedAdmin();

  const result = await cancelReservation({
    reservationId: String(formData.get("reservationId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  revalidatePath("/admin/reservations");

  if (result.status === "cancelled") {
    redirect(`/admin/reservations?cancelled=${encodeURIComponent(result.reservation.reference)}`);
  }

  redirect(`/admin/reservations?cancelError=${encodeURIComponent(result.message)}`);
}

export async function updateBikeTypeDailyPriceAction(formData: FormData): Promise<void> {
  await requireAuthenticatedAdmin();

  const result = await updateBikeTypeDailyPrice({
    bikeTypeId: String(formData.get("bikeTypeId") ?? ""),
    dailyRateUsd: String(formData.get("dailyRateUsd") ?? ""),
  });

  revalidatePath("/admin/pricing");
  revalidatePath("/");
  revalidatePath("/booking");

  if (result.status === "updated") {
    redirect(`/admin/pricing?updated=${encodeURIComponent(result.bikeType.name)}`);
  }

  redirect(`/admin/pricing?priceError=${encodeURIComponent(result.message)}`);
}

export async function upsertAvailabilityBlockAction(formData: FormData): Promise<void> {
  await requireAuthenticatedAdmin();

  const result = await upsertAvailabilityBlock({
    blockId: String(formData.get("blockId") ?? ""),
    bikeTypeId: String(formData.get("bikeTypeId") ?? ""),
    bikeId: String(formData.get("bikeId") ?? ""),
    label: String(formData.get("label") ?? ""),
    status: String(formData.get("status") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  revalidatePath("/admin/availability");
  revalidatePath("/");
  revalidatePath("/booking");
  revalidatePath("/admin/reservations");

  switch (result.status) {
    case "created":
    case "updated":
      redirect(`/admin/availability?blockSaved=${encodeURIComponent(result.block.label)}`);
    case "conflict":
      redirect(`/admin/availability?blockError=${encodeURIComponent(result.message)}`);
    case "error":
      redirect(`/admin/availability?blockError=${encodeURIComponent(result.message)}`);
  }
}

export async function deleteAvailabilityBlockAction(formData: FormData): Promise<void> {
  await requireAuthenticatedAdmin();

  const result = await deleteAvailabilityBlock({
    blockId: String(formData.get("blockId") ?? ""),
  });

  revalidatePath("/admin/availability");
  revalidatePath("/");
  revalidatePath("/booking");
  revalidatePath("/admin/reservations");

  if (result.status === "deleted") {
    redirect("/admin/availability?blockDeleted=1");
  }

  redirect(`/admin/availability?blockError=${encodeURIComponent(result.message)}`);
}
