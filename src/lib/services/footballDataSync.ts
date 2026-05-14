import { createClient } from '@/utils/supabase/server';

const API_BASE = 'https://api.football-data.org/v4';
const COMPETITION = 'WC';
const SEASON = '2026';

type PhaseEnum = 'group' | 'R32' | 'R16' | 'QF' | 'SF' | 'F';

function mapStageToPhase(apiStage: string): PhaseEnum | null {
  switch (apiStage) {
    case 'GROUP_STAGE': return 'group';
    case 'LAST_32': return 'R32';
    case 'LAST_16': return 'R16';
    case 'QUARTER_FINALS': return 'QF';
    case 'SEMI_FINALS': return 'SF';
    case 'FINAL': return 'F';
    default: return null;
  }
}

export async function syncTournamentData() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing FOOTBALL_DATA_API_KEY environment variable');
  }

  const headers = { 'X-Auth-Token': apiKey };
  const supabase = await createClient();
  const summary: string[] = [];

  console.log('Starting Football Data Sync...');

  // ─── 1. Fetch Teams ───────────────────────────────────────────────
  console.log('Fetching Teams...');
  const teamsRes = await fetch(`${API_BASE}/competitions/${COMPETITION}/teams?season=${SEASON}`, { headers });
  if (!teamsRes.ok) throw new Error(`Failed to fetch teams: ${teamsRes.status} ${teamsRes.statusText}`);
  const teamsData = await teamsRes.json();

  const PRE_TOURNAMENT_GROUPS: Record<string, string> = {
    'MEX': 'A', 'KOR': 'A', 'RSA': 'A', 'CZE': 'A',
    'CAN': 'B', 'SUI': 'B', 'QAT': 'B', 'BIH': 'B',
    'BRA': 'C', 'MAR': 'C', 'SCO': 'C', 'HAI': 'C',
    'USA': 'D', 'PAR': 'D', 'AUS': 'D', 'TUR': 'D',
    'GER': 'E', 'ECU': 'E', 'CIV': 'E', 'CUR': 'E',
    'NED': 'F', 'JPN': 'F', 'TUN': 'F', 'SWE': 'F',
    'BEL': 'G', 'IRN': 'G', 'EGY': 'G', 'NZL': 'G',
    'ESP': 'H', 'URU': 'H', 'KSA': 'H', 'CPV': 'H',
    'FRA': 'I', 'SEN': 'I', 'NOR': 'I', 'IRQ': 'I',
    'ARG': 'J', 'ALG': 'J', 'AUT': 'J', 'JOR': 'J',
    'POR': 'K', 'COL': 'K', 'UZB': 'K', 'COD': 'K',
    'ENG': 'L', 'CRO': 'L', 'GHA': 'L', 'PAN': 'L'
  };

  const teamsToUpsert = teamsData.teams.map((t: any) => ({
    api_id: t.id,
    name: t.name,
    tla: t.tla,
    flag_url: t.crest,
    group_letter: PRE_TOURNAMENT_GROUPS[t.tla] || null
  }));

  if (teamsToUpsert.length > 0) {
    const { error: teamsErr } = await supabase
      .from('teams')
      .upsert(teamsToUpsert, { onConflict: 'api_id', ignoreDuplicates: false });
    if (teamsErr) throw new Error(`Teams Upsert Error: ${teamsErr.message}`);
  }
  summary.push(`✅ Teams: ${teamsToUpsert.length} synced`);

  // ─── 2. Fetch Standings (Optional — may not exist pre-tournament) ─
  console.log('Fetching Standings...');
  try {
    const standingsRes = await fetch(`${API_BASE}/competitions/${COMPETITION}/standings?season=${SEASON}`, { headers });
    if (standingsRes.ok) {
      const standingsData = await standingsRes.json();
      let groupsUpdated = 0;

      for (const group of (standingsData.standings || [])) {
        const groupLetter = group.group?.replace('GROUP ', '');
        for (const tableEntry of (group.table || [])) {
          const teamId = tableEntry.team.id;
          if (groupLetter && teamId) {
            const { error: updateErr } = await supabase
              .from('teams')
              .update({ group_letter: groupLetter })
              .eq('api_id', teamId);
            if (!updateErr) groupsUpdated++;
            else console.error(`Error updating group for team API ID ${teamId}: ${updateErr.message}`);
          }
        }
      }
      summary.push(`✅ Standings: ${groupsUpdated} team groups assigned`);
    } else {
      console.warn(`Standings not available yet (${standingsRes.status}). Skipping group assignments.`);
      summary.push(`⚠️ Standings: Not available yet (tournament hasn't started). Skipped.`);
    }
  } catch (standingsError: any) {
    console.warn('Standings fetch error (non-fatal):', standingsError.message);
    summary.push(`⚠️ Standings: Fetch failed (non-fatal). Skipped.`);
  }

  // ─── 3. Build team API ID → UUID map ──────────────────────────────
  const { data: dbTeams, error: dbTeamsErr } = await supabase.from('teams').select('id, api_id').not('api_id', 'is', null);
  if (dbTeamsErr) throw new Error(`Failed to map teams: ${dbTeamsErr.message}`);
  const teamApiToUuid = new Map<number, string>();
  dbTeams?.forEach(t => {
    if (t.api_id) teamApiToUuid.set(t.api_id, t.id);
  });

  // ─── 4. Fetch Matches (Optional — may not exist pre-tournament) ───
  console.log('Fetching Matches...');
  try {
    const matchesRes = await fetch(`${API_BASE}/competitions/${COMPETITION}/matches?season=${SEASON}`, { headers });
    if (matchesRes.ok) {
      const matchesData = await matchesRes.json();

      const matchesToUpsert = [];
      for (const match of (matchesData.matches || [])) {
        const phase = mapStageToPhase(match.stage);
        if (!phase) continue;

        const team_a_id = match.homeTeam?.id ? teamApiToUuid.get(match.homeTeam.id) : null;
        const team_b_id = match.awayTeam?.id ? teamApiToUuid.get(match.awayTeam.id) : null;

        let result = null;
        let scoreA = null;
        let scoreB = null;

        if (match.score?.fullTime?.home !== null && match.score?.fullTime?.away !== null) {
          scoreA = match.score.fullTime.home;
          scoreB = match.score.fullTime.away;
          if (scoreA > scoreB) result = 'team_a_win';
          else if (scoreB > scoreA) result = 'team_b_win';
          else result = 'draw';
        }

        matchesToUpsert.push({
          api_id: match.id,
          phase,
          kickoff_time: match.utcDate,
          venue: match.venue || null,
          team_a_id,
          team_b_id,
          team_a_score: scoreA,
          team_b_score: scoreB,
          result: result,
          description: `Matchday ${match.matchday || 'TBD'}`
        });
      }

      if (matchesToUpsert.length > 0) {
        const { error: matchErr } = await supabase
          .from('matches')
          .upsert(matchesToUpsert, { onConflict: 'api_id', ignoreDuplicates: false });
        if (matchErr) throw new Error(`Matches Upsert Error: ${matchErr.message}`);
      }
      summary.push(`✅ Matches: ${matchesToUpsert.length} synced`);
    } else {
      console.warn(`Matches not available yet (${matchesRes.status}). Skipping.`);
      summary.push(`⚠️ Matches: Not available yet (schedule not published). Skipped.`);
    }
  } catch (matchesError: any) {
    console.warn('Matches fetch error (non-fatal):', matchesError.message);
    summary.push(`⚠️ Matches: Fetch failed (non-fatal). Skipped.`);
  }

  console.log('Football Data Sync Complete.');
  console.log(summary.join('\n'));
  return { success: true, summary };
}
