"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  Lock,
  RotateCcw,
  Send,
  Timer,
  Trophy,
} from "lucide-react";
import type { Player } from "@/types/cricket";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import {
  closeInningsAction,
  completeMatchAction,
  recordBallAction,
  startSecondInningsAction,
  undoBallAction,
} from "@/app/actions/admin";
import { SubmitButton } from "./submit-button";
import { Alert } from "@/components/ui/feedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";

interface RecentEvent {
  id: string;
  overNumber: number;
  ballNumber: number;
  totalRuns: number;
  legalBall: boolean;
  extraType: string | null;
  wicketType: string | null;
  commentary: string;
  batterName: string;
  bowlerName: string;
  bowlerId: string;
}

export interface ScoringConsoleProps {
  matchId: string;
  matchStatus: string;
  teamA: { id: string; name: string; shortName: string };
  teamB: { id: string; name: string; shortName: string };
  battingTeamName: string;
  bowlingTeamName: string;
  batters: Player[];
  bowlers: Player[];
  strikerId: string | null;
  nonStrikerId: string | null;
  currentInningsNumber: number | null;
  currentScore: string | null;
  target: number | null;
  requiredRuns: number | null;
  requiredRunRate: number | null;
  currentRunRate: number | null;
  recentEvents: RecentEvent[];
  firstInningsClosed: boolean;
  secondInningsExists: boolean;
  currentInningsClosed: boolean;
  canStartSecond: boolean;
  ballsPerInnings: number;
}

