-- OPTIONAL demo seed for a Supabase project.
--
-- This file intentionally contains clearly-labelled demo teams and players. It is
-- NOT official NPL data and must be replaced with verified competition data before
-- launch. Auth users are created through Supabase Auth, not seeded here.

insert into public.tournaments (id, name, slug, format, country, description)
values ('10000000-0000-4000-8000-000000000001', 'NPL Demo League', 'npl-demo-league', 'T20', 'Nepal', 'Demo competition used to exercise the platform.')
on conflict (id) do nothing;

insert into public.seasons (id, tournament_id, name, slug, year, start_date, end_date, status, description)
values ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Demo Season 2026', 'demo-season-2026', 2026, '2026-11-01', '2026-12-15', 'active', 'Demo season. Replace with the verified season configuration.')
on conflict (id) do nothing;

insert into public.venues (id, name, slug, city, country, capacity, description) values
  ('10000000-0000-4000-8000-000000000010', 'Demo National Ground', 'demo-national-ground', 'Kathmandu', 'Nepal', 15000, 'Demo venue.'),
  ('10000000-0000-4000-8000-000000000011', 'Demo Lakeside Ground', 'demo-lakeside-ground', 'Pokhara', 'Nepal', 12000, 'Demo venue.')
on conflict (id) do nothing;

insert into public.teams (id, name, slug, short_name, primary_color, description, home_city) values
  ('10000000-0000-4000-8000-000000000021', 'Demo Kathmandu', 'demo-kathmandu', 'DKA', '#166534', 'Demo team for local evaluation.', 'Kathmandu'),
  ('10000000-0000-4000-8000-000000000022', 'Demo Pokhara', 'demo-pokhara', 'DPO', '#1d4ed8', 'Demo team for local evaluation.', 'Pokhara'),
  ('10000000-0000-4000-8000-000000000023', 'Demo Chitwan', 'demo-chitwan', 'DCH', '#b91c1c', 'Demo team for local evaluation.', 'Bharatpur'),
  ('10000000-0000-4000-8000-000000000024', 'Demo Biratnagar', 'demo-biratnagar', 'DBI', '#a16207', 'Demo team for local evaluation.', 'Biratnagar')
on conflict (id) do nothing;

insert into public.players (id, full_name, slug, playing_role, batting_style, bowling_style) values
  ('10000000-0000-4000-8000-000000000101', 'Demo Batter One', 'demo-batter-one', 'batter', 'Right-hand bat', 'None'),
  ('10000000-0000-4000-8000-000000000102', 'Demo Batter Two', 'demo-batter-two', 'batter', 'Left-hand bat', 'None'),
  ('10000000-0000-4000-8000-000000000103', 'Demo Allrounder One', 'demo-allrounder-one', 'all_rounder', 'Right-hand bat', 'Right-arm medium'),
  ('10000000-0000-4000-8000-000000000104', 'Demo Keeper One', 'demo-keeper-one', 'wicketkeeper', 'Right-hand bat', 'None'),
  ('10000000-0000-4000-8000-000000000105', 'Demo Batter Three', 'demo-batter-three', 'batter', 'Right-hand bat', 'None'),
  ('10000000-0000-4000-8000-000000000106', 'Demo Bowler One', 'demo-bowler-one', 'bowler', 'Left-hand bat', 'Left-arm medium'),
  ('10000000-0000-4000-8000-000000000107', 'Demo Allrounder Two', 'demo-allrounder-two', 'all_rounder', 'Right-hand bat', 'Right-arm offbreak'),
  ('10000000-0000-4000-8000-000000000108', 'Demo Bowler Two', 'demo-bowler-two', 'bowler', 'Right-hand bat', 'Right-arm fast'),
  ('10000000-0000-4000-8000-000000000109', 'Demo Batter Four', 'demo-batter-four', 'batter', 'Right-hand bat', 'None'),
  ('10000000-0000-4000-8000-00000000010a', 'Demo Bowler Three', 'demo-bowler-three', 'bowler', 'Left-hand bat', 'Left-arm orthodox'),
  ('10000000-0000-4000-8000-00000000010b', 'Demo Allrounder Three', 'demo-allrounder-three', 'all_rounder', 'Right-hand bat', 'Right-arm legbreak'),
  ('10000000-0000-4000-8000-00000000010c', 'Demo Keeper Two', 'demo-keeper-two', 'wicketkeeper', 'Left-hand bat', 'None'),
  ('10000000-0000-4000-8000-00000000010d', 'Demo Batter Five', 'demo-batter-five', 'batter', 'Right-hand bat', 'None'),
  ('10000000-0000-4000-8000-00000000010e', 'Demo Bowler Four', 'demo-bowler-four', 'bowler', 'Right-hand bat', 'Right-arm medium'),
  ('10000000-0000-4000-8000-00000000010f', 'Demo Allrounder Four', 'demo-allrounder-four', 'all_rounder', 'Left-hand bat', 'Left-arm wrist spin'),
  ('10000000-0000-4000-8000-000000000110', 'Demo Bowler Five', 'demo-bowler-five', 'bowler', 'Right-hand bat', 'Right-arm offbreak')
