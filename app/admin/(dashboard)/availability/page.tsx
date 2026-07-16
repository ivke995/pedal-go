import { upsertAvailabilityBlockAction, deleteAvailabilityBlockAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getAdminAvailabilityBlocks,
  getAdminAvailabilityResources,
  getAvailabilityBlockStatuses,
  type AdminAvailabilityBlock,
} from "@/lib/admin-dashboard/availability-blocks";

export const metadata = {
  title: "Availability — PedalGo Admin",
};

type AdminAvailabilityPageProps = {
  searchParams: Promise<{
    blockSaved?: string | string[];
    blockDeleted?: string | string[];
    blockError?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function statusLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function toDateTimeLocal(value: Date): string {
  const offsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
}

function BlockStatusBadge({ status }: { status: AdminAvailabilityBlock["status"] }) {
  const variant = status === "maintenance" ? "secondary" : status === "inactive" ? "destructive" : "default";

  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}

export default async function AdminAvailabilityPage({ searchParams }: AdminAvailabilityPageProps) {
  const [params, resources, blocks] = await Promise.all([
    searchParams,
    getAdminAvailabilityResources(),
    getAdminAvailabilityBlocks(),
  ]);
  const blockSaved = firstParam(params.blockSaved).trim();
  const blockDeleted = firstParam(params.blockDeleted).trim();
  const blockError = firstParam(params.blockError).trim();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>
            Block a bike type or specific bike for maintenance, repairs, internal use, or inactive periods. Saved blocks
            are used by the same availability checks that power public booking and manual reservations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockSaved ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Saved availability block “{blockSaved}”. New conflicting booking attempts are blocked.
            </div>
          ) : null}
          {blockDeleted ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Deleted availability block. Matching windows can be booked again if no other conflicts exist.
            </div>
          ) : null}
          {blockError ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {blockError}
            </div>
          ) : null}

          <form action={upsertAvailabilityBlockAction} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="availability-bike-type">
                Bike type
              </label>
              <select
                id="availability-bike-type"
                name="bikeTypeId"
                required
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {resources.length === 0 ? <option value="">No active bike types</option> : null}
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="availability-bike">
                Specific bike
              </label>
              <select
                id="availability-bike"
                name="bikeId"
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Entire selected bike type</option>
                {resources.map((resource) => (
                  <optgroup key={resource.id} label={resource.name}>
                    {resource.bikes.map((bike) => (
                      <option key={bike.id} value={bike.id}>
                        {bike.code} — {statusLabel(bike.status)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank to block every bike in the selected type.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="availability-label">
                Reason / label
              </label>
              <Input id="availability-label" name="label" required minLength={2} placeholder="Maintenance" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="availability-status">
                Status
              </label>
              <select
                id="availability-status"
                name="status"
                defaultValue="maintenance"
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {getAvailabilityBlockStatuses().map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="availability-starts">
                Starts
              </label>
              <Input id="availability-starts" name="startsAt" type="datetime-local" required className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="availability-ends">
                Ends
              </label>
              <Input id="availability-ends" name="endsAt" type="datetime-local" required className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium" htmlFor="availability-note">
                Internal note
              </label>
              <Input id="availability-note" name="note" placeholder="Optional details" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={resources.length === 0}>
                Create availability block
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Blocks cannot overlap pending/confirmed reservations or existing blocks for the same resource.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability blocks</CardTitle>
          <CardDescription>Showing the newest {blocks.length.toLocaleString()} availability block records.</CardDescription>
        </CardHeader>
        <CardContent>
          {blocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      <div className="font-medium">{block.label}</div>
                      {block.note ? <div className="text-xs text-muted-foreground">{block.note}</div> : null}
                      <div className="text-xs text-muted-foreground">Updated {formatDateTime(block.updatedAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div>{block.bikeTypeName ?? "All bike types"}</div>
                      <div className="text-xs text-muted-foreground">{block.bikeCode ?? "Entire bike type"}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatDateTime(block.startsAt)}</div>
                      <div className="text-xs text-muted-foreground">Until {formatDateTime(block.endsAt)}</div>
                    </TableCell>
                    <TableCell>
                      <BlockStatusBadge status={block.status} />
                    </TableCell>
                    <TableCell>
                      <form action={upsertAvailabilityBlockAction} className="grid min-w-64 gap-2">
                        <input type="hidden" name="blockId" value={block.id} />
                        <select name="bikeTypeId" defaultValue={block.bikeTypeId ?? ""} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                          {resources.map((resource) => (
                            <option key={resource.id} value={resource.id}>
                              {resource.name}
                            </option>
                          ))}
                        </select>
                        <select name="bikeId" defaultValue={block.bikeId ?? ""} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                          <option value="">Entire selected bike type</option>
                          {resources.map((resource) => (
                            <optgroup key={resource.id} label={resource.name}>
                              {resource.bikes.map((bike) => (
                                <option key={bike.id} value={bike.id}>
                                  {bike.code}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <Input name="label" defaultValue={block.label} aria-label={`Label for ${block.label}`} required />
                        <select name="status" defaultValue={block.status} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
                          {getAvailabilityBlockStatuses().map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>
                        <Input name="startsAt" type="datetime-local" defaultValue={toDateTimeLocal(block.startsAt)} aria-label={`Start for ${block.label}`} required />
                        <Input name="endsAt" type="datetime-local" defaultValue={toDateTimeLocal(block.endsAt)} aria-label={`End for ${block.label}`} required />
                        <Input name="note" defaultValue={block.note ?? ""} placeholder="Note" aria-label={`Note for ${block.label}`} />
                        <Button type="submit" variant="outline" size="sm">
                          Save changes
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={deleteAvailabilityBlockAction}>
                        <input type="hidden" name="blockId" value={block.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">No availability blocks yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a maintenance or inactive block to make the matching rental window unavailable.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