function Feedback({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <Alert variant={state.ok ? "success" : "error"} className="mt-3 flex items-start gap-2">
      {state.ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{state.message}</span>
    </Alert>
  );
}

const RUNS = [0, 1, 2, 3, 4, 5, 6];

export function ScoringConsole(props: ScoringConsoleProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [ballState, recordBall, ballPending] = useActionState(recordBallAction, initialActionState);
  const [undoState, undoBall] = useActionState(undoBallAction, initialActionState);
  const [inningsState, startInnings] = useActionState(startSecondInningsAction, initialActionState);
  const [closeState, closeInnings] = useActionState(closeInningsAction, initialActionState);
  const [completeState, completeMatch] = useActionState(completeMatchAction, initialActionState);

  useEffect(() => {
    if (!ballState.ok) return;
    formRef.current?.reset();
    router.refresh();
  }, [ballState, router]);

  useEffect(() => {
    if (undoState.ok || inningsState.ok || closeState.ok || completeState.ok) router.refresh();
  }, [undoState, inningsState, closeState, completeState, router]);

  const defaultBatter = props.strikerId ?? props.batters[0]?.id ?? "";
  const defaultBowler = props.recentEvents[0]?.bowlerId ?? props.bowlers[0]?.id ?? "";

  const live = props.matchStatus === "live";
  const hasBatters = props.batters.length > 0 && props.bowlers.length > 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 border-b border-border">
            <div>
              <CardTitle>Record a delivery</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {props.battingTeamName} batting · {props.bowlingTeamName} bowling
              </p>
            </div>
            {props.currentInningsNumber ? (
              <Badge variant="secondary">Innings {props.currentInningsNumber}</Badge>
            ) : (
              <Badge variant="outline">Not started</Badge>
            )}
          </CardHeader>
          <CardContent className="pt-5">
            {!live ? (
              <Alert variant="warning" className="mb-4">
                This match is not live. Set the status to live in match setup before recording deliveries.
              </Alert>
            ) : null}
            {!hasBatters ? (
              <Alert variant="error" className="mb-4">
                No squad players were found for these teams. Add players to the season squads before scoring.
              </Alert>
            ) : null}

            <form ref={formRef} action={recordBall} className="space-y-5">
              <input type="hidden" name="matchId" value={props.matchId} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="batterId">Striker</Label>
                  <Select id="batterId" name="batterId" required defaultValue={defaultBatter} disabled={!live}>
                    {props.batters.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.fullName}
                        {player.id === props.strikerId ? " (on strike)" : player.id === props.nonStrikerId ? " (non-striker)" : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="bowlerId">Bowler</Label>
                  <Select id="bowlerId" name="bowlerId" required defaultValue={defaultBowler} disabled={!live}>
                    {props.bowlers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.fullName}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-foreground">Runs off the bat</legend>
                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {RUNS.map((run) => (
                    <label key={run} className="cursor-pointer">
                      <input
                        type="radio"
                        name="runsBatter"
                        value={run}
                        defaultChecked={run === 0}
                        disabled={!live}
                        className="peer sr-only"
                      />
                      <span className="flex h-11 items-center justify-center rounded-md border border-border bg-surface text-sm font-bold tabular transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:opacity-50">
                        {run}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Wides and no-balls are recorded through the extras selector below; they do not count as legal balls.
                </p>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <Label htmlFor="extraType">Extra</Label>
                  <Select id="extraType" name="extraType" defaultValue="none" disabled={!live}>
                    <option value="none">None</option>
                    <option value="wide">Wide</option>
                    <option value="no_ball">No ball</option>
                    <option value="bye">Bye</option>
                    <option value="leg_bye">Leg bye</option>
                    <option value="penalty">Penalty</option>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="runsExtras">Extra runs</Label>
                  <Input
                    id="runsExtras"
                    name="runsExtras"
                    type="number"
                    min={0}
                    max={7}
                    defaultValue={0}
                    disabled={!live}
                  />
                  <p className="text-[11px] text-muted-foreground">Total extra runs including the automatic wide/no-ball penalty.</p>
                </Field>
              </div>

              <fieldset className="rounded-md border border-border bg-muted/30 p-3">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wicket</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field>
                    <Label htmlFor="wicketType">Dismissal</Label>
                    <Select id="wicketType" name="wicketType" defaultValue="none" disabled={!live}>
                      <option value="none">No wicket</option>
                      <option value="bowled">Bowled</option>
                      <option value="caught">Caught</option>
                      <option value="caught_and_bowled">Caught &amp; bowled</option>
                      <option value="lbw">LBW</option>
                      <option value="run_out">Run out</option>
                      <option value="stumped">Stumped</option>
                      <option value="hit_wicket">Hit wicket</option>
                      <option value="retired_hurt">Retired hurt</option>
                      <option value="obstructing_field">Obstructing the field</option>
                      <option value="timed_out">Timed out</option>
                    </Select>
                  </Field>
                  <Field>
                    <Label htmlFor="dismissedPlayerId">Dismissed batter</Label>
                    <Select id="dismissedPlayerId" name="dismissedPlayerId" defaultValue="" disabled={!live}>
                      <option value="">Striker by default</option>
                      {props.batters.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.fullName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field>
                    <Label htmlFor="fielderId">Fielder</Label>
                    <Select id="fielderId" name="fielderId" defaultValue="" disabled={!live}>
                      <option value="">Not applicable</option>
                      {props.bowlers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.fullName}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </fieldset>

              <Field>
                <Label htmlFor="commentary">Commentary (optional)</Label>
                <Textarea
                  id="commentary"
                  name="commentary"
                  rows={2}
                  maxLength={500}
                  placeholder="Short ball outside off, cut away through point for four."
                  disabled={!live}
                  className="min-h-16"
                />
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                <SubmitButton pendingLabel="Recording…" disabled={!live || !hasBatters}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Record ball
                </SubmitButton>
                <span className="text-[11px] text-muted-foreground">
                  {ballPending ? "Writing the delivery and recalculating totals…" : "Totals and scorecards update immediately."}
                </span>
              </div>
            </form>
            <Feedback state={ballState} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            {props.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliveries recorded yet.</p>
            ) : (
              <ol className="divide-y divide-border">
                {props.recentEvents.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded bg-muted px-1.5 text-[11px] font-bold tabular">
                      {event.overNumber}.{event.ballNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">
                        {event.batterName} <span className="font-normal text-muted-foreground">to {event.bowlerName}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{event.commentary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {event.wicketType ? (
                        <Badge variant="live">{event.wicketType.replaceAll("_", " ")}</Badge>
                      ) : event.extraType ? (
                        <Badge variant="accent">{event.extraType.replaceAll("_", " ")}</Badge>
                      ) : null}
                      <span className="tabular text-xs font-bold">{event.totalRuns}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Match control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current state</p>
              <p className="mt-1 tabular text-xl font-extrabold">{props.currentScore ?? "No innings"}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {props.target ? `Target ${props.target}` : `Innings limit ${props.ballsPerInnings / 6} overs`}
                {props.requiredRuns !== null ? ` · Need ${props.requiredRuns}` : ""}
                {props.requiredRunRate !== null ? ` · RRR ${formatNumber(props.requiredRunRate)}` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground">
                CRR {props.currentRunRate !== null ? formatNumber(props.currentRunRate) : "—"}
              </p>
            </div>

            <form action={undoBall}>
              <input type="hidden" name="matchId" value={props.matchId} />
              <SubmitButton variant="outline" size="sm" className="w-full" pendingLabel="Undoing…">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Undo last delivery
              </SubmitButton>
            </form>
            <Feedback state={undoState} />

            {props.canStartSecond ? (
              <form action={startInnings}>
                <input type="hidden" name="matchId" value={props.matchId} />
                <SubmitButton size="sm" className="w-full" pendingLabel="Starting…">
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  Start second innings
                </SubmitButton>
              </form>
            ) : null}
            <Feedback state={inningsState} />

            {props.currentInningsNumber && !props.currentInningsClosed ? (
              <form action={closeInnings}>
                <input type="hidden" name="matchId" value={props.matchId} />
                <SubmitButton variant="secondary" size="sm" className="w-full" pendingLabel="Closing…">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Close innings
                </SubmitButton>
              </form>
            ) : null}
            <Feedback state={closeState} />

            {props.matchStatus !== "completed" ? (
              <form action={completeMatch} className="space-y-2 border-t border-border pt-3">
                <input type="hidden" name="matchId" value={props.matchId} />
                <Field>
                  <Label htmlFor="winnerId">Winner</Label>
                  <Select id="winnerId" name="winnerId" defaultValue="">
                    <option value="">No result / tie</option>
                    <option value={props.teamA.id}>{props.teamA.name}</option>
                    <option value={props.teamB.id}>{props.teamB.name}</option>
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="resultSummary">Result summary</Label>
                  <Input
                    id="resultSummary"
                    name="resultSummary"
                    required
                    minLength={3}
                    maxLength={500}
                    placeholder="e.g. Kathmandu Gurkhas won by 24 runs"
                  />
                </Field>
                <SubmitButton variant="accent" size="sm" className="w-full" pendingLabel="Completing…">
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  Complete match
                </SubmitButton>
              </form>
            ) : (
              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-900">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Match completed. Totals are locked unless you undo a delivery.
              </div>
            )}
            <Feedback state={completeState} />
          </CardContent>
        </Card>

        <div className={cn("rounded-lg border border-border bg-surface p-3 text-[11px] leading-relaxed text-muted-foreground")}>
          <p className="font-semibold text-foreground">Scoring checklist</p>
          <ul className="mt-1.5 space-y-1">
            <li>• Select the striker and bowler for every delivery.</li>
            <li>• Wides/no-balls do not increment the legal ball count.</li>
            <li>• Use undo immediately if a delivery is entered incorrectly.</li>
            <li>• Close the innings or let the over limit close it automatically.</li>
            <li>• Complete the match only after the result is confirmed.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
