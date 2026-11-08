-- Local RLS and scoring integration tests.
-- Run with: npm run db:test:rls
\set ON_ERROR_STOP on

-- Deterministic fixture identifiers.
\set tournament  '00000000-0000-4000-8000-000000000001'
\set season      '00000000-0000-4000-8000-000000000002'
\set team_a      '00000000-0000-4000-8000-00000000000a'
\set team_b      '00000000-0000-4000-8000-00000000000b'
\set venue       '00000000-0000-4000-8000-000000000003'
\set match       '00000000-0000-4000-8000-000000000004'
\set batter_a1   '00000000-0000-4000-8000-0000000000a1'
\set batter_a2   '00000000-0000-4000-8000-0000000000a2'
\set bowler_b1   '00000000-0000-4000-8000-0000000000b1'
\set bowler_b2   '00000000-0000-4000-8000-0000000000b2'
\set category    '00000000-0000-4000-8000-000000000005'
\set article_pub '00000000-0000-4000-8000-000000000006'
\set article_dft '00000000-0000-4000-8000-000000000007'
\set poll        '00000000-0000-4000-8000-000000000008'
\set option      '00000000-0000-4000-8000-000000000009'
\set fan         '00000000-0000-4000-8000-0000000000f1'
\set scorer      '00000000-0000-4000-8000-0000000000f2'
\set admin       '00000000-0000-4000-8000-0000000000f3'

-- ---------------------------------------------------------------- fixtures
insert into auth.users (id, email, raw_user_meta_data) values
  (:'fan', 'fan@test.local', '{"username":"test_fan"}'),
  (:'scorer', 'scorer@test.local', '{"username":"test_scorer"}'),
  (:'admin', 'admin@test.local', '{"username":"test_admin"}')
on conflict (id) do nothing;

update public.profiles set role = 'scorer' where id = :'scorer';
update public.profiles set role = 'admin' where id = :'admin';

insert into public.tournaments (id, name, slug) values (:'tournament', 'RLS Test League', 'rls-test-league');
insert into public.seasons (id, tournament_id, name, slug, year, start_date, end_date, status)
values (:'season', :'tournament', 'RLS Test Season', 'rls-test-season', 2026, '2026-01-01', '2026-12-31', 'active');
insert into public.teams (id, name, slug, short_name, home_city) values
  (:'team_a', 'Test Team A', 'test-team-a', 'TTA', 'Kathmandu'),
  (:'team_b', 'Test Team B', 'test-team-b', 'TTB', 'Pokhara');
insert into public.venues (id, name, slug, city) values (:'venue', 'Test Ground', 'test-ground', 'Kathmandu');
insert into public.players (id, full_name, slug, playing_role) values
  (:'batter_a1', 'Batter A One', 'batter-a-one', 'batter'),
  (:'batter_a2', 'Batter A Two', 'batter-a-two', 'batter'),
  (:'bowler_b1', 'Bowler B One', 'bowler-b-one', 'bowler'),
  (:'bowler_b2', 'Bowler B Two', 'bowler-b-two', 'bowler');
insert into public.team_squads (season_id, team_id, player_id) values
  (:'season', :'team_a', :'batter_a1'),
  (:'season', :'team_a', :'batter_a2'),
  (:'season', :'team_b', :'bowler_b1'),
  (:'season', :'team_b', :'bowler_b2');
insert into public.matches (id, season_id, tournament_id, match_number, slug, team_a_id, team_b_id, venue_id, scheduled_at, status, toss_winner_id, toss_decision)
values (:'match', :'season', :'tournament', 1, 'rls-test-match', :'team_a', :'team_b', :'venue', now(), 'live', :'team_a', 'bat');

insert into public.news_categories (id, name, slug) values (:'category', 'Test', 'test');
insert into public.news_articles (id, title, slug, excerpt, body, category_id, status, published_at)
values
  (:'article_pub', 'Published test article', 'published-test-article', 'A published test article for RLS checks.', 'Body text that is long enough for the generated reading time column to work correctly in tests.', :'category', 'published', now()),
  (:'article_dft', 'Draft test article', 'draft-test-article', 'A draft test article for RLS checks.', 'Body text that is long enough for the generated reading time column to work correctly in tests.', :'category', 'draft', null);

