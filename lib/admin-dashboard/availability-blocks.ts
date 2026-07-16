import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, gt, isNull, lt, ne, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  AVAILABILITY_BLOCK_STATUSES,
  availabilityBlocks,
  bikes,
  bikeTypes,
  reservations,
  type AvailabilityBlockStatus,
} from "@/lib/db/schema";

export type AdminAvailabilityBlock = {
  id: string;
  bikeTypeId: string | null;
  bikeTypeName: string | null;
  bikeId: string | null;
  bikeCode: string | null;
  label: string;
  status: AvailabilityBlockStatus;
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  updatedAt: Date;
};

export type AdminAvailabilityResource = {
  id: string;
  name: string;
  bikes: { id: string; code: string; status: string }[];
};

export type UpsertAvailabilityBlockInput = {
  blockId?: string;
  bikeTypeId: string;
  bikeId?: string;
  label: string;
  status: string;
  startsAt: string;
  endsAt: string;
  note?: string;
};

export type DeleteAvailabilityBlockInput = {
  blockId: string;
};

export type AvailabilityBlockFieldErrors = Partial<Record<keyof UpsertAvailabilityBlockInput, string>>;

export type UpsertAvailabilityBlockResult =
  | { status: "created" | "updated"; block: AdminAvailabilityBlock }
  | { status: "conflict"; message: string }
  | { status: "error"; message: string; fieldErrors: AvailabilityBlockFieldErrors };

export type DeleteAvailabilityBlockResult =
  | { status: "deleted"; blockId: string }
  | { status: "error"; message: string };

type AvailabilityBlockDatabase = typeof db;

type UpsertAvailabilityBlockOptions = {
  now?: Date;
  idFactory?: () => string;
};

function parseDateTime(value: string): Date | null {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseAvailabilityBlockStatus(value: string): AvailabilityBlockStatus | null {
  return AVAILABILITY_BLOCK_STATUSES.includes(value as AvailabilityBlockStatus)
    ? (value as AvailabilityBlockStatus)
    : null;
}

function validateAvailabilityBlockInput(input: UpsertAvailabilityBlockInput):
  | { ok: true; startsAt: Date; endsAt: Date; status: AvailabilityBlockStatus }
  | { ok: false; fieldErrors: AvailabilityBlockFieldErrors } {
  const fieldErrors: AvailabilityBlockFieldErrors = {};
  const startsAt = parseDateTime(input.startsAt);
  const endsAt = parseDateTime(input.endsAt);
  const status = parseAvailabilityBlockStatus(input.status);

  if (!input.bikeTypeId.trim()) {
    fieldErrors.bikeTypeId = "Choose a bike type.";
  }

  if (input.label.trim().length < 2) {
    fieldErrors.label = "Enter a reason or label.";
  }

  if (!status) {
    fieldErrors.status = "Choose a valid block status.";
  }

  if (!startsAt) {
    fieldErrors.startsAt = "Choose a valid start date and time.";
  }

  if (!endsAt) {
    fieldErrors.endsAt = "Choose a valid end date and time.";
  }

  if (startsAt && endsAt && endsAt <= startsAt) {
    fieldErrors.endsAt = "End must be after start.";
  }

  if (Object.keys(fieldErrors).length > 0 || !startsAt || !endsAt || !status) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, startsAt, endsAt, status };
}

function toAdminAvailabilityBlock(row: {
  id: string;
  bikeTypeId: string | null;
  bikeTypeName: string | null;
  bikeId: string | null;
  bikeCode: string | null;
  label: string;
  status: AvailabilityBlockStatus;
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  updatedAt: Date;
}): AdminAvailabilityBlock {
  return row;
}

export function getAvailabilityBlockStatuses(): readonly AvailabilityBlockStatus[] {
  return AVAILABILITY_BLOCK_STATUSES;
}

export async function getAdminAvailabilityResources(): Promise<AdminAvailabilityResource[]> {
  const rows = await db
    .select({
      bikeTypeId: bikeTypes.id,
      bikeTypeName: bikeTypes.name,
      bikeId: bikes.id,
      bikeCode: bikes.code,
      bikeStatus: bikes.status,
    })
    .from(bikeTypes)
    .leftJoin(bikes, eq(bikes.bikeTypeId, bikeTypes.id))
    .where(eq(bikeTypes.isActive, true))
    .orderBy(asc(bikeTypes.sortOrder), asc(bikeTypes.name), asc(bikes.code));

  const resources = new Map<string, AdminAvailabilityResource>();

  for (const row of rows) {
    const existing = resources.get(row.bikeTypeId) ?? { id: row.bikeTypeId, name: row.bikeTypeName, bikes: [] };

    if (row.bikeId && row.bikeCode) {
      existing.bikes.push({ id: row.bikeId, code: row.bikeCode, status: row.bikeStatus ?? "unknown" });
    }

    resources.set(row.bikeTypeId, existing);
  }

  return [...resources.values()];
}

export async function getAdminAvailabilityBlocks(): Promise<AdminAvailabilityBlock[]> {
  const rows = await db
    .select({
      id: availabilityBlocks.id,
      bikeTypeId: availabilityBlocks.bikeTypeId,
      bikeTypeName: bikeTypes.name,
      bikeId: availabilityBlocks.bikeId,
      bikeCode: bikes.code,
      label: availabilityBlocks.label,
      status: availabilityBlocks.status,
      startsAt: availabilityBlocks.startsAt,
      endsAt: availabilityBlocks.endsAt,
      note: availabilityBlocks.note,
      updatedAt: availabilityBlocks.updatedAt,
    })
    .from(availabilityBlocks)
    .leftJoin(bikeTypes, eq(availabilityBlocks.bikeTypeId, bikeTypes.id))
    .leftJoin(bikes, eq(availabilityBlocks.bikeId, bikes.id))
    .orderBy(desc(availabilityBlocks.startsAt))
    .limit(100);

  return rows.map(toAdminAvailabilityBlock);
}

