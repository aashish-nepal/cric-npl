-- NPL Cricket Hub — realtime event log + completion tables
--
-- 1. match_events_log is the single realtime fan-out surface. Triggers write one
--    row per score-affecting change, so clients can subscribe to a narrow
--    `match_id` filter instead of receiving every ball event on the platform.
-- 2. The remaining tables complete the schema required by the product brief.
--    Several are optional snapshots/caches; the canonical source remains
--    `ball_events` + `innings` and every public statistic is derived from them.

/* ------------------------------ Realtime fan-out ------------------------------ */

create table if not exists public.match_events_log (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  event_type text not null check (event_type in ('ball_events', 'innings', 'matches', 'toss', 'result')),
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_match_events_log_match on public.match_events_log(match_id, created_at desc);

alter table public.match_events_log enable row level security;

drop policy if exists match_events_log_public_read on public.match_events_log;
create policy match_events_log_public_read on public.match_events_log
for select to anon, authenticated using (true);

-- Only server-side triggers (security definer) write here. Public clients must
-- never be able to fabricate a live-score event.
revoke insert, update, delete on public.match_events_log from anon, authenticated;
grant select on public.match_events_log to anon, authenticated;

create or replace function public.log_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mid uuid;
  eid uuid;
  payload jsonb;
begin
  if tg_table_name = 'matches' then
    mid := case when tg_op = 'DELETE' then old.id else new.id end;
  elsif tg_table_name = 'innings' then
    mid := case when tg_op = 'DELETE' then old.match_id else new.match_id end;
  else
    select i.match_id into mid
    from public.innings i
    where i.id = case when tg_op = 'DELETE' then old.innings_id else new.innings_id end;
  end if;

  eid := case when tg_op = 'DELETE' then old.id else new.id end;
  payload := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  if mid is not null then
    insert into public.match_events_log (match_id, event_type, entity_id, payload)
    values (mid, tg_table_name, eid, payload);
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_ball_events_match_log on public.ball_events;
create trigger trg_ball_events_match_log
after insert or update or delete on public.ball_events
for each row execute function public.log_match_event();

drop trigger if exists trg_innings_match_log on public.innings;
create trigger trg_innings_match_log
after insert or update or delete on public.innings
for each row execute function public.log_match_event();

drop trigger if exists trg_matches_match_log on public.matches;
create trigger trg_matches_match_log
after update on public.matches
for each row execute function public.log_match_event();

-- Enable the table on Supabase Realtime when the publication exists (hosted
-- Supabase). The local test harness has no publication and safely skips this.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.match_events_log';
    exception
      when duplicate_object then null;
      when others then null;
    end;
  end if;
end $$;

/* ------------------------------ Editorial completion ------------------------------ */

create table if not exists public.news_article_revisions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.news_articles(id) on delete cascade,
  editor_id uuid,
  title text not null,
  excerpt text not null,
  body text not null,
  status article_status not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_article_revisions_article on public.news_article_revisions(article_id, created_at desc);

alter table public.news_article_revisions enable row level security;

drop policy if exists article_revisions_staff_read on public.news_article_revisions;
create policy article_revisions_staff_read on public.news_article_revisions
for select to authenticated using (public.can_manage_news());

revoke insert, update, delete on public.news_article_revisions from anon, authenticated;
grant select on public.news_article_revisions to authenticated;

create table if not exists public.article_tags (
  article_id uuid not null references public.news_articles(id) on delete cascade,
  tag text not null check (char_length(tag) between 1 and 60),
  created_at timestamptz not null default now(),
  primary key (article_id, tag)
);

create index if not exists idx_article_tags_tag on public.article_tags(tag);
alter table public.article_tags enable row level security;

drop policy if exists article_tags_public_read on public.article_tags;
create policy article_tags_public_read on public.article_tags
for select to anon, authenticated using (true);

grant select on public.article_tags to anon, authenticated;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  url text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

alter table public.media_assets enable row level security;

drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets
for select to anon, authenticated using (true);

drop policy if exists media_assets_staff_write on public.media_assets;
create policy media_assets_staff_write on public.media_assets
for insert to authenticated with check (public.can_manage_news());

revoke update, delete on public.media_assets from anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert on public.media_assets to authenticated;

/* ------------------------------ Notifications ------------------------------ */

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'system',
  title text not null,
  body text not null default '',
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_owner_read on public.notifications;
create policy notifications_owner_read on public.notifications
for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_staff_insert on public.notifications;
create policy notifications_staff_insert on public.notifications
for insert to authenticated with check (public.is_staff());

grant select, update on public.notifications to authenticated;

/* ------------------------------ Derived snapshots ------------------------------ */
-- Optional materialised views of the pure-TS engine. They exist so a future
-- read-heavy deployment can cache aggregates without changing the public API.
-- `ball_events` remains the source of truth; never edit these by hand.

create table if not exists public.points_table_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  captured_at timestamptz not null default now(),
  payload jsonb not null,
  unique (season_id, captured_at)
);

