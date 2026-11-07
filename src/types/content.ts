import type { ArticleStatus, ID, PlayerRole, UserRole } from "./cricket";

export interface NewsCategory {
  id: ID;
  name: string;
  slug: string;
  description: string;
}

export interface NewsArticle {
  id: ID;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImage: string | null;
  imageCaption: string | null;
  categoryId: ID;
  authorId: ID;
  authorName: string;
  tags: string[];
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  updatedAt: string;
  readingMinutes: number;
  featured: boolean;
}

export interface PollOption {
  id: ID;
  pollId: ID;
  label: string;
  teamId: ID | null;
  playerId: ID | null;
  voteCount: number;
}

export interface Poll {
  id: ID;
  question: string;
  slug: string;
  description: string;
  status: "open" | "closed";
  closesAt: string;
  options: PollOption[];
  totalVotes: number;
}

export interface PredictionOption {
  id: ID;
  predictionId: ID;
  label: string;
  playerId: ID | null;
  teamId: ID | null;
  kind: "winner" | "player_of_match" | "top_run_scorer" | "top_wicket_taker";
}

export interface Prediction {
  id: ID;
  matchId: ID;
  title: string;
  closesAt: string;
  status: "open" | "closed" | "settled";
  options: PredictionOption[];
}

export interface UserPrediction {
  id: ID;
  predictionId: ID;
  userId: ID;
  optionId: ID;
  pointsAwarded: number;
  createdAt: string;
}

export interface FanVote {
  id: ID;
  pollId: ID;
  optionId: ID;
  userId: ID;
  createdAt: string;
}

export interface UserProfile {
  id: ID;
  username: string;
  email: string;
  avatarUrl: string | null;
  favouriteTeamId: ID | null;
  role: UserRole;
  points: number;
  suspended: boolean;
  createdAt: string;
}

export interface Comment {
  id: ID;
  articleId: ID;
  userId: ID;
  username: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface CommentReport {
  id: ID;
  commentId: ID;
  reporterId: ID;
  reason: string;
  createdAt: string;
}

export interface Bookmark {
  id: ID;
  userId: ID;
  entityType: "team" | "player" | "article";
  entityId: ID;
  createdAt: string;
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  body: string;
  updatedAt: string;
}

export interface PlayerCareerSeason {
  seasonId: ID;
  seasonName: string;
  teamId: ID;
  teamName: string;
  matches: number;
  runs: number;
  balls: number;
  wickets: number;
  bowlingBalls: number;
  runsConceded: number;
  highScore: number;
}

export interface PlayerProfileData {
  player: import("./cricket").Player;
  teams: import("./cricket").Team[];
  currentTeam: import("./cricket").Team | null;
  career: PlayerCareerSeason[];
  recentBatting: Array<{
    matchId: ID;
    matchSlug: string;
    opponent: string;
    date: string;
    runs: number;
    balls: number;
    out: boolean;
  }>;
  recentBowling: Array<{
    matchId: ID;
    matchSlug: string;
    opponent: string;
    date: string;
    wickets: number;
    runs: number;
    overs: string;
  }>;
  roleLabel: string;
}

export const ROLE_LABELS: Record<PlayerRole, string> = {
  batter: "Batter",
  bowler: "Bowler",
  all_rounder: "All-rounder",
  wicketkeeper: "Wicketkeeper",
};
