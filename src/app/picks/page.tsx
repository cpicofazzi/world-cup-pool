import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PickerCard from './PickerCard'

export default async function PicksPage({ searchParams }: { searchParams: Promise<{ entryId: string }> }) {
  const { entryId } = await searchParams
  if (!entryId) redirect('/')

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: entry } = await supabase.from('entries').select('*, profiles(username)').eq('id', entryId).single()
  if (!entry) redirect('/')

  // Is this the owner viewing their own bracket?
  const isOwner = user ? entry.user_id === user.id : false;

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
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">BRACKET ENTRY</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">{entry.name}</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
            {entry.profiles?.username || 'Unknown User'} {isOwner && '(You)'}
          </p>
          {!isOwner && (
            <div className="mt-4 inline-block bg-slate-800 text-slate-300 px-3 py-1 rounded text-xs font-mono">
               Viewing Mode (Read-Only)
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20 pb-20 space-y-16">
        
        {/* State Banner */}
        <div className="flex justify-between items-center bg-surface border border-border-subtle rounded-xl p-4 shadow-sm">
           <Link href="/leaderboard" className="text-sm font-bold text-brand-green hover:underline">
             &larr; Back
           </Link>
           <div className="flex space-x-2">
             {settings?.phase_1_locked && <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-border-subtle">PHASE 1 LOCKED</span>}
             {settings?.phase_2_locked && <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-border-subtle">PHASE 2 LOCKED</span>}
           </div>
        </div>

        {/* Phase 1: Group Stages */}
        <section>
          <div className="mb-6 border-b border-border-subtle pb-4">
            <h2 className="text-3xl font-serif font-bold text-brand-navy">PHASE 1: GROUP WARS</h2>
            <p className="text-slate-500 mt-1">Select the exact outcome of every group match. Picks save automatically.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {sortedGroups.map(groupLetter => (
              <div key={groupLetter} className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-border-subtle">
                  <h3 className="text-xl font-bold text-brand-navy font-serif">GROUP {groupLetter}</h3>
                </div>
                <div className="p-4 space-y-4">
                  {groupsObj[groupLetter].map((match: any) => (
                    <PickerCard 
                      key={match.id} 
                      match={match} 
                      entryId={entryId}
                      initialPick={pickMap.get(match.id)}
                      isLocked={!isOwner || settings?.phase_1_locked}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phase 2: Knockouts */}
        <section>
           <div className="mb-8 border-b border-border-subtle pb-4">
            <h2 className="text-3xl font-serif font-bold text-brand-navy">PHASE 2: THE GAUNTLET</h2>
            <p className="text-slate-500 mt-1">Navigate the brutal knockout bracket. Teams are populated exactly as you predict them from Phase 1.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-8 snap-x">
             {groupedKnockouts.map((round, idx) => (
               <div key={round.phase} className="flex-1 min-w-[320px] snap-center">
                 <div className="text-center mb-4">
                   <div className="inline-block bg-brand-navy text-white font-bold px-4 py-1.5 rounded-full text-sm shadow-sm">
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
                        isLocked={!isOwner || settings?.phase_2_locked}
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