create table if not exists public.player_match_statistics (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  runs integer not null default 0 check (runs >= 0),
  balls integer not null default 0 check (balls >= 0),
  fours integer not null default 0 check (fours >= 0),
  sixes integer not null default 0 check (sixes >= 0),
  wickets integer not null default 0 check (wickets between 0 and 10),
  runs_conceded integer not null default 0 check (runs_conceded >= 0),
  legal_balls integer not null default 0 check (legal_balls >= 0),
  catches integer not null default 0 check (catches >= 0),
  run_outs integer not null default 0 check (run_outs >= 0),
  unique (match_id, player_id)
);

create table if not exists public.team_match_statistics (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  runs integer not null default 0 check (runs >= 0),
  wickets integer not null default 0 check (wickets between 0 and 10),
  legal_balls integer not null default 0 check (legal_balls >= 0),
  extras integer not null default 0 check (extras >= 0),
  unique (match_id, team_id)
);

create table if not exists public.partnerships (
  id uuid primary key default gen_random_uuid(),
  innings_id uuid not null references public.innings(id) on delete cascade,
  wicket_number integer not null check (wicket_number between 1 and 10),
  batter_a_id uuid not null references public.players(id),
  batter_b_id uuid not null references public.players(id),
  runs integer not null default 0 check (runs >= 0),
  legal_balls integer not null default 0 check (legal_balls >= 0),
  unbroken boolean not null default true,
  unique (innings_id, wicket_number)
);

create table if not exists public.fall_of_wickets (
  id uuid primary key default gen_random_uuid(),
  innings_id uuid not null references public.innings(id) on delete cascade,
  wicket_number integer not null check (wicket_number between 1 and 10),
  runs integer not null default 0 check (runs >= 0),
  legal_balls integer not null default 0 check (legal_balls >= 0),
  over_text text not null default '',
  batter_id uuid not null references public.players(id),
  dismissal_type text not null,
  unique (innings_id, wicket_number)
);

create index if not exists idx_points_snapshots_season on public.points_table_snapshots(season_id, captured_at desc);
create index if not exists idx_player_match_stats_player on public.player_match_statistics(player_id);
create index if not exists idx_team_match_stats_team on public.team_match_statistics(team_id);
create index if not exists idx_partnerships_innings on public.partnerships(innings_id);
create index if not exists idx_fow_innings on public.fall_of_wickets(innings_id);

alter table public.points_table_snapshots enable row level security;
alter table public.player_match_statistics enable row level security;
alter table public.team_match_statistics enable row level security;
alter table public.partnerships enable row level security;
alter table public.fall_of_wickets enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['points_table_snapshots', 'player_match_statistics', 'team_match_statistics', 'partnerships', 'fall_of_wickets']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_public_read', t);
    execute format('revoke insert, update, delete on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;
end $$;

/* ------------------------------ Storage ------------------------------ */
-- Public editorial media bucket. The upload route validates MIME/size before
-- writing; these policies protect direct SDK access as a second layer.

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('media', 'media', true)
    on conflict (id) do nothing;

    if to_regclass('storage.objects') is not null then
      execute 'drop policy if exists media_public_read on storage.objects';
      execute 'create policy media_public_read on storage.objects for select to anon, authenticated using (bucket_id = ''media'')';
      execute 'drop policy if exists media_staff_write on storage.objects';
      execute 'create policy media_staff_write on storage.objects for insert to authenticated with check (bucket_id = ''media'' and public.can_manage_news())';
    end if;
  end if;
end $$;
