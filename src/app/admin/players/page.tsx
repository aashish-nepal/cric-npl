import Link from "next/link";
import { UserPlus, UsersRound } from "lucide-react";
import { loadSite } from "@/services/cricket";
import { requirePermission } from "@/lib/auth/session";
import { createPlayerAction } from "@/app/actions/admin";
import { AdminPageHeading, FlashMessages } from "@/components/admin/page-heading";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/cricket/identity";
import { ROLE_LABELS } from "@/types/content";
import { cn } from "@/lib/utils";

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; message?: string; error?: string }>;
}) {
  await requirePermission("competition.manage");
  const [{ team: teamFilter, message, error }, site] = await Promise.all([searchParams, loadSite()]);
  const { bundle, activeSeason } = site;
  const squads = bundle.squads.filter((row) => row.seasonId === activeSeason.id);
  const teamById = new Map(bundle.teams.map((team) => [team.id, team]));
  const squadByPlayer = new Map(squads.map((row) => [row.playerId, row]));
  const players = bundle.players
    .filter((player) => {
      if (!teamFilter) return true;
      return squadByPlayer.get(player.id)?.teamId === teamFilter;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <>
      <AdminPageHeading
        title="Player registry"
        description={`${bundle.players.length} players across the ${activeSeason.name} squads. Profiles feed public statistics and scorecards.`}
        actions={
          <Link href="/admin/teams" className="text-xs font-semibold text-primary hover:underline">
            Manage squads
          </Link>
        }
      />
      <FlashMessages message={message} error={error} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Players</CardTitle>
            <div className="flex flex-wrap gap-1">
              <Link
                href="/admin/players"
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  !teamFilter ? "border-primary bg-primary text-white" : "border-border bg-surface hover:bg-muted",
                )}
              >
                All
              </Link>
              {bundle.teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/admin/players?team=${team.id}`}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    teamFilter === team.id ? "border-primary bg-primary text-white" : "border-border bg-surface hover:bg-muted",
                  )}
                >
                  {team.shortName}
                </Link>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Team</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const squad = squadByPlayer.get(player.id);
                  const team = squad ? teamById.get(squad.teamId) : null;
                  return (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlayerAvatar player={player} size="sm" />
                          <div>
                            <p className="text-xs font-semibold">{player.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {player.battingStyle} · {player.bowlingStyle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                        {ROLE_LABELS[player.playingRole]}
                      </TableCell>
                      <TableCell className="hidden text-xs md:table-cell">
                        {team ? <Badge variant="secondary">{team.shortName}</Badge> : <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/players/${player.slug}`} className="text-[11px] font-semibold text-primary hover:underline">
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />
            <CardTitle>Add player</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPlayerAction} className="space-y-3">
              <Field>
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required minLength={2} maxLength={120} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="playingRole">Playing role</Label>
                  <Select id="playingRole" name="playingRole" defaultValue="batter">
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" name="nationality" defaultValue="Nepal" minLength={2} maxLength={80} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="battingStyle">Batting style</Label>
                  <Select id="battingStyle" name="battingStyle" defaultValue="Right-hand bat">
                    <option value="Right-hand bat">Right-hand bat</option>
                    <option value="Left-hand bat">Left-hand bat</option>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="bowlingStyle">Bowling style</Label>
                  <Select id="bowlingStyle" name="bowlingStyle" defaultValue="Right-arm medium">
                    <option value="Right-arm fast">Right-arm fast</option>
                    <option value="Right-arm medium">Right-arm medium</option>
                    <option value="Right-arm offbreak">Right-arm offbreak</option>
                    <option value="Right-arm legbreak">Right-arm legbreak</option>
                    <option value="Left-arm fast">Left-arm fast</option>
                    <option value="Left-arm medium">Left-arm medium</option>
                    <option value="Left-arm orthodox">Left-arm orthodox</option>
                    <option value="Left-arm wrist spin">Left-arm wrist spin</option>
                    <option value="None">None</option>
                  </Select>
                </Field>
              </div>
              <Field>
                <Label htmlFor="biography">Biography</Label>
                <Textarea id="biography" name="biography" rows={3} maxLength={2000} className="min-h-20" placeholder="Optional profile notes" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="teamId">Assign to team</Label>
                  <Select id="teamId" name="teamId" defaultValue="">
                    <option value="">No team</option>
                    {bundle.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="seasonId">Season</Label>
                  <Select id="seasonId" name="seasonId" defaultValue={activeSeason.id}>
                    {site.seasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <UsersRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Selecting a team adds the player to that season&apos;s squad. A player can only be in one squad per season.
              </p>
              <SubmitButton size="sm" pendingLabel="Creating…">
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Create player
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
