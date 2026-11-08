import Link from "next/link";
import { MapPin, Plus, Save } from "lucide-react";
import { loadSite } from "@/services/cricket";
import { requirePermission } from "@/lib/auth/session";
import { createVenueAction, updateVenueAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requirePermission("competition.manage");
  const [{ message, error }, site] = await Promise.all([searchParams, loadSite()]);
  const { venues } = site.bundle;

  return (
    <>
      <AdminPageHeading
        title="Venues"
        description="Grounds used by fixtures. Venue records drive match pages, SEO profiles and fixture scheduling."
      />
      <FlashMessages message={message} error={error} />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>All venues</CardTitle>
            <span className="text-xs text-muted-foreground">{venues.length} grounds</span>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead className="hidden sm:table-cell">City</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Capacity</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell>
                      <p className="text-xs font-semibold">{venue.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{venue.slug}</p>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {venue.city}, {venue.country}
                    </TableCell>
                    <TableCell className="hidden text-right text-xs tabular md:table-cell">
                      {venue.capacity ? venue.capacity.toLocaleString("en-GB") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/venues/${venue.slug}`} className="text-xs font-semibold text-primary hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle>Add venue</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createVenueAction} className="space-y-3">
                <Field>
                  <Label htmlFor="name">Venue name</Label>
                  <Input id="name" name="name" required minLength={2} maxLength={120} placeholder="Mulpani Cricket Stadium" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" required minLength={2} maxLength={120} placeholder="Kathmandu" />
                  </Field>
                  <Field>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" name="capacity" type="number" min={1} max={500000} placeholder="Optional" />
                  </Field>
                </div>
                <Field>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" defaultValue="Nepal" maxLength={80} />
                </Field>
                <Field>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} maxLength={2000} className="min-h-20" />
                </Field>
                <SubmitButton size="sm" pendingLabel="Creating…">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Create venue
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit venue</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateVenueAction} className="space-y-3">
                <Field>
                  <Label htmlFor="venueId">Venue</Label>
                  <select
                    id="venueId"
                    name="venueId"
                    required
                    className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm"
                    defaultValue={venues[0]?.id ?? ""}
                  >
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" name="name" required minLength={2} maxLength={120} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <Label htmlFor="edit-city">City</Label>
                    <Input id="edit-city" name="city" required minLength={2} maxLength={120} />
                  </Field>
                  <Field>
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input id="edit-capacity" name="capacity" type="number" min={1} max={500000} />
                  </Field>
                </div>
                <Field>
                  <Label htmlFor="edit-country">Country</Label>
                  <Input id="edit-country" name="country" defaultValue="Nepal" maxLength={80} />
                </Field>
                <Field>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" rows={2} maxLength={2000} className="min-h-16" />
                </Field>
                <SubmitButton size="sm" variant="secondary" pendingLabel="Saving…">
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  Save venue
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
