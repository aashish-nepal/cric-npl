import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { loadSite } from "@/services/cricket";
import { requirePermission } from "@/lib/auth/session";
import { createMatchAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/button";

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("scores.manage");
  const [{ error }, site] = await Promise.all([searchParams, loadSite()]);
  const { activeSeason, bundle } = site;

  return (
    <>
      <AdminPageHeading
        title="Create fixture"
        description="Fixtures are created as scheduled matches. Open the match console to set the toss and begin scoring."
        backHref="/admin/matches"
        backLabel="Matches"
      />
      <FlashMessages error={error} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Fixture details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMatchAction} className="space-y-4">
              <input type="hidden" name="seasonId" value={activeSeason.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="teamAId">Home team</Label>
                  <Select id="teamAId" name="teamAId" required defaultValue="">
                    <option value="" disabled>
                      Select team
                    </option>
                    {bundle.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="teamBId">Away team</Label>
                  <Select id="teamBId" name="teamBId" required defaultValue="">
                    <option value="" disabled>
                      Select team
                    </option>
                    {bundle.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field>
                <Label htmlFor="venueId">Venue</Label>
                <Select id="venueId" name="venueId" required defaultValue="">
                  <option value="" disabled>
                    Select venue
                  </option>
                  {bundle.venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}, {venue.city}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="scheduledAt">Start time (Nepal time)</Label>
                  <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
                  <p className="text-[11px] text-muted-foreground">Entered as Asia/Kathmandu (UTC+05:45).</p>
                </Field>
                <Field>
                  <Label htmlFor="matchNumber">Match number (optional)</Label>
                  <Input id="matchNumber" name="matchNumber" type="number" min={1} max={999} placeholder="Auto" />
                  <p className="text-[11px] text-muted-foreground">Leave blank to use the next number in the season.</p>
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <SubmitButton pendingLabel="Creating fixture…">
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  Create fixture
                </SubmitButton>
                <Link href="/admin/matches" className={buttonVariants({ variant: "ghost", size: "default" })}>
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Season context</p>
            <p className="mt-1">{activeSeason.name}</p>
            <p className="mt-2">
              {bundle.teams.length} teams · {bundle.venues.length} venues · {bundle.matches.length} matches already scheduled.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Scoring rules</p>
            <p className="mt-1">
              Innings are {activeSeason.settings.ballsPerInnings / 6} overs. Points: win {activeSeason.settings.pointsWin}, tie{" "}
              {activeSeason.settings.pointsTie}, no result {activeSeason.settings.pointsNoResult}.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
