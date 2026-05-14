import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PicksClient from './PicksClient'

export default async function PicksPage({ searchParams }: { searchParams: Promise<{ entryId: string }> }) {
  const { entryId } = await searchParams
  if (!entryId) redirect('/')

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: entry } = await supabase.from('entries').select('*, profiles(username)').eq('id', entryId).single()
  if (!entry) redirect('/')

  const isOwner = user ? entry.user_id === user.id : false

  // Fetch settings
  const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single()
  
  // Fetch all teams with group info
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, flag_url, tla, group_letter')
    .not('group_letter', 'is', null)
    .order('name')

  // Fetch existing group picks
  const { data: groupPicks } = await supabase
    .from('group_picks')
    .select('group_letter, first_place_team_id, second_place_team_id')
    .eq('entry_id', entryId)

  // Fetch existing 3rd-place advancing picks
  const { data: thirdPlacePicks } = await supabase
    .from('third_place_picks')
    .select('team_id, order_rank')
    .eq('entry_id', entryId)
    .order('order_rank', { ascending: true })

  // Fetch existing bracket picks
  const { data: bracketPicks } = await supabase
    .from('bracket_picks')
    .select('round, match_slot, picked_team_id')
    .eq('entry_id', entryId)

  // Build group picks map
  const groupPicksMap: Record<string, { first: string | null; second: string | null }> = {}
  for (const gp of (groupPicks || [])) {
    groupPicksMap[gp.group_letter] = {
      first: gp.first_place_team_id,
      second: gp.second_place_team_id,
    }
  }

  // Build 3rd-place advancing list (team IDs)
  const thirdPlaceTeams: (string | null)[] = Array(8).fill(null)
  for (const tp of (thirdPlacePicks || [])) {
    if (tp.order_rank >= 1 && tp.order_rank <= 8) {
      thirdPlaceTeams[tp.order_rank - 1] = tp.team_id
    }
  }

  // Build bracket picks map
  const bracketPicksMap: Record<string, string> = {}
  for (const bp of (bracketPicks || [])) {
    if (bp.picked_team_id) {
      bracketPicksMap[`${bp.round}-${bp.match_slot}`] = bp.picked_team_id
    }
  }

  // Build teams map
  const teamsMap: Record<string, any> = {}
  for (const t of (teams || [])) {
    teamsMap[t.id] = t
  }

  // Group teams by group_letter
  const teamsByGroup: Record<string, any[]> = {}
  for (const t of (teams || [])) {
    if (!teamsByGroup[t.group_letter]) teamsByGroup[t.group_letter] = []
    teamsByGroup[t.group_letter].push(t)
  }

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

      <main className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-20 pb-20 space-y-10">
        
        {/* State Banner */}
        <div className="flex justify-between items-center bg-surface border border-border-subtle rounded-xl p-4 shadow-sm">
           <Link href="/" className="text-sm font-bold text-brand-green hover:underline">
             &larr; Back
           </Link>
           <div className="flex space-x-2">
             {settings?.phase_1_locked && <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-border-subtle">GROUPS LOCKED</span>}
             {settings?.phase_2_locked && <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-border-subtle">BRACKET LOCKED</span>}
           </div>
        </div>

        <PicksClient 
          entryId={entryId}
          isOwner={isOwner}
          isPhase1Locked={!isOwner || !!settings?.phase_1_locked}
          isPhase2Locked={!isOwner || !!settings?.phase_2_locked}
          teamsByGroup={teamsByGroup}
          teamsMap={teamsMap}
          initialGroupPicks={groupPicksMap}
          initialThirdPlaceTeams={thirdPlaceTeams}
          initialBracketPicks={bracketPicksMap}
        />
      </main>
    </div>
  )
}
