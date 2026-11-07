import Link from "next/link";
import { Plus, ShieldCheck, UserPlus } from "lucide-react";
import { loadSite } from "@/services/cricket";
import { requirePermission } from "@/lib/auth/session";
import { addSquadMemberAction, createTeamAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/cricket/identity";
import { ROLE_LABELS } from "@/types/content";
import { cn } from "@/lib/utils";

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; message?: string; error?: string }>;
}) {
  await requirePermission("competition.manage");
  const [{ team: selectedTeamId, message, error }, site] = await Promise.all([searchParams, loadSite()]);
  const { bundle, activeSeason } = site;
  const squads = bundle.squads.filter((row) => row.seasonId === activeSeason.id);
  const playerById = new Map(bundle.players.map((player) => [player.id, player]));
  const selectedTeam = bundle.teams.find((team) => team.id === selectedTeamId) ?? null;
  const selectedSquad = selectedTeam ? squads.filter((row) => row.teamId === selectedTeam.id) : [];
  const assigned = new Set(squads.map((row) => row.playerId));
  const availablePlayers = bundle.players.filter((player) => !assigned.has(player.id));

  return (
    <>
      <AdminPageHeading
        title="Teams & squads"
        description="Competition setup for the active season. Team records feed public pages, standings and scoring selections."
      />
      <FlashMessages message={message} error={error} />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>Teams</CardTitle>
              <Badge variant="secondary">{bundle.teams.length}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="hidden sm:table-cell">City</TableHead>
                    <TableHead className="text-right">Squad</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.teams.map((team) => {
                    const count = squads.filter((row) => row.teamId === team.id).length;
                    return (
                      <TableRow key={team.id} className={cn(selectedTeamId === team.id && "bg-primary/5")}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TeamLogo team={team} size="sm" />
                            <div>
                              <p className="text-xs font-semibold">{team.name}</p>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{team.shortName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{team.homeCity}</TableCell>
                        <TableCell className="text-right text-xs tabular">{count}</TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/teams?team=${team.id}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {selectedTeamId === team.id ? "Viewing" : "Squad"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedTeam ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2">
                <CardTitle>{selectedTeam.name} squad</CardTitle>
                <Badge variant="secondary">{selectedSquad.length} players</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                {selectedSquad.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No players assigned yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {selectedSquad.map((row) => {
                      const player = playerById.get(row.playerId);
                      if (!player) return null;
                      return (
                        <li key={row.id} className="flex items-center justify-between gap-3 py-2">
                          <div>
                            <p className="text-xs font-semibold">{player.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {ROLE_LABELS[player.playingRole]} · {player.battingStyle}
                            </p>
                          </div>
                          <Link href={`/players/${player.slug}`} className="text-[10px] font-semibold text-primary hover:underline">
                            Profile
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle>Add team</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTeamAction} className="space-y-3">
                <Field>
                  <Label htmlFor="name">Team name</Label>
                  <Input id="name" name="name" required minLength={2} maxLength={120} placeholder="Kathmandu Gurkhas" />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <Label htmlFor="shortName">Short name</Label>
                    <Input id="shortName" name="shortName" required minLength={2} maxLength={6} placeholder="KTM" />
                  </Field>
                  <Field>
                    <Label htmlFor="homeCity">Home city</Label>
                    <Input id="homeCity" name="homeCity" required minLength={2} maxLength={120} placeholder="Kathmandu" />
                  </Field>
                </div>
                <Field>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" required minLength={10} maxLength={1000} rows={3} className="min-h-20" />
                </Field>
                <Field>
                  <Label htmlFor="primaryColor">Primary colour</Label>
                  <Input id="primaryColor" name="primaryColor" type="color" defaultValue="#166534" className="h-10 p-1" />
                </Field>
                <SubmitButton size="sm" pendingLabel="Creating…">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Create team
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />
              <CardTitle>Add player to squad</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addSquadMemberAction} className="space-y-3">
                <input type="hidden" name="seasonId" value={activeSeason.id} />
                <Field>
                  <Label htmlFor="teamId">Team</Label>
                  <Select id="teamId" name="teamId" required defaultValue={selectedTeam?.id ?? ""}>
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
                  <Label htmlFor="playerId">Player</Label>
                  <Select id="playerId" name="playerId" required defaultValue="">
                    <option value="" disabled>
                      {availablePlayers.length ? "Select player" : "All players are assigned"}
                    </option>
                    {availablePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.fullName} · {ROLE_LABELS[player.playingRole]}
                      </option>
                    ))}
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    A player can represent only one team per season. {availablePlayers.length} unassigned.
                  </p>
                </Field>
                <SubmitButton size="sm" variant="secondary" pendingLabel="Adding…" disabled={availablePlayers.length === 0}>
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add to squad
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
