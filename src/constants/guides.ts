export interface Guide {
  slug: string;
  title: string;
  description: string;
  body: string;
  updatedAt: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "npl-beginners-guide",
    title: "The NPL beginner's guide",
    description:
      "What the Nepal Premier League is, how the season works and how to follow a franchise T20 competition.",
    updatedAt: "2026-10-20",
    body: `## What is the NPL?

The Nepal Premier League (NPL) is a franchise Twenty20 cricket competition in Nepal. City-based teams play a league phase, with the strongest sides progressing to the knockout stage. The competition has become an important shop window for Nepali players and a meeting point for the domestic game and international cricket.

## The format

- **Twenty20:** each side faces a maximum of 20 overs.
- **League phase:** teams play each other, earning two points for a win and one for a tie or no-result.
- **Net run rate:** separates teams level on points.
- **Knockouts:** the top sides progress to eliminators and a final.

## Following a match

A cricket score such as **156/6 (19.2)** means the batting side has scored 156 runs for the loss of 6 wickets in 19 overs and 2 balls. A target of 157 means the chasing side needs 157 runs to win.

## What to watch

The powerplay (first six overs), the middle-overs spin battle and the death overs (last four) each tell a different part of the story. Our match centre separates them so you can see where a game was won.

*This guide is general educational content for the demo build.*`,
  },
  {
    slug: "cricket-statistics-explained",
    title: "Cricket statistics explained",
    description:
      "Batting average, strike rate, economy, bowling average and net run rate — what they measure and how to read them.",
    updatedAt: "2026-10-18",
    body: `## Batting

**Runs** are the primary currency. **Balls faced** gives context. **Strike rate** is runs per 100 balls:

> SR = (runs ÷ balls faced) × 100

**Batting average** is runs divided by dismissals. A batter who finishes not out is not counted as dismissed, which is why a low average can hide a strong finisher.

## Bowling

**Economy** is runs conceded per over:

> Economy = (runs conceded ÷ legal balls bowled) × 6

**Bowling average** is runs conceded per wicket. **Bowling strike rate** is balls bowled per wicket. A bowler can have a great economy and a poor average: they are different questions.

Wides and no-balls are charged to the bowler. Byes and leg-byes are not. Run-outs are not credited to the bowler.

## Team metrics

**Net run rate** compares scoring rate with conceding rate. If a side is bowled out, the official convention treats it as having faced its full quota of overs. No-result matches are excluded.

## A note on sample size

Twenty20 numbers stabilise slowly. A player with 40 runs from three innings is not "in form"; a bowler with four wickets in two games is not necessarily the league's best. Always check innings and balls alongside the headline number.

*Educational content for the demo build.*`,
  },
  {
    slug: "how-to-read-a-scorecard",
    title: "How to read a cricket scorecard",
    description: "A practical walkthrough of batting, bowling, extras, fall of wickets and partnerships.",
    updatedAt: "2026-10-15",
    body: `## The batting card

Each row shows a batter's runs, balls, fours, sixes and strike rate. The dismissal column explains how they got out: **c Sharma b Thapa** means caught by Sharma, bowled by Thapa. **not out** means they were still at the crease when the innings ended.

## The bowling card

Overs are shown as **4.2**, meaning four overs and two balls. Maidens are overs in which the bowler concedes no runs. Economy is runs per over. Wides and no-balls are listed separately because they are the bowler's responsibility.

## Extras

Wides, no-balls, byes, leg-byes and penalty runs are added to the team total but not to the batter's score. Byes and leg-byes are not charged to the bowler.

## Fall of wickets and partnerships

The fall-of-wickets line shows the score when each wicket fell: **3-72** means the third wicket fell with the total on 72. Partnerships show how many runs each pair added, which is often more revealing than the individual card.

## Projections

A projected score is an estimate based on the current run rate. It is not a prediction. Our match centre labels it explicitly.

*Educational content for the demo build.*`,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
