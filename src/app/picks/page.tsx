import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PickerCard from './PickerCard'

export default async function PicksPage({ searchParams }: { searchParams: Promise<{ entryId: string }> }) {
  const { entryId } = await searchParams
  if (!entryId) redirect('/')

  const supabase = await createClient()

  // 1. Auth & Ownership Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
  
  const { data: entry } = await supabase.from('entries').select('*').eq('id', entryId).single()
  if (!entry || entry.user_id !== user.id) {
    redirect('/')
  }

  // 2. Fetch Data
  const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single()
  
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, phase, kickoff_time, result, description,
      team_a:team_a_id (id, name, flag_url, group_letter),
      team_b:team_b_id (id, name, flag_url, group_letter)
    `)
    .order('kickoff_time', { ascending: true })

  const { data: rawPicks } = await supabase
    .from('picks')
    .select('match_id, predicted_result')
    .eq('entry_id', entryId)

  const pickMap = new Map((rawPicks || []).map((p: any) => [p.match_id, p.predicted_result]))

  // 3. Organization
  const groupMatches = matches?.filter(m => m.phase === 'group') || []
  const knockoutMatches = matches?.filter(m => m.phase !== 'group') || []

  const groupsObj = groupMatches.reduce((acc: any, match: any) => {
    // Both teams in a group match should be from the same group
    const gl = match.team_a?.group_letter || '?'
    if (!acc[gl]) acc[gl] = []
    acc[gl].push(match)
    return acc
  }, {})

  const sortedGroups = Object.keys(groupsObj).sort()

  const phaseOrder = ['R32', 'R16', 'QF', 'SF', 'F']
  const groupedKnockouts = phaseOrder.map(phase => ({
    phase,
    matches: knockoutMatches.filter(m => m.phase === phase)
  })).filter(g => g.matches.length > 0)

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            &larr; Hub
          </Link>
          <div className="text-sm font-medium space-x-4 flex items-center">
             <span className="text-slate-400">Bracket: <strong className="text-white">{entry.name}</strong></span>
             {settings?.phase_1_locked && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">PHASE 1 LOCKED</span>}
             {settings?.phase_2_locked && <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">PHASE 2 LOCKED</span>}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-16">
        {/* Phase 1: Group Stages */}
        <section>
          <div className="mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-3xl font-black">PHASE 1: GROUP WARS</h2>
            <p className="text-slate-400 mt-1">Select the exact outcome of every group match. Picks save automatically.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {sortedGroups.map(groupLetter => (
              <div key={groupLetter} className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-sm">
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center shadow-sm">
                  <h3 className="text-xl font-bold text-white">GROUP {groupLetter}</h3>
                </div>
                <div className="p-4 space-y-4">
                  {groupsObj[groupLetter].map((match: any) => (
                    <PickerCard 
                      key={match.id} 
                      match={match} 
                      entryId={entryId}
                      initialPick={pickMap.get(match.id)}
                      isLocked={settings?.phase_1_locked}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase 2: Knockouts */}
        <section>
           <div className="mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-3xl font-black text-indigo-400">PHASE 2: THE GAUNTLET</h2>
            <p className="text-slate-400 mt-1">Navigate the brutal knockout bracket. Teams are populated exactly as you predict them from Phase 1.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-8 snap-x">
             {groupedKnockouts.map((round, idx) => (
               <div key={round.phase} className="flex-1 min-w-[320px] snap-center">
                 <div className="text-center mb-4">
                   <div className="inline-block bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 font-bold px-4 py-1.5 rounded-full text-sm">
                     {round.phase === 'R32' ? 'Round of 32' : 
                      round.phase === 'R16' ? 'Round of 16' : 
                      round.phase === 'QF' ? 'Quarter-Finals' : 
                      round.phase === 'SF' ? 'Semi-Finals' : 'World Cup Final'}
                   </div>
                 </div>
                 
                 <div className="space-y-4 flex flex-col justify-around h-full">
                    {round.matches.map((match: any) => (
                      <PickerCard 
                        key={match.id} 
                        match={match} 
                        entryId={entryId}
                        initialPick={pickMap.get(match.id)}
                        isLocked={settings?.phase_2_locked}
                      />
                    ))}
                 </div>
               </div>
             ))}
          </div>
        </section>
      </main>
    </div>
  )
}