async function getBikeBelongsToType(database: AvailabilityBlockDatabase, bikeId: string, bikeTypeId: string): Promise<boolean> {
  const [row] = await database
    .select({ id: bikes.id })
    .from(bikes)
    .where(and(eq(bikes.id, bikeId), eq(bikes.bikeTypeId, bikeTypeId)))
    .limit(1);

  return Boolean(row);
}

async function hasReservationConflict(
  database: AvailabilityBlockDatabase,
  input: { bikeTypeId: string; bikeId: string | null; startsAt: Date; endsAt: Date },
): Promise<boolean> {
  const rows = await database
    .select({ id: reservations.id })
    .from(reservations)
    .where(
      and(
        eq(reservations.bikeTypeId, input.bikeTypeId),
        or(eq(reservations.status, "pending"), eq(reservations.status, "confirmed")),
        lt(reservations.pickupAt, input.endsAt),
        gt(reservations.returnAt, input.startsAt),
        input.bikeId ? or(eq(reservations.bikeId, input.bikeId), isNull(reservations.bikeId)) : undefined,
      ),
    )
    .limit(1);

  return rows.length > 0;
}

async function hasAvailabilityBlockConflict(
  database: AvailabilityBlockDatabase,
  input: { blockId?: string; bikeTypeId: string; bikeId: string | null; startsAt: Date; endsAt: Date },
): Promise<boolean> {
  const rows = await database
    .select({ id: availabilityBlocks.id })
    .from(availabilityBlocks)
    .where(
      and(
        input.blockId ? ne(availabilityBlocks.id, input.blockId) : undefined,
        lt(availabilityBlocks.startsAt, input.endsAt),
        gt(availabilityBlocks.endsAt, input.startsAt),
        input.bikeId
          ? or(
              eq(availabilityBlocks.bikeId, input.bikeId),
              and(eq(availabilityBlocks.bikeTypeId, input.bikeTypeId), isNull(availabilityBlocks.bikeId)),
            )
          : or(eq(availabilityBlocks.bikeTypeId, input.bikeTypeId), isNull(availabilityBlocks.bikeTypeId)),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function upsertAvailabilityBlock(
  input: UpsertAvailabilityBlockInput,
  database: AvailabilityBlockDatabase = db,
  options: UpsertAvailabilityBlockOptions = {},
): Promise<UpsertAvailabilityBlockResult> {
  const validation = validateAvailabilityBlockInput(input);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields before saving the availability block.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const bikeTypeId = input.bikeTypeId.trim();
  const bikeId = input.bikeId?.trim() || null;

  if (bikeId && !(await getBikeBelongsToType(database, bikeId, bikeTypeId))) {
    return {
      status: "error",
      message: "Selected bike does not belong to the selected bike type.",
      fieldErrors: { bikeId: "Choose a bike from the selected bike type." },
    };
  }

  if (
    await hasReservationConflict(database, {
      bikeTypeId,
      bikeId,
      startsAt: validation.startsAt,
      endsAt: validation.endsAt,
    })
  ) {
    return {
      status: "conflict",
      message: "This block overlaps an existing pending or confirmed reservation.",
    };
  }

  if (
    await hasAvailabilityBlockConflict(database, {
      blockId: input.blockId?.trim() || undefined,
      bikeTypeId,
      bikeId,
      startsAt: validation.startsAt,
      endsAt: validation.endsAt,
    })
  ) {
    return {
      status: "conflict",
      message: "This block overlaps an existing availability block for the same resource.",
    };
  }

  const now = options.now ?? new Date();
  const values = {
    bikeTypeId,
    bikeId,
    label: input.label.trim(),
    status: validation.status,
    startsAt: validation.startsAt,
    endsAt: validation.endsAt,
    note: input.note?.trim() || null,
    updatedAt: now,
  };

  if (input.blockId?.trim()) {
    const [updated] = await database
      .update(availabilityBlocks)
      .set(values)
      .where(eq(availabilityBlocks.id, input.blockId.trim()))
      .returning();

    if (!updated) {
      return {
        status: "error",
        message: "Availability block could not be updated.",
        fieldErrors: { blockId: "Choose an existing availability block." },
      };
    }

    return {
      status: "updated",
      block: toAdminAvailabilityBlock({
        ...updated,
        bikeTypeName: null,
        bikeCode: null,
      }),
    };
  }

  const [created] = await database
    .insert(availabilityBlocks)
    .values({
      id: options.idFactory?.() ?? randomUUID(),
      ...values,
      createdAt: now,
    })
    .returning();

  return {
    status: "created",
    block: toAdminAvailabilityBlock({
      ...created,
      bikeTypeName: null,
      bikeCode: null,
    }),
  };
}

export async function deleteAvailabilityBlock(
  input: DeleteAvailabilityBlockInput,
  database: AvailabilityBlockDatabase = db,
): Promise<DeleteAvailabilityBlockResult> {
  const blockId = input.blockId.trim();

  if (!blockId) {
    return { status: "error", message: "Choose an availability block to delete." };
  }

  const [deleted] = await database.delete(availabilityBlocks).where(eq(availabilityBlocks.id, blockId)).returning();

  if (!deleted) {
    return { status: "error", message: "Availability block could not be deleted." };
  }

  return { status: "deleted", blockId: deleted.id };
}