insert into public.polls (id, question, slug, status, closes_at) values (:'poll', 'Who wins?', 'who-wins', 'open', now() + interval '1 day');
insert into public.poll_options (id, poll_id, label) values (:'option', :'poll', 'Test Team A');

-- Helper that asserts a statement fails with an expected message fragment.
create or replace function public.expect_error(p_sql text, p_contains text)
returns void
language plpgsql
as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(lower(p_contains) in lower(sqlerrm)) = 0 then
      raise exception 'Expected error containing "%", got "%"', p_contains, sqlerrm;
    end if;
    return;
  end;
  raise exception 'Expected an error containing "%", but the statement succeeded', p_contains;
end;
$$;
grant execute on function public.expect_error(text, text) to anon, authenticated;

-- ---------------------------------------------------------------- anon reads
set role anon;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  published integer;
  drafts integer;
begin
  select count(*) into published from public.news_articles where status = 'published';
  select count(*) into drafts from public.news_articles where status = 'draft';
  if published <> 1 then raise exception 'anon should see exactly 1 published article, saw %', published; end if;
  if drafts <> 0 then raise exception 'anon should not see drafts, saw %', drafts; end if;
end $$;

-- ---------------------------------------------------------------- fan writes
set role authenticated;
select set_config('request.jwt.claim.sub', :'fan', false);

insert into public.comments (article_id, user_id, author_name, body, status)
values (:'article_pub', :'fan', 'test_fan', 'A pending fan comment.', 'pending');

select public.expect_error(
  format('insert into public.comments (article_id, user_id, author_name, body, status) values (%L, %L, %L, %L, %L)',
    :'article_pub', :'fan', 'test_fan', 'An auto-approved comment.', 'approved'),
  'row-level security'
);

select public.expect_error(
  format('update public.profiles set role = %L where id = %L', 'admin', :'fan'),
  'permission denied'
);

select public.expect_error(
  format('select public.record_ball_event(%L, %L, %L, 4, null, 0, null, null, null, null, null)',
    :'match', :'batter_a1', :'bowler_b1'),
  'permission'
);

-- ---------------------------------------------------------------- scorer flow
select set_config('request.jwt.claim.sub', :'scorer', false);

select public.record_ball_event(
  :'match', :'batter_a1', :'bowler_b1', 4,
  null, 0, null, null, null, 'Four through the covers', null
);

do $$
declare
  v_runs integer;
  v_balls integer;
  v_wickets integer;
  v_events integer;
begin
  select total_runs, legal_balls, wickets into v_runs, v_balls, v_wickets from public.innings where match_id = '00000000-0000-4000-8000-000000000004';
  select count(*) into v_events from public.ball_events be join public.innings i on i.id = be.innings_id where i.match_id = '00000000-0000-4000-8000-000000000004';
  if v_runs <> 4 or v_balls <> 1 or v_wickets <> 0 then
    raise exception 'after boundary expected 4/0 in 1 ball, got %/% in % balls', v_runs, v_wickets, v_balls;
  end if;
  if v_events <> 1 then raise exception 'expected 1 ball event, got %', v_events; end if;
end $$;

-- Wide: one extra run, no legal ball.
select public.record_ball_event(
  :'match', :'batter_a1', :'bowler_b1', 0,
  'wide', 1, null, null, null, null, null
);

do $$
declare
  v_runs integer;
  v_balls integer;
  v_extras integer;
begin
  select total_runs, legal_balls, extras into v_runs, v_balls, v_extras from public.innings where match_id = '00000000-0000-4000-8000-000000000004';
  if v_runs <> 5 or v_balls <> 1 or v_extras <> 1 then
    raise exception 'after wide expected 5 runs / 1 extra in 1 legal ball, got % runs, % extras, % balls', v_runs, v_extras, v_balls;
  end if;
end $$;

select public.undo_last_ball(:'match', :'scorer');

do $$
declare
  v_runs integer;
  v_balls integer;
  v_events integer;
