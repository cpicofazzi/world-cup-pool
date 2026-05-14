import { createClient } from '@/utils/supabase/server'
import { ScoresTabs } from './ScoresTabs'

export default async function ScoresPage() {
  const supabase = await createClient()

  // Fetch all matches with team names
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select(`
      id,
      phase,
      kickoff_time,
      result,
      team_a_score,
      team_b_score,
      team_a:team_a_id ( name, flag_url ),
      team_b:team_b_id ( name, flag_url )
    `)
    .order('kickoff_time', { ascending: true })

  // Fetch all teams for group tables
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, flag_url, group_letter, tla')
    .order('name', { ascending: true })

  // Fetch group stage matches with raw IDs for computing standings
  const { data: groupMatches } = await supabase
    .from('matches')
    .select('id, team_a_id, team_b_id, team_a_score, team_b_score, result')
    .eq('phase', 'group')

  if (matchError) {
    return <div className="p-8 text-red-500">Failed to load matches: {matchError.message}</div>
  }

  return (
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">Scores</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
            Matches &amp; Group Standings
          </p>
        </div>
      </div>

      <ScoresTabs 
        matches={matches || []} 
        teams={teams || []} 
        groupMatches={groupMatches || []} 
      />
    </div>
  )
}
