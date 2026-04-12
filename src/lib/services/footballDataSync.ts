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
    // Football Data may return 'THIRD_PLACE' which we don't strictly support right now.
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

  console.log('Starting Football Data Sync...');

  // 1. Fetch Teams
  console.log('Fetching Teams...');
  const teamsRes = await fetch(`${API_BASE}/competitions/${COMPETITION}/teams?season=${SEASON}`, { headers });
  if (!teamsRes.ok) throw new Error(`Failed to fetch teams: ${teamsRes.statusText}`);
  const teamsData = await teamsRes.json();

  const teamsToUpsert = teamsData.teams.map((t: any) => ({
    api_id: t.id,
    name: t.name,
    tla: t.tla,
    flag_url: t.crest
  }));

  if (teamsToUpsert.length > 0) {
    const { error: teamsErr } = await supabase
      .from('teams')
      .upsert(teamsToUpsert, { onConflict: 'api_id', ignoreDuplicates: false });
    if (teamsErr) throw new Error(`Teams Upsert Error: ${teamsErr.message}`);
  }

  // 2. Fetch Standings (to assign group letters)
  console.log('Fetching Standings...');
  const standingsRes = await fetch(`${API_BASE}/competitions/${COMPETITION}/standings?season=${SEASON}`, { headers });
  if (!standingsRes.ok) throw new Error(`Failed to fetch standings: ${standingsRes.statusText}`);
  const standingsData = await standingsRes.json();

  for (const group of standingsData.standings) {
    // API usually formats group as "GROUP A"
    const groupLetter = group.group?.replace('GROUP ', '');
    for (const tableEntry of group.table) {
      const teamId = tableEntry.team.id;
      if (groupLetter && teamId) {
        const { error: updateErr } = await supabase
          .from('teams')
          .update({ group_letter: groupLetter })
          .eq('api_id', teamId);
        if (updateErr) console.error(`Error updating group for team API ID ${teamId}: ${updateErr.message}`);
      }
    }
  }

  // Reload teams locally so we can map API ID -> internal UUID for matches
  const { data: dbTeams, error: dbTeamsErr } = await supabase.from('teams').select('id, api_id').not('api_id', 'is', null);
  if (dbTeamsErr) throw new Error(`Failed to map teams: ${dbTeamsErr.message}`);
  const teamApiToUuid = new Map<number, string>();
  dbTeams?.forEach(t => {
    if (t.api_id) teamApiToUuid.set(t.api_id, t.id);
  });

  // 3. Fetch Matches
  console.log('Fetching Matches...');
  const matchesRes = await fetch(`${API_BASE}/competitions/${COMPETITION}/matches?season=${SEASON}`, { headers });
  if (!matchesRes.ok) throw new Error(`Failed to fetch matches: ${matchesRes.statusText}`);
  const matchesData = await matchesRes.json();

  const matchesToUpsert = [];
  for (const match of matchesData.matches) {
    const phase = mapStageToPhase(match.stage);
    if (!phase) continue; // Skip unsupported stages

    const team_a_id = match.homeTeam?.id ? teamApiToUuid.get(match.homeTeam.id) : null;
    const team_b_id = match.awayTeam?.id ? teamApiToUuid.get(match.awayTeam.id) : null;

    let result = null;
    let scoreA = null;
    let scoreB = null;

    // Based on API format: score.fullTime.home, score.fullTime.away
    if (match.score?.fullTime?.home !== null && match.score?.fullTime?.away !== null) {
      scoreA = match.score.fullTime.home;
      scoreB = match.score.fullTime.away;
      
      // Optionally map result enum if we want, but DB trigger handles result inference usually
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

  console.log('Football Data Sync Complete.');
  return { success: true };
}
