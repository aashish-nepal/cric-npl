import type {
  BallEvent,
  Innings,
  Match,
  Player,
  PlayingXIEntry,
  Season,
  SeasonBundle,
  SquadMember,
  Team,
  Tournament,
  Venue,
} from "@/types/cricket";
import type {
  Comment,
  FanVote,
  NewsArticle,
  NewsCategory,
  Poll,
  Prediction,
  UserProfile,
} from "@/types/content";
import { buildPlayersForTeam, type DemoTeamSeed } from "./names";
import { simulateInnings } from "./simulate";
import { slugify } from "@/lib/utils";

export const DEMO_NOW = "2026-11-07T09:30:00.000Z";

const TOURNAMENT: Tournament = {
  id: "tournament-npl",
  name: "Nepal Premier League",
  slug: "nepal-premier-league",
  format: "T20",
  country: "Nepal",
  description:
    "Nepal's flagship franchise T20 competition. NPL Cricket Hub is an independent platform and is not affiliated with the league or its franchises.",
};

const TEAM_SEEDS: DemoTeamSeed[] = [
  {
    slug: "janakpur-bolts",
    name: "Janakpur Bolts",
    shortName: "JAB",
    primaryColor: "#1e3a8a",
    homeCity: "Janakpur",
    description:
      "Franchise representing the Mithila region, built around aggressive top-order batting and a young pace attack.",
  },
  {
    slug: "kathmandu-gurkhas",
    name: "Kathmandu Gurkhas",
    shortName: "KTM",
    primaryColor: "#b91c1c",
    homeCity: "Kathmandu",
    description:
      "The capital's franchise, blending experienced campaigners with academy graduates from the Kathmandu Valley.",
  },
  {
    slug: "chitwan-rhinos",
    name: "Chitwan Rhinos",
    shortName: "CHR",
    primaryColor: "#0f766e",
    homeCity: "Bharatpur",
    description:
      "A physically imposing side known for hard-hitting middle-order batting and disciplined spin bowling.",
  },
  {
    slug: "pokhara-avengers",
    name: "Pokhara Avengers",
    shortName: "PKA",
    primaryColor: "#7c3aed",
    homeCity: "Pokhara",
    description:
      "Representing Gandaki Province, the Avengers favour a high-tempo fielding unit and left-arm angle in the attack.",
  },
  {
    slug: "biratnagar-kings",
    name: "Biratnagar Kings",
    shortName: "BRK",
    primaryColor: "#ea580c",
    homeCity: "Biratnagar",
    description:
      "Eastern Nepal's franchise, with a reputation for powerful opening partnerships and a loyal travelling support.",
  },
  {
    slug: "lumbini-lions",
    name: "Lumbini Lions",
    shortName: "LUL",
    primaryColor: "#ca8a04",
    homeCity: "Butwal",
    description:
      "A patient, tactical side from Lumbini Province that leans on all-round depth and strong death bowling.",
  },
  {
    slug: "karnali-yaks",
    name: "Karnali Yaks",
    shortName: "KNY",
    primaryColor: "#0369a1",
    homeCity: "Surkhet",
    description:
      "Karnali Province's representatives, a developing squad with an emphasis on pace and athletic fielding.",
  },
  {
    slug: "sudurpaschim-royals",
    name: "Sudurpaschim Royals",
    shortName: "SPR",
    primaryColor: "#be123c",
    homeCity: "Dhangadhi",
    description:
      "Far-western Nepal's franchise, traditionally difficult to beat at home and dangerous in run chases.",
  },
];

const VENUES: Venue[] = [
  {
    id: "venue-kirtipur",
    name: "TU International Cricket Ground",
    slug: "tu-international-cricket-ground",
    city: "Kirtipur, Kathmandu",
    country: "Nepal",
    capacity: null,
    description:
      "Nepal's principal international venue, set inside the Tribhuvan University complex in Kirtipur. Known for a lively crowd and a surface that rewards disciplined spin bowling.",
  },
  {
    id: "venue-mulpani",
    name: "Mulpani Cricket Stadium",
    slug: "mulpani-cricket-stadium",
    city: "Kathmandu",
    country: "Nepal",
    capacity: null,
    description:
      "A modern cricket facility in the Kathmandu Valley used for domestic and age-group fixtures. Short square boundaries make it a high-scoring venue.",
  },
  {
    id: "venue-pokhara",
    name: "Pokhara Rangasala",
    slug: "pokhara-rangasala",
    city: "Pokhara",
    country: "Nepal",
    capacity: null,
    description:
      "A multi-purpose ground in Pokhara with a scenic backdrop. Used for franchise cricket and regional tournaments in Gandaki Province.",
  },
];

