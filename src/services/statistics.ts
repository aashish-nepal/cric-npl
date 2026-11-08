import { getStatisticsData, type StatisticsData } from "@/services/cricket";
import type { Team } from "@/types/cricket";

export interface StatisticsBoard extends StatisticsData {
  selectedTeam: Team | null;
}

/**
 * Shared loader for the statistics sub-routes. Keeps season + team filtering in one
 * place so every leaderboard applies exactly the same rules.
 */
export async function loadStatisticsBoard(seasonSlug?: string, teamId?: string): Promise<StatisticsBoard> {
  const data = await getStatisticsData(seasonSlug);
  const selectedTeam = teamId ? (data.teamById.get(teamId) ?? null) : null;
  if (!selectedTeam) {
    return { ...data, selectedTeam: null };
  }
  return {
    ...data,
    selectedTeam,
    batting: data.batting.filter((row) => row.teamId === selectedTeam.id),
    bowling: data.bowling.filter((row) => row.teamId === selectedTeam.id),
    teams: data.teams.filter((row) => row.teamId === selectedTeam.id),
    standings: data.standings.filter((row) => row.teamId === selectedTeam.id),
  };
}
