-- NPL Cricket Hub — core schema
-- Apply with: supabase db push   (or psql -f supabase/migrations/0001_schema.sql)
--
-- Design notes:
--   * Every public statistic is derived from ball_events by the TypeScript engine.
--   * innings.total_runs / wickets / legal_balls / extras are maintained caches.
--   * all timestamps are stored in UTC (timestamptz); presentation converts to Asia/Kathmandu.

create extension if not exists pgcrypto;

do $$ begin create type season_status as enum ('upcoming', 'active', 'completed'); exception when duplicate_object then null; end $$;
do $$ begin create type match_status as enum ('scheduled', 'live', 'completed', 'abandoned', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type toss_decision as enum ('bat', 'bowl'); exception when duplicate_object then null; end $$;
do $$ begin create type player_role as enum ('batter', 'bowler', 'all_rounder', 'wicketkeeper'); exception when duplicate_object then null; end $$;
do $$ begin create type extra_type as enum ('wide', 'no_ball', 'bye', 'leg_bye', 'penalty'); exception when duplicate_object then null; end $$;
do $$ begin create type wicket_type as enum ('bowled', 'caught', 'caught_and_bowled', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_hurt', 'obstructing_field', 'timed_out'); exception when duplicate_object then null; end $$;
do $$ begin create type article_status as enum ('draft', 'scheduled', 'published', 'archived'); exception when duplicate_object then null; end $$;
do $$ begin create type poll_status as enum ('open', 'closed'); exception when duplicate_object then null; end $$;
do $$ begin create type comment_status as enum ('pending', 'approved', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type user_role as enum ('user', 'moderator', 'author', 'editor', 'scorer', 'admin', 'super_admin'); exception when duplicate_object then null; end $$;
do $$ begin create type data_source as enum ('manual', 'provider', 'demo'); exception when duplicate_object then null; end $$;
do $$ begin create type sync_status as enum ('success', 'partial', 'failed', 'skipped'); exception when duplicate_object then null; end $$;
do $$ begin create type prediction_status as enum ('open', 'closed', 'settled'); exception when duplicate_object then null; end $$;
do $$ begin create type prediction_kind as enum ('winner', 'player_of_match', 'top_run_scorer', 'top_wicket_taker'); exception when duplicate_object then null; end $$;
do $$ begin create type bookmark_entity as enum ('team', 'player', 'article'); exception when duplicate_object then null; end $$;

/* ------------------------------ Competition ------------------------------ */

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  format text not null default 'T20',
  country text not null default 'Nepal',
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  slug text not null unique,
  year integer not null check (year between 1900 and 2200),
  start_date date not null,
  end_date date not null,
  status season_status not null default 'upcoming',
  description text not null default '',
  settings jsonb not null default '{"pointsWin":2,"pointsTie":1,"pointsNoResult":1,"ballsPerInnings":120,"allOutUsesFullQuota":true}'::jsonb,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_name text not null check (char_length(short_name) between 2 and 6),
  logo_url text,
  primary_color text not null default '#166534' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  description text not null default '',
  home_city text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text not null unique,
  profile_image text,
  date_of_birth date,
  nationality text not null default 'Nepal',
  batting_style text not null default 'Right-hand bat' check (batting_style in ('Right-hand bat', 'Left-hand bat')),
  bowling_style text not null default 'None' check (bowling_style in ('Right-arm fast', 'Right-arm medium', 'Right-arm offbreak', 'Right-arm legbreak', 'Left-arm fast', 'Left-arm medium', 'Left-arm orthodox', 'Left-arm wrist spin', 'None')),
  playing_role player_role not null default 'batter',
  biography text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  country text not null default 'Nepal',
  capacity integer check (capacity is null or capacity > 0),
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.team_squads (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  jersey_number integer check (jersey_number is null or jersey_number between 0 and 999),
  captain boolean not null default false,
  vice_captain boolean not null default false,
  created_at timestamptz not null default now(),
  unique (season_id, player_id),
  unique (season_id, team_id, player_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  match_number integer not null check (match_number > 0),
  slug text not null unique,
  team_a_id uuid not null references public.teams(id),
  team_b_id uuid not null references public.teams(id),
  venue_id uuid not null references public.venues(id),
  scheduled_at timestamptz not null,
  status match_status not null default 'scheduled',
  toss_winner_id uuid references public.teams(id),
  toss_decision toss_decision,
  winner_id uuid references public.teams(id),
  result_summary text,
  provider_match_id text,
  data_source data_source not null default 'manual',
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (season_id, match_number),
  check (team_a_id <> team_b_id),
  check (toss_winner_id is null or toss_winner_id in (team_a_id, team_b_id)),
  check (winner_id is null or winner_id in (team_a_id, team_b_id))
);

create table if not exists public.playing_xi (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  batting_order integer not null default 0 check (batting_order between 0 and 11),
  is_captain boolean not null default false,
  is_wicketkeeper boolean not null default false,
  unique (match_id, player_id)
);

create table if not exists public.innings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  innings_number integer not null check (innings_number between 1 and 2),
  batting_team_id uuid not null references public.teams(id),
  bowling_team_id uuid not null references public.teams(id),
  total_runs integer not null default 0 check (total_runs >= 0),
  wickets integer not null default 0 check (wickets between 0 and 10),
  legal_balls integer not null default 0 check (legal_balls >= 0),
  extras integer not null default 0 check (extras >= 0),
  declared boolean not null default false,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (match_id, innings_number),
  check (batting_team_id <> bowling_team_id)
);

create table if not exists public.ball_events (
  id uuid primary key default gen_random_uuid(),
  innings_id uuid not null references public.innings(id) on delete cascade,
  over_number integer not null check (over_number >= 1),
  ball_number integer not null check (ball_number between 1 and 6),
  legal_ball boolean not null default true,
  batter_id uuid not null references public.players(id),
  bowler_id uuid not null references public.players(id),
  runs_batter integer not null default 0 check (runs_batter between 0 and 6),
  runs_extras integer not null default 0 check (runs_extras between 0 and 7),
  total_runs integer generated always as (runs_batter + runs_extras) stored,
  extra_type extra_type,
  wicket_type wicket_type,
  dismissed_player_id uuid references public.players(id),
  fielder_id uuid references public.players(id),
  commentary text not null default '',
  provider_event_id text unique,
  created_at timestamptz not null default now(),
  check (wicket_type is null or runs_batter = 0)
);

/* ------------------------------ Editorial ------------------------------ */

create table if not exists public.news_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  body text not null,
  featured_image text,
  image_caption text,
  category_id uuid not null references public.news_categories(id),
  author_id uuid,
  author_name text not null default 'NPL Cricket Hub Editorial',
  tags text[] not null default '{}',
  seo_title text,
  meta_description text,
  canonical_url text,
  status article_status not null default 'draft',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  reading_minutes integer generated always as (
    greatest(2, ceil(array_length(regexp_split_to_array(trim(body), '\s+'), 1) / 200.0)::integer)
  ) stored,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

/* ------------------------------ Fan engagement ------------------------------ */

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  slug text not null unique,
  description text not null default '',
  status poll_status not null default 'open',
  closes_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  team_id uuid references public.teams(id) on delete set null,
  player_id uuid references public.players(id) on delete set null,
  vote_count integer not null default 0 check (vote_count >= 0),
  unique (poll_id, label)
);

create table if not exists public.fan_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  title text not null,
  closes_at timestamptz not null,
  status prediction_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.prediction_options (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  label text not null,
  player_id uuid references public.players(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  kind prediction_kind not null default 'winner',
  unique (prediction_id, label)
);

create table if not exists public.user_predictions (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  user_id uuid not null,
  option_id uuid not null references public.prediction_options(id) on delete cascade,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  unique (prediction_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  user_id uuid not null,
  author_name text not null,
  body text not null check (char_length(body) between 2 and 2000),
  status comment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  entity_type bookmark_entity not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

/* ------------------------------ Accounts / ops ------------------------------ */

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  avatar_url text,
  favourite_team_id uuid references public.teams(id) on delete set null,
  role user_role not null default 'user',
  points integer not null default 0 check (points >= 0),
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text not null default '',
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  details text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.data_sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  status sync_status not null,
  message text not null default '',
  records_processed integer not null default 0 check (records_processed >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);

/* ------------------------------ Indexes ------------------------------ */

create index if not exists idx_seasons_status on public.seasons(status);
create index if not exists idx_team_squads_season on public.team_squads(season_id);
create index if not exists idx_team_squads_team on public.team_squads(team_id);
create index if not exists idx_matches_season on public.matches(season_id);
create index if not exists idx_matches_status on public.matches(status);
create index if not exists idx_matches_scheduled on public.matches(scheduled_at desc);
create index if not exists idx_innings_match on public.innings(match_id);
create index if not exists idx_ball_events_innings on public.ball_events(innings_id, created_at);
create index if not exists idx_ball_events_provider on public.ball_events(provider_event_id) where provider_event_id is not null;
create index if not exists idx_articles_status on public.news_articles(status, published_at desc);
create index if not exists idx_articles_category on public.news_articles(category_id);
create index if not exists idx_articles_tags on public.news_articles using gin(tags);
create index if not exists idx_comments_article on public.comments(article_id, created_at);
create index if not exists idx_comments_status on public.comments(status, created_at desc);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_audit_created on public.admin_audit_logs(created_at desc);
create index if not exists idx_sync_started on public.data_sync_logs(started_at desc);

/* ------------------------------ Triggers ------------------------------ */

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists articles_set_updated_at on public.news_articles;
create trigger articles_set_updated_at before update on public.news_articles
for each row execute function public.set_updated_at();

-- Keep matches.last_updated fresh when the result or status changes.
create or replace function public.touch_match()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

drop trigger if exists matches_touch on public.matches;
create trigger matches_touch before update on public.matches
for each row execute function public.touch_match();

-- Create a profile row for every Supabase auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