begin
  select total_runs, legal_balls into v_runs, v_balls from public.innings where match_id = '00000000-0000-4000-8000-000000000004';
  select count(*) into v_events from public.ball_events be join public.innings i on i.id = be.innings_id where i.match_id = '00000000-0000-4000-8000-000000000004';
  if v_runs <> 4 or v_balls <> 1 or v_events <> 1 then
    raise exception 'undo failed: expected 4 runs / 1 ball / 1 event, got % / % / %', v_runs, v_balls, v_events;
  end if;
end $$;

-- ---------------------------------------------------------------- poll voting
select set_config('request.jwt.claim.sub', :'fan', false);
select public.cast_poll_vote(:'poll', :'option', :'fan');

do $$
declare
  v_votes integer;
begin
  select vote_count into v_votes from public.poll_options where id = '00000000-0000-4000-8000-000000000009';
  if v_votes <> 1 then raise exception 'expected 1 poll vote, got %', v_votes; end if;
end $$;

select public.expect_error(
  format('select public.cast_poll_vote(%L, %L, %L)', :'poll', :'option', :'fan'),
  'already voted'
);

-- ---------------------------------------------------------------- admin write
select set_config('request.jwt.claim.sub', :'admin', false);
update public.matches set result_summary = 'Test update by admin' where id = :'match';

do $$
declare
  v_summary text;
begin
  select result_summary into v_summary from public.matches where id = '00000000-0000-4000-8000-000000000004';
  if v_summary <> 'Test update by admin' then raise exception 'admin update did not persist'; end if;
end $$;

-- ---------------------------------------------------------------- realtime + completion tables
reset role;
insert into public.article_tags (article_id, tag) values (:'article_pub', 'test');
insert into public.media_assets (bucket, path, url, mime_type, size_bytes)
values ('media', 'tests/cover.jpg', 'https://example.test/cover.jpg', 'image/jpeg', 1024);
insert into public.news_article_revisions (article_id, editor_id, title, excerpt, body, status)
values (:'article_pub', :'admin', 'Published test article', 'Excerpt', 'Revision body', 'published');
insert into public.notifications (user_id, type, title, body) values (:'fan', 'system', 'Test notification', 'Hello');

-- Anon can read the public realtime feed and editorial tag/media indexes...
select set_config('request.jwt.claim.sub', '', false);
set role anon;
do $$
declare
  v_events integer;
  v_tags integer;
  v_media integer;
begin
  select count(*) into v_events from public.match_events_log;
  select count(*) into v_tags from public.article_tags;
  select count(*) into v_media from public.media_assets;
  if v_events < 1 then raise exception 'anon should read match_events_log, got % rows', v_events; end if;
  if v_tags <> 1 then raise exception 'anon should read article_tags, got % rows', v_tags; end if;
  if v_media <> 1 then raise exception 'anon should read media_assets, got % rows', v_media; end if;
end $$;

-- ...but cannot fabricate live events or read staff-only revision history.
select public.expect_error(
  format('insert into public.match_events_log (match_id, event_type) values (%L, %L)', :'match', 'ball_events'),
  'permission denied'
);
select public.expect_error('select * from public.news_article_revisions', 'permission denied');
select public.expect_error('select * from public.notifications', 'permission denied');
reset role;

-- Staff can read revision history; a fan can read only their own notifications.
select set_config('request.jwt.claim.sub', :'admin', false);
set role authenticated;
do $$
declare
  v_revisions integer;
begin
  select count(*) into v_revisions from public.news_article_revisions;
  if v_revisions <> 1 then raise exception 'staff should read revisions, got %', v_revisions; end if;
end $$;
reset role;

select set_config('request.jwt.claim.sub', :'fan', false);
set role authenticated;
do $$
declare
  v_own integer;
  v_all integer;
begin
  select count(*) into v_own from public.notifications where user_id = '00000000-0000-4000-8000-0000000000f1';
  select count(*) into v_all from public.notifications;
  if v_own <> 1 then raise exception 'fan should read own notification, got %', v_own; end if;
  if v_all <> 1 then raise exception 'fan should not read other notifications, got %', v_all; end if;
end $$;
reset role;

\echo 'RLS and scoring integration tests passed.'
