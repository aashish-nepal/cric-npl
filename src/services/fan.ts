import { cache } from "react";
import type { MatchComputed, Player, Team } from "@/types/cricket";
import type { FanVote, Poll, Prediction, UserPrediction, UserProfile } from "@/types/content";
import { getRepository } from "@/lib/data";
import { loadSite } from "./cricket";

export interface PredictionWithMatch {
  prediction: Prediction;
  match: MatchComputed | null;
  teamA: Team | null;
  teamB: Team | null;
}

export interface FanZoneData {
  polls: Poll[];
  predictions: PredictionWithMatch[];
  votes: FanVote[];
  userPredictions: UserPrediction[];
  profile: UserProfile | null;
  favouriteTeam: Team | null;
  leaderboard: UserProfile[];
  playerById: Map<string, Player>;
}

export const getFanZoneData = cache(async (userId: string | null): Promise<FanZoneData> => {
  const site = await loadSite();
  const repository = getRepository();
  const [polls, predictions, votes, userPredictions, profile, users] = await Promise.all([
    repository.getPolls(),
    repository.getPredictions(site.activeSeason.id),
    userId ? repository.getFanVotes(userId) : Promise.resolve([]),
    userId ? repository.getUserPredictions(userId) : Promise.resolve([]),
    userId ? repository.getUserById(userId) : Promise.resolve(null),
    repository.getUsers(),
  ]);

  const predictionsWithMatch: PredictionWithMatch[] = predictions.map((prediction) => {
    const match = site.analytics.matchById.get(prediction.matchId) ?? null;
    return {
      prediction,
      match,
      teamA: match?.teamA ?? null,
      teamB: match?.teamB ?? null,
    };
  });

  const playerById = new Map(site.bundle.players.map((player) => [player.id, player]));
  const favouriteTeam = profile?.favouriteTeamId
    ? (site.bundle.teams.find((team) => team.id === profile.favouriteTeamId) ?? null)
    : null;

  return {
    polls,
    predictions: predictionsWithMatch,
    votes,
    userPredictions,
    profile,
    favouriteTeam,
    leaderboard: [...users].sort((a, b) => b.points - a.points).slice(0, 10),
    playerById,
  };
});

export const getPollBySlug = cache(async (slug: string, userId: string | null): Promise<{
  poll: Poll;
  userVote: FanVote | null;
  totalVotes: number;
} | null> => {
  const repository = getRepository();
  const polls = await repository.getPolls();
  const poll = polls.find((row) => row.slug === slug);
  if (!poll) return null;
  const votes = userId ? await repository.getFanVotes(userId) : [];
  return {
    poll,
    userVote: votes.find((vote) => vote.pollId === poll.id) ?? null,
    totalVotes: poll.totalVotes,
  };
});