const CATEGORIES: NewsCategory[] = [
  { id: "cat-npl", name: "NPL News", slug: "npl-news", description: "Latest news from the Nepal Premier League." },
  { id: "cat-nepal", name: "Nepal Cricket", slug: "nepal-cricket", description: "The national side and the domestic game." },
  { id: "cat-reports", name: "Match Reports", slug: "match-reports", description: "Reports from completed NPL fixtures." },
  { id: "cat-previews", name: "Match Previews", slug: "match-previews", description: "What to watch in upcoming fixtures." },
  { id: "cat-player", name: "Player News", slug: "player-news", description: "Player profiles, milestones and interviews." },
  { id: "cat-team", name: "Team News", slug: "team-news", description: "Squad and franchise updates." },
  { id: "cat-analysis", name: "Cricket Analysis", slug: "cricket-analysis", description: "Tactics, data and long-form analysis." },
  { id: "cat-international", name: "International Cricket", slug: "international-cricket", description: "Nepal in the wider cricket world." },
];

const USERS: UserProfile[] = [
  {
    id: "user-admin",
    username: "npl_admin",
    email: "admin@nplcrickethub.local",
    avatarUrl: null,
    favouriteTeamId: "team-kathmandu-gurkhas",
    role: "super_admin",
    points: 0,
    suspended: false,
    createdAt: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "user-editor",
    username: "editor",
    email: "editor@nplcrickethub.local",
    avatarUrl: null,
    favouriteTeamId: "team-janakpur-bolts",
    role: "editor",
    points: 0,
    suspended: false,
    createdAt: "2026-02-11T09:00:00.000Z",
  },
  {
    id: "user-fan",
    username: "cricketfan",
    email: "fan@nplcrickethub.local",
    avatarUrl: null,
    favouriteTeamId: "team-pokhara-avengers",
    role: "user",
    points: 120,
    suspended: false,
    createdAt: "2026-03-02T09:00:00.000Z",
  },
];

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function addDays(baseIso: string, days: number): string {
  const date = new Date(baseIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/** Circle-method round robin; every pair meets once. */
function roundRobinPairs(teamIds: string[]): Array<[string, string]> {
  const rotation = [...teamIds];
  const n = rotation.length;
  const pairs: Array<[string, string]> = [];
  for (let round = 0; round < n - 1; round += 1) {
    for (let i = 0; i < n / 2; i += 1) {
      const home = rotation[i];
      const away = rotation[n - 1 - i];
      if (!home || !away) continue;
      pairs.push(round % 2 === 0 ? [home, away] : [away, home]);
    }
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    const last = rest.pop();
    if (fixed && last) rotation.splice(0, rotation.length, fixed, last, ...rest);
  }
  return pairs;
}

interface BuildMatchArgs {
  season: Season;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  venueId: string;
  scheduledAt: string;
  status: Match["status"];
  playersByTeam: Map<string, Player[]>;
  squadsByTeam: Map<string, SquadMember[]>;
  partialSecondInnings?: number;
  abandoned?: boolean;
}

function buildMatch(args: BuildMatchArgs): {
  match: Match;
  innings: Innings[];
  events: BallEvent[];
  playingXI: PlayingXIEntry[];
} {
  const {
    season,
    matchNumber,
    teamAId,
    teamBId,
    venueId,
    scheduledAt,
    status,
    playersByTeam,
    squadsByTeam,
    partialSecondInnings,
    abandoned,
  } = args;

  const matchId = `match-${season.year}-${matchNumber}`;
  const slug = `npl-${season.year}-match-${matchNumber}-${teamAId.replace("team-", "")}-vs-${teamBId.replace("team-", "")}`;
  const tossSeed = hashString(`${matchId}-toss`);
  const tossWinnerId = tossSeed % 2 === 0 ? teamAId : teamBId;
  const tossDecision = tossSeed % 3 === 0 ? "bowl" : "bat";
  const firstBattingTeamId = tossDecision === "bat" ? tossWinnerId : tossWinnerId === teamAId ? teamBId : teamAId;
  const secondBattingTeamId = firstBattingTeamId === teamAId ? teamBId : teamAId;

  const playersA = playersByTeam.get(teamAId) ?? [];
  const playersB = playersByTeam.get(teamBId) ?? [];
  const xiA = playersA.slice(0, 11);
  const xiB = playersB.slice(0, 11);
  const battingXI = firstBattingTeamId === teamAId ? xiA : xiB;
  const bowlingXI = firstBattingTeamId === teamAId ? xiB : xiA;

  const playingXI: PlayingXIEntry[] = [
    ...xiA.map((player, index) => ({
      id: `xi-${matchId}-${player.id}`,
      matchId,
      teamId: teamAId,
      playerId: player.id,
      battingOrder: index + 1,
      isCaptain: squadsByTeam.get(teamAId)?.find((row) => row.playerId === player.id)?.captain ?? false,
      isWicketkeeper: player.playingRole === "wicketkeeper",
    })),
    ...xiB.map((player, index) => ({
      id: `xi-${matchId}-${player.id}`,
      matchId,
      teamId: teamBId,
      playerId: player.id,
      battingOrder: index + 1,
      isCaptain: squadsByTeam.get(teamBId)?.find((row) => row.playerId === player.id)?.captain ?? false,
      isWicketkeeper: player.playingRole === "wicketkeeper",
    })),
  ];

  const match: Match = {
    id: matchId,
    seasonId: season.id,
    tournamentId: TOURNAMENT.id,
    matchNumber,
    slug,
    teamAId,
    teamBId,
    venueId,
    scheduledAt,
    status,
    tossWinnerId: status === "scheduled" ? null : tossWinnerId,
    tossDecision: status === "scheduled" ? null : tossDecision,
    winnerId: null,
    resultSummary: null,
    providerMatchId: null,
    dataSource: "demo",
    lastUpdated: scheduledAt,
  };

  if (status === "scheduled") {
    return { match, innings: [], events: [], playingXI: [] };
  }

  if (abandoned) {
    match.status = "abandoned";
    match.resultSummary = "No result — abandoned without a ball bowled (demo scenario)";
    match.lastUpdated = scheduledAt;
    return { match, innings: [], events: [], playingXI };
  }

  const first = simulateInnings({
    inningsId: `innings-${matchId}-1`,
    matchId,
    battingTeamId: firstBattingTeamId,
    bowlingTeamId: secondBattingTeamId,
    battingXI,
    bowlingXI,
    seed: hashString(`${matchId}-innings-1`),
    baseTime: scheduledAt,
  });
  first.innings.inningsNumber = 1;

  const second = simulateInnings({
    inningsId: `innings-${matchId}-2`,
    matchId,
    battingTeamId: secondBattingTeamId,
    bowlingTeamId: firstBattingTeamId,
    battingXI: bowlingXI,
    bowlingXI: battingXI,
    seed: hashString(`${matchId}-innings-2`),
    target: first.innings.totalRuns + 1,
    partialAtBalls: partialSecondInnings,
    baseTime: new Date(new Date(scheduledAt).getTime() + 3 * 60 * 60 * 1000).toISOString(),
  });
  second.innings.inningsNumber = 2;

  if (status === "completed") {
    if (second.innings.totalRuns > first.innings.totalRuns) {
      match.winnerId = secondBattingTeamId;
      const wicketsInHand = 10 - second.innings.wickets;
      match.resultSummary = `${DEMO_TEAM_NAMES[secondBattingTeamId] ?? secondBattingTeamId} won by ${wicketsInHand} wicket${wicketsInHand === 1 ? "" : "s"}`;
    } else if (first.innings.totalRuns > second.innings.totalRuns) {
      match.winnerId = firstBattingTeamId;
      const margin = first.innings.totalRuns - second.innings.totalRuns;
      match.resultSummary = `${DEMO_TEAM_NAMES[firstBattingTeamId] ?? firstBattingTeamId} won by ${margin} run${margin === 1 ? "" : "s"}`;
    } else {
      match.resultSummary = "Match tied";
    }
    match.lastUpdated = new Date(new Date(scheduledAt).getTime() + 6 * 60 * 60 * 1000).toISOString();
  } else if (status === "live") {
    match.lastUpdated = DEMO_NOW;
  }

  return {
    match,
    innings: [first.innings, second.innings],
    events: [...first.events, ...second.events],
    playingXI,
  };
}

function buildSeason(
  season: Season,
  playersByTeam: Map<string, Player[]>,
  squadsByTeam: Map<string, SquadMember[]>,
  options: { completedUntil: number; liveIndex?: number; abandonedIndexes?: number[] },
): {
  matches: Match[];
  innings: Innings[];
  events: BallEvent[];
  playingXI: PlayingXIEntry[];
} {
  const pairs = roundRobinPairs(TEAM_SEEDS.map((team) => `team-${team.slug}`));
  const matches: Match[] = [];
  const innings: Innings[] = [];
  const events: BallEvent[] = [];
  const playingXI: PlayingXIEntry[] = [];
  const start = season.year === 2026 ? "2026-09-20T06:15:00.000Z" : "2025-09-15T06:15:00.000Z";

  pairs.forEach((pair, index) => {
    const matchNumber = index + 1;
    const isLive = options.liveIndex === index;
    const isAbandoned = options.abandonedIndexes?.includes(index) ?? false;
    const status: Match["status"] = isLive
      ? "live"
      : index < options.completedUntil
        ? isAbandoned
          ? "abandoned"
          : "completed"
        : "scheduled";
    const built = buildMatch({
      season,
      matchNumber,
      teamAId: pair[0],
      teamBId: pair[1],
      venueId: VENUES[index % VENUES.length]?.id ?? "venue-kirtipur",
      scheduledAt: addDays(start, index * 2),
      status,
      playersByTeam,
      squadsByTeam,
      partialSecondInnings: isLive ? 76 : undefined,
      abandoned: isAbandoned,
    });
    matches.push(built.match);
    innings.push(...built.innings);
    events.push(...built.events);
    playingXI.push(...built.playingXI);
  });

  return { matches, innings, events, playingXI };
}

function article(
  id: string,
  title: string,
  slug: string,
  excerpt: string,
  body: string,
  categoryId: string,
  authorId: string,
  authorName: string,
  publishedAt: string,
  tags: string[],
  featured = false,
): NewsArticle {
  return {
    id,
    title,
    slug,
    excerpt,
    body,
    featuredImage: null,
    imageCaption: null,
    categoryId,
    authorId,
    authorName,
    tags,
    seoTitle: null,
    metaDescription: excerpt,
    canonicalUrl: null,
    status: "published",
    publishedAt,
    updatedAt: publishedAt,
    readingMinutes: Math.max(2, Math.round(body.split(/\s+/).length / 200)),
    featured,
  };
}

const ARTICLES: NewsArticle[] = [
  article(
    "article-1",
    "How the NPL is reshaping the pathway for Nepali cricketers",
    "how-the-npl-is-reshaping-the-pathway-for-nepali-cricketers",
    "Franchise cricket has shortened the distance between domestic performances and national selection. Here is what that means for the next generation.",
    `## A shorter, louder pathway

For years, a young cricketer in Nepal could do everything right at age-group level and still wait a long time for a meaningful senior opportunity. The arrival of franchise T20 cricket changed the timeline. A strong fortnight in front of a television audience can now do what a full domestic season once struggled to do: put a name in front of selectors, coaches and fans at the same time.

That is not automatically healthy. Short-format visibility can reward a very specific skill set — power hitting, death bowling, boundary fielding — while the longer formats remain the best test of technique. The most useful outcome is not a replacement of the domestic structure but a genuine bridge between it and the national team.

## What selectors actually watch

Three things tend to translate from franchise cricket to international selection:

- **Decision-making under pressure.** A closing spell or a chase is a repeated stress test.
- **Role clarity.** A player who owns a defined job — powerplay bowler, finisher, wicketkeeping anchor — is easier to project into a team plan.
- **Consistency across conditions.** Kirtipur, Mulpani and Pokhara ask different questions of the same player.

## The next step

The strongest domestic ecosystems make the bridge two-way. Established internationals return, raise the standard and pass on knowledge; young players get a clearly defined route upward. The franchises that invest in analysis, physiotherapy and structured practice will produce more than the ones that simply assemble eleven names.

*This is independent editorial content. Demo articles on this build are illustrative and should not be read as reporting on real matches or people.*`,
    "cat-analysis",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-11-06T04:30:00.000Z",
    ["pathway", "analysis", "domestic cricket"],
    true,
  ),
  article(
    "article-2",
    "NPL 2026: five storylines to follow in the final week",
    "npl-2026-five-storylines-final-week",
    "The league phase is entering its decisive stretch. These are the tactical and table-level questions that will define the final week.",
    `## 1. The race for the top two

With the league phase narrowing, the difference between finishing first and third is more than pride. The top two usually carry a shorter route through the knockout stage, which matters in a tournament where travel and recovery windows are tight.

## 2. Net run rate becomes a weapon

Once teams are level on points, net run rate starts to influence how aggressively captains bat first. A side that expects to win may still keep its foot down in the final overs to protect its NRR. The all-out rule — where a bowled-out side is treated as having faced its full quota — is the detail most fans miss.

## 3. Death bowling under scrutiny

The best sides in this competition have separated themselves by conceding fewer than nine runs an over at the death. That is not only about yorkers. It is about field placement, changing pace and refusing to bowl the same ball twice.

## 4. The wicketkeeper-batter slot

Modern T20 selection wants a wicketkeeper who can bat in the top six. Teams that carry a specialist keeper at eight lose flexibility with the ball and in the field. Watch how the contenders balance that trade-off.

## 5. Youth versus experience

Every squad has at least one academy graduate pushing for a bigger role. The final week is where coaches decide whether to trust them in a high-pressure game or fall back on familiar names.

*Demo editorial content for the NPL Cricket Hub build.*`,
    "cat-npl",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-11-05T10:00:00.000Z",
    ["npl 2026", "standings", "analysis"],
    false,
  ),
  article(
    "article-3",
    "Explained: how net run rate really works in a tight NPL table",
    "explained-how-net-run-rate-works",
    "Net run rate decides tournaments, yet it is routinely misread. A clear guide to the formula, the all-out rule and the scenarios that matter.",
    `## The formula

Net run rate (NRR) is the difference between a team's scoring rate and its conceding rate across the matches that count:

> NRR = (runs scored ÷ overs faced) − (runs conceded ÷ overs bowled)

Only completed matches with a result are included. A no-result fixture is removed from the calculation entirely, not counted as a 0–0.

## The all-out rule

If a team is bowled out before its overs are complete, the calculation uses the full quota of overs it was entitled to face. In a 20-over competition, an innings of 112 all out in 16.3 overs is treated as 112 from 20 overs for NRR purposes.

This prevents a side from being rewarded for being dismissed quickly, and it is why a heavy loss can damage NRR more than the raw margin suggests.

## A worked example

Team A scores 160/6 in 20 overs and bowls Team B out for 120 in 17 overs. Team B is treated as having faced 20 overs.

- Team A: 160/20 = 8.00 scored; 120/20 = 6.00 conceded; NRR +2.00
- Team B: 120/20 = 6.00 scored; 160/20 = 8.00 conceded; NRR −2.00

## What to watch

Chasing sides can improve NRR quickly by finishing early. Batting first, the incentive is to keep scoring even when a win is already likely. The table on this site recalculates from ball-by-ball data, so the numbers always trace back to the underlying innings.

*Demo editorial content. The standings on this build are generated from a demo dataset.*`,
    "cat-analysis",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-11-04T06:15:00.000Z",
    ["nrr", "explainer", "statistics"],
    false,
  ),
  article(
    "article-4",
    "Match preview: a top-of-the-table test under the Kirtipur lights",
    "match-preview-top-of-the-table-kirtipur",
    "Two of the league's most consistent sides meet with table position and momentum on the line.",
    `## The setup

Kirtipur has produced some of the most atmospheric cricket in the competition, and this fixture should be no different. The surface has generally rewarded bowlers who hit a consistent length, with spin becoming more influential as the evening progresses.

## Team news

Both squads have named unchanged 16-player groups. The main selection question is whether either side adds a second frontline spinner or keeps an extra seamer for the death overs. The toss could settle it: chasing has been the preferred option in the majority of matches at this venue.

## Key battle

The powerplay against the new ball. One side's openers have been the most aggressive in the competition; the other's opening bowlers have the best economy rate in the first six overs. Something has to give.

## Our read

A close game is the most likely outcome. The team that fields better in the final five overs probably wins it.

*Demo preview content. No real fixture is being reported.*`,
    "cat-previews",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-11-03T12:00:00.000Z",
    ["preview", "kirtipur"],
    false,
  ),
  article(
    "article-5",
    "The quiet rise of Nepal's home-grown finishers",
    "quiet-rise-of-nepals-home-grown-finishers",
    "Finishing an innings is a specialist job. A new group of Nepali batters is learning it in public.",
    `## The hardest role in T20 batting

A finisher does not get the luxury of time. They arrive with six or seven overs left, face bowlers who are at their freshest tactical best, and are judged on a handful of decisions. The skill is not simply hitting sixes; it is choosing which ball to attack and which to absorb.

## What the data shows

The most effective finishers in this competition share three traits:

1. They keep their strike rate high without a disproportionate dot-ball rate.
2. They hit boundaries square of the wicket as well as straight.
3. They rotate strike immediately after a boundary, denying the bowler a free delivery.

## Why it matters for Nepal

The national side has often relied on its top order to set up totals. Developing two or three reliable finishers changes the shape of the team: it allows an extra bowler, or a more attacking field, because the batting line-up no longer ends at seven.

*Demo editorial content.*`,
    "cat-player",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-11-02T05:45:00.000Z",
    ["finishers", "batting", "analysis"],
    false,
  ),
  article(
    "article-6",
    "Matchday guide: making the most of a game in Kathmandu",
    "matchday-guide-kathmandu",
    "Travel, timing and stadium etiquette for fans heading to the cricket in the capital.",
    `## Getting there

Kirtipur sits to the south-west of central Kathmandu. Allow more time than a map suggests: matchday traffic around the ring road can add 30–45 minutes. Ride-sharing and public buses both serve the university area.

## What to bring

- A light layer for the evening session; temperatures drop quickly after sunset.
- A refillable water bottle.
- Sun protection for day matches. The stands offer limited shade.

## Stadium etiquette

Arrive early, keep aisles clear, and follow steward instructions. Flags and banners are welcome when they do not obstruct sightlines. Pyrotechnics, glass containers and laser pointers are not.

## Watching from home

Every match page on NPL Cricket Hub includes a scorecard, ball-by-ball commentary and a live win-probability style summary of the chase. Times are shown in Nepal Standard Time (UTC+05:45).

*Demo guide content. Check official venue guidance before travelling.*`,
    "cat-nepal",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-11-01T08:00:00.000Z",
    ["guide", "kathmandu", "fans"],
    false,
  ),
  article(
    "article-7",
    "Why left-arm angle still matters in T20 cricket",
    "why-left-arm-angle-still-matters",
    "The advantage is not mythical. It comes from geometry, match-ups and the way batters build their scoring zones.",
    `## Geometry, not magic

A left-arm seamer creates a different release angle. The ball that angles into the right-hander and then holds its line is harder to line up than a similar ball from over the wicket by a right-armer. The same is true in reverse for left-handed batters.

## The powerplay

Left-arm swing bowlers can be especially valuable in the first six overs, when the field is up and batters are trying to establish a scoring pattern. Two overs of a new-ball spell can change the shape of an innings.

## The cost

The advantage is situational. A left-arm spinner bowling to a left-handed middle order may lose the match-up entirely. Good teams use the angle selectively rather than treating it as a permanent edge.

*Demo analysis content.*`,
    "cat-analysis",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-10-30T07:30:00.000Z",
    ["bowling", "tactics"],
    false,
  ),
  article(
    "article-8",
    "Our editorial policy: independence, accuracy and corrections",
    "editorial-policy-independence-accuracy-corrections",
    "How NPL Cricket Hub sources, verifies and corrects its journalism.",
    `## Independence

NPL Cricket Hub is an independent cricket publication. It is not affiliated with the Nepal Premier League, the Cricket Association of Nepal, or any franchise. Where official branding or photography is used in future, it will be under a documented licence or permission.

## Sourcing

Match data is either entered by an authorised scorer or ingested from a licensed provider. The source of each match is displayed on the match page. We do not scrape other publications, and we do not present unverified social media claims as fact.

## Corrections

If a factual error is identified, we correct it promptly and add a note at the foot of the article describing what changed. Requests can be sent through the contact page.

## Automated content

We do not publish automatically generated match reports as journalism. Computed statistics and projections are labelled as such and always trace back to ball-by-ball records.

*This policy is part of the demo build and should be reviewed by a publisher before launch.*`,
    "cat-nepal",
    "user-editor",
    "NPL Cricket Hub Editorial",
    "2026-10-28T09:00:00.000Z",
    ["editorial policy", "corrections"],
    false,
  ),
];

function buildPolls(players: Player[]): { polls: Poll[]; votes: FanVote[] } {
  const teamOptions = TEAM_SEEDS.map((team, index) => ({
    id: `poll-option-team-${index + 1}`,
    pollId: "poll-winner",
    label: team.name,
    teamId: `team-${team.slug}`,
    playerId: null,
    voteCount: [412, 388, 301, 264, 198, 176, 151, 133][index] ?? 100,
  }));

  const bowlerCandidates = players
    .filter((player) => player.playingRole === "bowler" || player.playingRole === "all_rounder")
    .filter((_, index) => index % 17 === 0)
    .slice(0, 5);

  const playerOptions = bowlerCandidates.map((player, index) => ({
    id: `poll-option-player-${index + 1}`,
    pollId: "poll-bowler",
    label: player.fullName,
    teamId: null,
    playerId: player.id,
    voteCount: [186, 154, 121, 98, 71][index] ?? 50,
  }));

  const polls: Poll[] = [
    {
      id: "poll-winner",
      question: "Who will win NPL 2026?",
      slug: "who-will-win-npl-2026",
      description: "Fan poll. Virtual participation only — no prizes or betting.",
      status: "open",
      closesAt: "2026-11-14T12:00:00.000Z",
      options: teamOptions,
      totalVotes: teamOptions.reduce((sum, option) => sum + option.voteCount, 0),
    },
    {
      id: "poll-bowler",
      question: "Which bowler has been the standout of the season?",
      slug: "standout-bowler-2026",
      description: "Fan poll based on the demo dataset. Virtual participation only.",
      status: "open",
      closesAt: "2026-11-14T12:00:00.000Z",
      options: playerOptions,
      totalVotes: playerOptions.reduce((sum, option) => sum + option.voteCount, 0),
    },
  ];

  return { polls, votes: [] };
}

function buildPredictions(matches: Match[], playersByTeam: Map<string, Player[]>): Prediction[] {
  const upcoming = matches.filter((match) => match.status === "scheduled").slice(0, 3);
  return upcoming.flatMap((match, index) => {
    const teamA = match.teamAId;
    const teamB = match.teamBId;
    const players = [...(playersByTeam.get(teamA) ?? []).slice(0, 3), ...(playersByTeam.get(teamB) ?? []).slice(0, 3)];
    const winner: Prediction = {
      id: `prediction-${match.id}-winner`,
      matchId: match.id,
      title: `Who wins match ${match.matchNumber}?`,
      closesAt: match.scheduledAt,
      status: "open",
      options: [
        {
          id: `pred-opt-${match.id}-a`,
          predictionId: `prediction-${match.id}-winner`,
          label: DEMO_TEAM_NAMES[teamA] ?? teamA,
          playerId: null,
          teamId: teamA,
          kind: "winner",
        },
        {
          id: `pred-opt-${match.id}-b`,
          predictionId: `prediction-${match.id}-winner`,
          label: DEMO_TEAM_NAMES[teamB] ?? teamB,
          playerId: null,
          teamId: teamB,
          kind: "winner",
        },
      ],
    };
    const potm: Prediction = {
      id: `prediction-${match.id}-potm`,
      matchId: match.id,
      title: `Player of the Match — match ${match.matchNumber}`,
      closesAt: match.scheduledAt,
      status: "open",
      options: players.slice(0, 4).map((player, optionIndex) => ({
        id: `pred-opt-${match.id}-p${optionIndex}`,
        predictionId: `prediction-${match.id}-potm`,
        label: player.fullName,
        playerId: player.id,
        teamId: null,
        kind: "player_of_match" as const,
      })),
    };
    return index < 2 ? [winner, potm] : [winner];
  });
}

export interface DemoDatabase {
  tournament: Tournament;
  seasons: Season[];
  teams: Team[];
  players: Player[];
  squads: SquadMember[];
  venues: Venue[];
  matches: Match[];
  innings: Innings[];
  ballEvents: BallEvent[];
  playingXI: PlayingXIEntry[];
  newsCategories: NewsCategory[];
  articles: NewsArticle[];
  polls: Poll[];
  fanVotes: FanVote[];
  predictions: Prediction[];
  users: UserProfile[];
  comments: Comment[];
}

export function buildDemoDatabase(): DemoDatabase {
  const teams: Team[] = TEAM_SEEDS.map((seed) => ({
    id: `team-${seed.slug}`,
    name: seed.name,
    slug: seed.slug,
    shortName: seed.shortName,
    logoUrl: null,
    primaryColor: seed.primaryColor,
    description: seed.description,
    homeCity: seed.homeCity,
    active: true,
  }));

  const playersByTeam = new Map<string, Player[]>();
  const squadsByTeam = new Map<string, SquadMember[]>();
  const players: Player[] = [];
  const squads: SquadMember[] = [];

  TEAM_SEEDS.forEach((seed, teamIndex) => {
    const teamId = `team-${seed.slug}`;
    const teamPlayers = buildPlayersForTeam(seed, teamIndex);
    playersByTeam.set(teamId, teamPlayers);
    players.push(...teamPlayers);
    const teamSquads: SquadMember[] = teamPlayers.map((player, index) => ({
      id: `squad-2026-${teamId}-${index + 1}`,
      seasonId: "season-2026",
      teamId,
      playerId: player.id,
      jerseyNumber: index + 1,
      captain: index === 1,
      viceCaptain: index === 2,
    }));
    squadsByTeam.set(teamId, teamSquads);
    squads.push(...teamSquads);
  });

  const seasons: Season[] = [
    {
      id: "season-2026",
      tournamentId: TOURNAMENT.id,
      name: "NPL 2026",
      slug: "npl-2026",
      year: 2026,
      startDate: "2026-09-20",
      endDate: "2026-11-14",
      status: "active",
      description:
        "The 2026 Nepal Premier League season. Demo dataset generated from ball-by-ball events for platform verification.",
      settings: { pointsWin: 2, pointsTie: 1, pointsNoResult: 1, ballsPerInnings: 120, allOutUsesFullQuota: true },
      createdAt: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "season-2025",
      tournamentId: TOURNAMENT.id,
      name: "NPL 2025",
      slug: "npl-2025",
      year: 2025,
      startDate: "2025-09-15",
      endDate: "2025-10-20",
      status: "completed",
      description:
        "The completed 2025 season, retained for historical standings, player records and season comparison. Demo dataset.",
      settings: { pointsWin: 2, pointsTie: 1, pointsNoResult: 1, ballsPerInnings: 120, allOutUsesFullQuota: true },
      createdAt: "2025-08-01T00:00:00.000Z",
    },
  ];

  const current = seasons[0] as Season;
  const previous = seasons[1] as Season;
  const currentSeason = buildSeason(current, playersByTeam, squadsByTeam, {
    completedUntil: 24,
    liveIndex: 24,
    abandonedIndexes: [10],
  });
  const previousSeason = buildSeason(previous, playersByTeam, squadsByTeam, { completedUntil: 28 });

  // Older squads are retained for career history.
  const historicalSquads: SquadMember[] = squads.map((row) => ({
    ...row,
    id: row.id.replace("squad-2026", "squad-2025"),
    seasonId: "season-2025",
  }));

  const { polls, votes } = buildPolls(players);
  const predictions = buildPredictions(currentSeason.matches, playersByTeam);

  const comments: Comment[] = [
    {
      id: "comment-1",
      articleId: "article-3",
      userId: "user-fan",
      username: "cricketfan",
      body: "The all-out rule is the part I always got wrong. The worked example makes it much clearer.",
      status: "approved",
      createdAt: "2026-11-04T10:20:00.000Z",
    },
    {
      id: "comment-2",
      articleId: "article-1",
      userId: "user-editor",
      username: "editor",
      body: "The two-way bridge point is important. Franchise cricket only helps if the domestic structure stays strong.",
      status: "approved",
      createdAt: "2026-11-06T06:05:00.000Z",
    },
    {
      id: "comment-3",
      articleId: "article-2",
      userId: "user-fan",
      username: "cricketfan",
      body: "Would love to see a breakdown of death-over economy by team.",
      status: "pending",
      createdAt: "2026-11-06T09:15:00.000Z",
    },
  ];

  return {
    tournament: TOURNAMENT,
    seasons,
    teams,
    players,
    squads: [...squads, ...historicalSquads],
    venues: VENUES,
    matches: [...currentSeason.matches, ...previousSeason.matches],
    innings: [...currentSeason.innings, ...previousSeason.innings],
    ballEvents: [...currentSeason.events, ...previousSeason.events],
    playingXI: [...currentSeason.playingXI, ...previousSeason.playingXI],
    newsCategories: CATEGORIES,
    articles: ARTICLES,
    polls,
    fanVotes: votes,
    predictions,
    users: USERS,
    comments,
  };
}

export function buildSeasonBundle(database: DemoDatabase, season: Season): SeasonBundle {
  const seasonMatches = database.matches.filter((row) => row.seasonId === season.id);
  const matchIds = new Set(seasonMatches.map((match) => match.id));
  const seasonInnings = database.innings.filter((row) => matchIds.has(row.matchId));
  const inningsIds = new Set(seasonInnings.map((row) => row.id));

  return {
    season,
    tournament: database.tournament,
    teams: database.teams,
    players: database.players,
    squads: database.squads.filter((row) => row.seasonId === season.id),
    venues: database.venues,
    matches: seasonMatches,
    innings: seasonInnings,
    ballEvents: database.ballEvents.filter((event) => inningsIds.has(event.inningsId)),
    playingXI: database.playingXI.filter((row) => matchIds.has(row.matchId)),
  };
}

export function demoTeamSlugToId(slug: string): string {
  return `team-${slugify(slug)}`;
}

export const DEMO_TEAM_NAMES: Record<string, string> = Object.fromEntries(
  TEAM_SEEDS.map((team) => [`team-${team.slug}`, team.name]),
);

export const DEMO_VENUE_NAMES: Record<string, string> = Object.fromEntries(
  VENUES.map((venue) => [venue.id, venue.name]),
);
