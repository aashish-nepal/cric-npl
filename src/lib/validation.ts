import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
  next: z.string().optional().default(""),
});

export const registrationSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be 30 characters or fewer")
      .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers and underscores only"),
    email: emailSchema,
    password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be 72 characters or fewer"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const idSchema = z.string().trim().min(1, "Selection is required").max(120);

export const voteSchema = z.object({
  pollId: idSchema,
  optionId: idSchema,
  slug: z.string().trim().max(160).optional().default(""),
});

export const predictionSchema = z.object({
  predictionId: idSchema,
  optionId: idSchema,
});

export const commentSchema = z.object({
  articleId: idSchema,
  slug: z.string().trim().min(1).max(200),
  body: z.string().trim().min(2, "Comments must be at least 2 characters").max(2000, "Comments must be 2000 characters or fewer"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: emailSchema,
  subject: z.string().trim().min(3, "Add a subject").max(160),
  message: z.string().trim().min(10, "Add a little more detail").max(4000),
});

export const extraTypeSchema = z.enum(["wide", "no_ball", "bye", "leg_bye", "penalty"]);
export const wicketTypeSchema = z.enum([
  "bowled",
  "caught",
  "caught_and_bowled",
  "lbw",
  "run_out",
  "stumped",
  "hit_wicket",
  "retired_hurt",
  "obstructing_field",
  "timed_out",
]);

const optionalId = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value ? value : null));

export const ballSchema = z.object({
  matchId: idSchema,
  batterId: idSchema,
  bowlerId: idSchema,
  runsBatter: z.coerce.number().int().min(0).max(6),
  extraType: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value !== "none" ? value : null))
    .pipe(extraTypeSchema.nullable()),
  runsExtras: z.coerce.number().int().min(0).max(7).optional().default(0),
  wicketType: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value !== "none" ? value : null))
    .pipe(wicketTypeSchema.nullable()),
  dismissedPlayerId: optionalId,
  fielderId: optionalId,
  commentary: z.string().trim().max(500).optional().default(""),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(2, "Team name is required").max(120),
  shortName: z.string().trim().min(2, "Short name is required").max(6),
  homeCity: z.string().trim().min(2, "Home city is required").max(120),
  description: z.string().trim().min(10, "Add a short description").max(1000),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour")
    .optional()
    .default("#166534"),
});

export const playerRoleSchema = z.enum(["batter", "bowler", "all_rounder", "wicketkeeper"]);
export const battingStyleSchema = z.enum(["Right-hand bat", "Left-hand bat"]);
export const bowlingStyleSchema = z.enum([
  "Right-arm fast",
  "Right-arm medium",
  "Right-arm offbreak",
  "Right-arm legbreak",
  "Left-arm fast",
  "Left-arm medium",
  "Left-arm orthodox",
  "Left-arm wrist spin",
  "None",
]);

export const createPlayerSchema = z.object({
  fullName: z.string().trim().min(2, "Player name is required").max(120),
  playingRole: playerRoleSchema,
  battingStyle: battingStyleSchema,
  bowlingStyle: bowlingStyleSchema,
  nationality: z.string().trim().min(2).max(80).optional().default("Nepal"),
  biography: z.string().trim().max(2000).optional().default(""),
  teamId: z.string().trim().max(120).optional().default(""),
  seasonId: z.string().trim().max(120).optional().default(""),
});

export const seasonStatusSchema = z.enum(["upcoming", "active", "completed"]);

export const createTournamentSchema = z.object({
  name: z.string().trim().min(3, "Tournament name is required").max(120),
  format: z.string().trim().min(2).max(40).optional().default("T20"),
  country: z.string().trim().min(2).max(80).optional().default("Nepal"),
  description: z.string().trim().max(1000).optional().default(""),
});

