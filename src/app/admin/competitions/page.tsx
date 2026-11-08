import { CalendarRange, Plus, Trophy } from "lucide-react";
import { loadSite } from "@/services/cricket";
import { getRepository } from "@/lib/data";
import { requirePermission } from "@/lib/auth/session";
import { createSeasonAction, createTournamentAction, updateSeasonStatusAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT = { active: "success", upcoming: "accent", completed: "secondary" } as const;

export default async function AdminCompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requirePermission("competition.manage");
  const [{ message, error }, site, tournaments] = await Promise.all([
    searchParams,
    loadSite(),
    getRepository().getTournaments(),
  ]);
  const { seasons } = site;

  return (
    <>
      <AdminPageHeading
        title="Competition setup"
        description="Tournaments and seasons. Only one season is active at a time; activating a season marks the previous active season as completed."
      />
      <FlashMessages message={message} error={error} />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>Seasons</CardTitle>
              <Badge variant="secondary">{seasons.length}</Badge>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead className="hidden sm:table-cell">Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell>
                        <p className="text-xs font-semibold">{season.name}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{season.slug}</p>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {season.startDate} → {season.endDate}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[season.status]}>{season.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={updateSeasonStatusAction} className="inline-flex gap-1">
                          <input type="hidden" name="seasonId" value={season.id} />
                          {season.status !== "active" ? (
                            <button
                              type="submit"
                              name="status"
                              value="active"
                              className="rounded border border-primary/30 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/5"
                            >
                              Activate
                            </button>
                          ) : null}
                          {season.status !== "completed" ? (
                            <button
                              type="submit"
                              name="status"
                              value="completed"
                              className="rounded border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
                            >
                              Complete
                            </button>
                          ) : null}
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle>Tournaments</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {tournaments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tournaments configured.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {tournaments.map((tournament) => (
                    <li key={tournament.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div>
                        <p className="text-xs font-semibold">{tournament.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {tournament.format} · {tournament.country}
                        </p>
                      </div>
                      <Badge variant="secondary">{seasons.filter((row) => row.tournamentId === tournament.id).length} seasons</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle>Create season</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createSeasonAction} className="space-y-3">
                <Field>
                  <Label htmlFor="tournamentId">Tournament</Label>
                  <Select id="tournamentId" name="tournamentId" required defaultValue={tournaments[0]?.id ?? ""}>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="name">Season name</Label>
                  <Input id="name" name="name" required minLength={3} maxLength={120} placeholder="NPL 2027" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" name="year" type="number" required min={1900} max={2200} defaultValue={new Date().getFullYear() + 1} />
                  </Field>
                  <Field>
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" name="status" defaultValue="upcoming">
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <Label htmlFor="startDate">Start date</Label>
                    <Input id="startDate" name="startDate" type="date" required />
                  </Field>
                  <Field>
                    <Label htmlFor="endDate">End date</Label>
                    <Input id="endDate" name="endDate" type="date" required />
                  </Field>
                </div>
                <Field>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} maxLength={1000} className="min-h-20" />
                </Field>
                <SubmitButton size="sm" pendingLabel="Creating…" disabled={tournaments.length === 0}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Create season
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle>Create tournament</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTournamentAction} className="space-y-3">
                <Field>
                  <Label htmlFor="tournament-name">Name</Label>
                  <Input id="tournament-name" name="name" required minLength={3} maxLength={120} placeholder="Nepal Premier League" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <Label htmlFor="format">Format</Label>
                    <Input id="format" name="format" defaultValue="T20" maxLength={40} />
                  </Field>
                  <Field>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" defaultValue="Nepal" maxLength={80} />
                  </Field>
                </div>
                <Field>
                  <Label htmlFor="tournament-description">Description</Label>
                  <Textarea id="tournament-description" name="description" rows={2} maxLength={1000} className="min-h-16" />
                </Field>
                <SubmitButton size="sm" variant="secondary" pendingLabel="Creating…">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Create tournament
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