on conflict (id) do nothing;

insert into public.team_squads (season_id, team_id, player_id) values
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000101'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000102'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000103'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000104'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000105'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000106'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000107'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000108'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000109'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-00000000010a'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-00000000010b'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-00000000010c'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-00000000010d'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-00000000010e'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-00000000010f'),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000110')
on conflict (season_id, player_id) do nothing;

insert into public.matches (id, season_id, tournament_id, match_number, slug, team_a_id, team_b_id, venue_id, scheduled_at, status, data_source) values
  ('10000000-0000-4000-8000-000000000201', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 1, 'demo-match-1-dka-vs-dpo', '10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000010', now() + interval '1 day', 'scheduled', 'manual'),
  ('10000000-0000-4000-8000-000000000202', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 2, 'demo-match-2-dch-vs-dbi', '10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000011', now() + interval '2 days', 'scheduled', 'manual'),
  ('10000000-0000-4000-8000-000000000203', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 3, 'demo-match-3-dka-vs-dch', '10000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000010', now(), 'live', 'manual')
on conflict (id) do nothing;

insert into public.news_categories (id, name, slug, description)
values ('10000000-0000-4000-8000-000000000301', 'Match reports', 'match-reports', 'Reports and analysis from NPL fixtures.')
on conflict (id) do nothing;

insert into public.news_articles (id, title, slug, excerpt, body, category_id, author_name, tags, status, published_at, featured)
values (
  '10000000-0000-4000-8000-000000000302',
  'Demo article: how the scoring console works',
  'demo-article-how-the-scoring-console-works',
  'A demonstration article explaining the manual scoring workflow. Replace this content with verified editorial.',
  '## Manual scoring\n\nThis demo article exists so the editorial layout can be reviewed end to end. Replace it with verified reporting before launch.\n\nThe scoring console records every delivery as an immutable event. Scorecards, standings and leaderboards are derived from those events.',
  '10000000-0000-4000-8000-000000000301',
  'NPL Cricket Hub Editorial',
  array['demo', 'scoring'],
  'published',
  now(),
  true
)
on conflict (id) do nothing;

insert into public.polls (id, question, slug, description, status, closes_at)
values ('10000000-0000-4000-8000-000000000401', 'Who will win the demo fixture?', 'demo-fixture-winner', 'A demo poll. Replace with a verified fan poll.', 'open', now() + interval '3 days')
on conflict (id) do nothing;

insert into public.poll_options (id, poll_id, label, team_id) values
  ('10000000-0000-4000-8000-000000000411', '10000000-0000-4000-8000-000000000401', 'Demo Kathmandu', '10000000-0000-4000-8000-000000000021'),
  ('10000000-0000-4000-8000-000000000412', '10000000-0000-4000-8000-000000000401', 'Demo Chitwan', '10000000-0000-4000-8000-000000000023')
on conflict (id) do nothing;
