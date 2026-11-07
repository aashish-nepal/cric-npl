-- NPL Cricket Hub — scoring and fan RPCs
-- All writes are transactional. Innings cache columns are updated in the same
-- transaction as the immutable ball event.

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.record_ball_event(
  p_match_id uuid,
  p_batter_id uuid,
  p_bowler_id uuid,
  p_runs_batter integer,
  p_extra_type text default null,
  p_runs_extras integer default 0,
  p_wicket_type text default null,
  p_dismissed_player_id uuid default null,
  p_fielder_id uuid default null,
  p_commentary text default null,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_season public.seasons%rowtype;
  v_innings public.innings%rowtype;
  v_event public.ball_events%rowtype;
  v_first public.innings%rowtype;
  v_batting_team uuid;
  v_bowling_team uuid;
  v_balls_per_innings integer;
  v_legal boolean;
  v_total integer;
  v_over integer;
  v_ball integer;
  v_target integer;
  v_wickets_in_hand integer;
  v_margin integer;
  v_batting_name text;
  v_bowling_name text;
  v_summary text;
begin
  if auth.uid() is not null and public.current_user_role() not in ('scorer', 'admin', 'super_admin') then
    raise exception 'You do not have permission to score matches';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then raise exception 'Match not found'; end if;
  if v_match.status <> 'live' then raise exception 'Scoring is only available for live matches'; end if;

  select * into v_season from public.seasons where id = v_match.season_id;
  v_balls_per_innings := coalesce((v_season.settings ->> 'ballsPerInnings')::integer, 120);

  if p_runs_batter is null or p_runs_batter < 0 or p_runs_batter > 6 then
    raise exception 'Bat runs must be between 0 and 6';
  end if;
  if p_runs_extras is null or p_runs_extras < 0 or p_runs_extras > 7 then
    raise exception 'Extra runs must be between 0 and 7';
  end if;
  if p_extra_type is not null and p_extra_type not in ('wide', 'no_ball', 'bye', 'leg_bye', 'penalty') then
    raise exception 'Invalid extra type';
  end if;
  if p_wicket_type is not null and p_wicket_type not in ('bowled', 'caught', 'caught_and_bowled', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired_hurt', 'obstructing_field', 'timed_out') then
    raise exception 'Invalid wicket type';
  end if;
  if p_wicket_type is not null and p_runs_batter > 0 then
    raise exception 'A wicket delivery cannot also score runs off the bat';
  end if;

  select * into v_innings
  from public.innings
  where match_id = p_match_id and closed = false
  order by innings_number desc
  limit 1
  for update;

  if not found then
    if exists (select 1 from public.innings where match_id = p_match_id) then
      raise exception 'No open innings. Start an innings before scoring.';
    end if;

    v_batting_team := case
      when v_match.toss_decision = 'bowl' then
        case when v_match.toss_winner_id = v_match.team_a_id then v_match.team_b_id else v_match.team_a_id end
      else coalesce(v_match.toss_winner_id, v_match.team_a_id)
    end;
    v_bowling_team := case when v_batting_team = v_match.team_a_id then v_match.team_b_id else v_match.team_a_id end;

    insert into public.innings (match_id, innings_number, batting_team_id, bowling_team_id)
    values (p_match_id, 1, v_batting_team, v_bowling_team)
    returning * into v_innings;
  end if;

  if v_innings.closed then raise exception 'No open innings. Start an innings before scoring.'; end if;

  if not exists (
    select 1 from public.team_squads
    where season_id = v_match.season_id and team_id = v_innings.batting_team_id and player_id = p_batter_id
  ) then
    raise exception 'Batter is not in the selected team''s squad';
  end if;
  if not exists (
    select 1 from public.team_squads
    where season_id = v_match.season_id and team_id = v_innings.bowling_team_id and player_id = p_bowler_id
  ) then
    raise exception 'Bowler is not in the selected team''s squad';
  end if;

  v_legal := p_extra_type is null or p_extra_type not in ('wide', 'no_ball');
  v_total := p_runs_batter + p_runs_extras;
  v_over := (v_innings.legal_balls / 6) + 1;
  v_ball := (v_innings.legal_balls % 6) + 1;

  insert into public.ball_events (
    innings_id, over_number, ball_number, legal_ball, batter_id, bowler_id,
    runs_batter, runs_extras, extra_type, wicket_type, dismissed_player_id,
    fielder_id, commentary
  ) values (
    v_innings.id, v_over, v_ball, v_legal, p_batter_id, p_bowler_id,
    p_runs_batter, p_runs_extras, p_extra_type::extra_type, p_wicket_type::wicket_type,
    case when p_wicket_type is not null then coalesce(p_dismissed_player_id, p_batter_id) else null end,
    p_fielder_id,
    coalesce(
      nullif(trim(p_commentary), ''),
      format('%s.%s — %s run(s)%s', v_over, v_ball, v_total,
        case when p_wicket_type is not null then ', ' || replace(p_wicket_type, '_', ' ') else '' end)
    )
  )
  returning * into v_event;

  update public.innings
  set total_runs = total_runs + v_total,
      wickets = wickets + case when p_wicket_type is not null and p_wicket_type <> 'retired_hurt' then 1 else 0 end,
      legal_balls = legal_balls + case when v_legal then 1 else 0 end,
      extras = extras + case when p_extra_type is not null then p_runs_extras else 0 end
  where id = v_innings.id
  returning * into v_innings;

  if v_innings.legal_balls >= v_balls_per_innings or v_innings.wickets >= 10 then
    v_innings.closed := true;
    update public.innings set closed = true where id = v_innings.id;
  end if;

  if v_innings.innings_number = 2 then
    select * into v_first from public.innings where match_id = p_match_id and innings_number = 1;
    if found then
      v_target := v_first.total_runs + 1;
      select name into v_batting_name from public.teams where id = v_innings.batting_team_id;
      select name into v_bowling_name from public.teams where id = v_innings.bowling_team_id;

      if v_innings.total_runs >= v_target then
        v_wickets_in_hand := 10 - v_innings.wickets;
        v_summary := format('%s won by %s wicket(s)', v_batting_name, v_wickets_in_hand);
        update public.innings set closed = true where id = v_innings.id;
        v_innings.closed := true;
        update public.matches
        set status = 'completed', winner_id = v_innings.batting_team_id, result_summary = v_summary
        where id = p_match_id;
      elsif v_innings.closed then
        if v_innings.total_runs = v_first.total_runs then
          v_summary := 'Match tied';
          update public.matches set status = 'completed', winner_id = null, result_summary = v_summary where id = p_match_id;
        else
          v_margin := v_first.total_runs - v_innings.total_runs;
          v_summary := format('%s won by %s run(s)', v_bowling_name, v_margin);
          update public.matches
          set status = 'completed', winner_id = v_first.batting_team_id, result_summary = v_summary
          where id = p_match_id;
        end if;
      end if;
    end if;
  end if;

  return jsonb_build_object('innings', to_jsonb(v_innings), 'event', to_jsonb(v_event));
end;
$$;

create or replace function public.undo_last_ball(
  p_match_id uuid,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.ball_events%rowtype;
  v_innings public.innings%rowtype;
begin
  if auth.uid() is not null and public.current_user_role() not in ('scorer', 'admin', 'super_admin') then
    raise exception 'You do not have permission to score matches';
  end if;

  select be.* into v_event
  from public.ball_events be
  join public.innings i on i.id = be.innings_id
  where i.match_id = p_match_id
  order by be.created_at desc, be.id desc
  limit 1;

  if not found then raise exception 'No ball events to undo'; end if;

  delete from public.ball_events where id = v_event.id;

  update public.innings
  set total_runs = coalesce((select sum(total_runs) from public.ball_events where innings_id = v_event.innings_id), 0),
      wickets = coalesce((select count(*) from public.ball_events where innings_id = v_event.innings_id and wicket_type is not null and wicket_type <> 'retired_hurt'), 0),
      legal_balls = coalesce((select count(*) from public.ball_events where innings_id = v_event.innings_id and legal_ball), 0),
      extras = coalesce((select sum(runs_extras) from public.ball_events where innings_id = v_event.innings_id and extra_type is not null), 0),
      closed = false
  where id = v_event.innings_id
  returning * into v_innings;

  update public.matches
  set status = 'live', winner_id = null, result_summary = null
  where id = p_match_id and status = 'completed';

  return to_jsonb(v_innings);
end;
$$;

create or replace function public.cast_poll_vote(
  p_poll_id uuid,
  p_option_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_poll public.polls%rowtype;
begin
  if auth.uid() is not null and p_user_id <> auth.uid() then
    raise exception 'You can only vote as yourself';
  end if;

  select * into v_poll from public.polls where id = p_poll_id;
  if not found then raise exception 'Poll not found'; end if;
  if v_poll.status <> 'open' or v_poll.closes_at < now() then
    raise exception 'This poll is closed';
  end if;

  if not exists (select 1 from public.poll_options where id = p_option_id and poll_id = p_poll_id) then
    raise exception 'Option not found';
  end if;
  if exists (select 1 from public.fan_votes where poll_id = p_poll_id and user_id = p_user_id) then
    raise exception 'You have already voted in this poll';
  end if;

  insert into public.fan_votes (poll_id, option_id, user_id) values (p_poll_id, p_option_id, p_user_id);
  update public.poll_options set vote_count = vote_count + 1 where id = p_option_id;
end;
$$;

revoke all on function public.record_ball_event(uuid, uuid, uuid, integer, text, integer, text, uuid, uuid, text, uuid) from public;
revoke all on function public.undo_last_ball(uuid, uuid) from public;
revoke all on function public.cast_poll_vote(uuid, uuid, uuid) from public;

grant execute on function public.record_ball_event(uuid, uuid, uuid, integer, text, integer, text, uuid, uuid, text, uuid) to authenticated;
grant execute on function public.undo_last_ball(uuid, uuid) to authenticated;
grant execute on function public.cast_poll_vote(uuid, uuid, uuid) to authenticated;
