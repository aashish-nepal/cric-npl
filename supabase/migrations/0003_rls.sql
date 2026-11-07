-- NPL Cricket Hub — Row Level Security
-- The server uses the service-role key for trusted reads/writes; these policies
-- protect any direct anon/authenticated access (for example a future client SDK).

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('author', 'moderator', 'editor', 'scorer', 'admin', 'super_admin'), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'super_admin'), false);
$$;

create or replace function public.can_score()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('scorer', 'admin', 'super_admin'), false);
$$;

create or replace function public.can_manage_news()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('author', 'editor', 'admin', 'super_admin'), false);
$$;

create or replace function public.can_moderate()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('moderator', 'editor', 'admin', 'super_admin'), false);
$$;

alter table public.tournaments enable row level security;
alter table public.seasons enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.venues enable row level security;
alter table public.team_squads enable row level security;
alter table public.matches enable row level security;
alter table public.playing_xi enable row level security;
alter table public.innings enable row level security;
alter table public.ball_events enable row level security;
alter table public.news_categories enable row level security;
alter table public.news_articles enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.fan_votes enable row level security;
alter table public.predictions enable row level security;
alter table public.prediction_options enable row level security;
alter table public.user_predictions enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reports enable row level security;
alter table public.bookmarks enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.data_sync_logs enable row level security;

/* ------------------------------ Public reads ------------------------------ */

do $$
declare
  t text;
begin
  foreach t in array array[
    'tournaments', 'seasons', 'teams', 'players', 'venues', 'team_squads',
    'matches', 'playing_xi', 'innings', 'ball_events', 'news_categories',
    'polls', 'poll_options', 'predictions', 'prediction_options'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_public_read', t);
  end loop;
end $$;

drop policy if exists news_articles_public_read on public.news_articles;
create policy news_articles_public_read on public.news_articles
for select to anon, authenticated
using (status = 'published');

drop policy if exists news_articles_staff_all on public.news_articles;
create policy news_articles_staff_all on public.news_articles
for all to authenticated
using (public.can_manage_news())
with check (public.can_manage_news());

drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments
for select to anon, authenticated
using (status = 'approved');

drop policy if exists comments_staff_read on public.comments;
create policy comments_staff_read on public.comments
for select to authenticated
using (public.is_staff());

drop policy if exists comments_author_insert on public.comments;
create policy comments_author_insert on public.comments
for insert to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists comments_moderator_update on public.comments;
create policy comments_moderator_update on public.comments
for update to authenticated
using (public.can_moderate())
with check (public.can_moderate());

drop policy if exists comment_reports_author_insert on public.comment_reports;
create policy comment_reports_author_insert on public.comment_reports
for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists comment_reports_staff_read on public.comment_reports;
create policy comment_reports_staff_read on public.comment_reports
for select to authenticated
using (public.is_staff());

/* ------------------------------ Fan engagement ------------------------------ */

drop policy if exists fan_votes_owner_read on public.fan_votes;
create policy fan_votes_owner_read on public.fan_votes
for select to authenticated
using (user_id = auth.uid());

drop policy if exists fan_votes_staff_read on public.fan_votes;
create policy fan_votes_staff_read on public.fan_votes
for select to authenticated
using (public.is_staff());

drop policy if exists user_predictions_owner_read on public.user_predictions;
create policy user_predictions_owner_read on public.user_predictions
for select to authenticated
using (user_id = auth.uid());

drop policy if exists user_predictions_owner_insert on public.user_predictions;
create policy user_predictions_owner_insert on public.user_predictions
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists user_predictions_staff_read on public.user_predictions;
create policy user_predictions_staff_read on public.user_predictions
for select to authenticated
using (public.is_staff());

drop policy if exists bookmarks_owner_all on public.bookmarks;
create policy bookmarks_owner_all on public.bookmarks
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

/* ------------------------------ Profiles ------------------------------ */

drop policy if exists profiles_owner_read on public.profiles;
create policy profiles_owner_read on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_staff_read on public.profiles;
create policy profiles_staff_read on public.profiles
for select to authenticated
using (public.is_staff());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

/* ------------------------------ Competition writes ------------------------------ */

do $$
declare
  t text;
begin
  foreach t in array array[
    'tournaments', 'seasons', 'teams', 'players', 'venues', 'team_squads',
    'matches', 'playing_xi'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin_write', t);
  end loop;
end $$;

drop policy if exists polls_admin_write on public.polls;
create policy polls_admin_write on public.polls
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists poll_options_admin_write on public.poll_options;
create policy poll_options_admin_write on public.poll_options
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists predictions_admin_write on public.predictions;
create policy predictions_admin_write on public.predictions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists prediction_options_admin_write on public.prediction_options;
create policy prediction_options_admin_write on public.prediction_options
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_audit_logs_staff_read on public.admin_audit_logs;
create policy admin_audit_logs_staff_read on public.admin_audit_logs
for select to authenticated
using (public.is_staff());

drop policy if exists data_sync_logs_staff_read on public.data_sync_logs;
create policy data_sync_logs_staff_read on public.data_sync_logs
for select to authenticated
using (public.is_staff());

/* ------------------------------ Grants ------------------------------ */

grant usage on schema public to anon, authenticated;

grant select on public.tournaments, public.seasons, public.teams, public.players, public.venues,
  public.team_squads, public.matches, public.playing_xi, public.innings, public.ball_events,
  public.news_categories, public.polls, public.poll_options, public.predictions,
  public.prediction_options to anon, authenticated;

grant select on public.news_articles, public.comments to anon, authenticated;
grant insert, update, delete on public.news_articles to authenticated;
grant insert, update on public.comments to authenticated;
grant insert, update, delete on public.tournaments, public.seasons, public.teams, public.players,
  public.venues, public.team_squads, public.matches, public.playing_xi, public.polls,
  public.poll_options, public.predictions, public.prediction_options to authenticated;
grant insert on public.comment_reports to authenticated;
grant select on public.comment_reports to authenticated;
grant select, insert, delete on public.bookmarks to authenticated;
grant select on public.fan_votes to authenticated;
grant select, insert on public.user_predictions to authenticated;
grant select on public.admin_audit_logs, public.data_sync_logs to authenticated;

-- Profiles: authenticated users may only edit safe columns. Role and suspension
-- changes are performed by the server with the service-role key.
grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (username, avatar_url, favourite_team_id) on public.profiles to authenticated;