export const createSeasonSchema = z.object({
  tournamentId: idSchema,
  name: z.string().trim().min(3, "Season name is required").max(120),
  year: z.coerce.number().int().min(1900).max(2200),
  startDate: z.string().trim().min(8, "Choose a start date").max(20),
  endDate: z.string().trim().min(8, "Choose an end date").max(20),
  status: seasonStatusSchema.optional().default("upcoming"),
  description: z.string().trim().max(1000).optional().default(""),
});

export const seasonStatusUpdateSchema = z.object({
  seasonId: idSchema,
  status: seasonStatusSchema,
});

export const createVenueSchema = z.object({
  name: z.string().trim().min(2, "Venue name is required").max(120),
  city: z.string().trim().min(2, "City is required").max(120),
  country: z.string().trim().min(2).max(80).optional().default("Nepal"),
  capacity: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().min(1).max(500000).optional(),
  ),
  description: z.string().trim().max(2000).optional().default(""),
});

export const updateVenueSchema = z.object({
  venueId: idSchema,
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80).optional().default("Nepal"),
  capacity: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().min(1).max(500000).optional(),
  ),
  description: z.string().trim().max(2000).optional().default(""),
});

export const createMatchSchema = z.object({
  seasonId: idSchema,
  teamAId: idSchema,
  teamBId: idSchema,
  venueId: idSchema,
  scheduledAt: z.string().trim().min(1, "Choose a date and time"),
  matchNumber: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    z.coerce.number().int().min(1).max(999).optional(),
  ),
});

export const updateMatchSchema = z.object({
  matchId: idSchema,
  status: z.enum(["scheduled", "live", "completed", "abandoned", "cancelled"]),
  venueId: z.string().trim().max(120).optional(),
  tossWinnerId: z.string().trim().max(120).optional(),
  tossDecision: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "bat" || value === "bowl" ? value : null)),
  winnerId: z.string().trim().max(120).optional(),
  resultSummary: z.string().trim().max(500).optional(),
});

export const completeMatchSchema = z.object({
  matchId: idSchema,
  winnerId: z.string().trim().max(120).optional().default(""),
  resultSummary: z.string().trim().min(3, "Add a result summary").max(500),
});

export const articleStatusSchema = z.enum(["draft", "scheduled", "published", "archived"]);

export const articleSchema = z.object({
  articleId: z.string().trim().max(120).optional().default(""),
  title: z.string().trim().min(5, "Headline is too short").max(200),
  slug: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default("")
    .transform((value) => value.replace(/^\/+|\/+$/g, "")),
  excerpt: z.string().trim().min(20, "Add a summary of at least 20 characters").max(400),
  body: z.string().trim().min(100, "Article body is too short").max(60000),
  categoryId: idSchema,
  tags: z
    .string()
    .trim()
    .max(400)
    .optional()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12),
    ),
  status: articleStatusSchema.default("draft"),
  seoTitle: z.string().trim().max(200).optional().default(""),
  metaDescription: z.string().trim().max(400).optional().default(""),
  featuredImage: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default("")
    .transform((value) => value || null),
  imageCaption: z.string().trim().max(240).optional().default(""),
  canonicalUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default("")
    .refine((value) => value === "" || value.startsWith("/") || value.startsWith("https://"), "Canonical URL must be a path or an https URL")
    .transform((value) => value || null),
  featured: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true"),
});

export const moderationSchema = z.object({
  commentId: idSchema,
  status: z.enum(["approved", "rejected", "pending"]),
});

export const userRoleSchema = z.enum(["user", "author", "moderator", "editor", "scorer", "admin", "super_admin"]);

export const userRoleUpdateSchema = z.object({
  userId: idSchema,
  role: userRoleSchema,
});

export const userSuspensionSchema = z.object({
  userId: idSchema,
  suspended: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const squadSchema = z.object({
  seasonId: idSchema,
  teamId: idSchema,
  playerId: idSchema,
});

export const bookmarkSchema = z.object({
  entityType: z.enum(["team", "player", "article"]),
  entityId: idSchema,
});
