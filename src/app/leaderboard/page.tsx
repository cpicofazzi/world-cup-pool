import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ poolId: string }> }) {
  const { poolId } = await searchParams
  
  // If no poolId, perhaps show a selector or fallback. For now we redirect.
  if (!poolId) redirect('/')

  const supabase = await createClient()

  // 1. Auth & Pool verification
  const { data: { user } } = await supabase.auth.getUser()

  // Make sure this pool exists and grab its name
  const { data: pool } = await supabase.from('pools').select('*').eq('id', poolId).single()
  if (!pool) redirect('/')

  // 2. Fetch Leaderboard via RPC!
  const { data: standings, error } = await supabase
    .rpc('get_pool_leaderboard', { p_pool_id: poolId })

  if (error) {
    return <div className="p-8 text-red-500 text-center">Failed to load standings: {error.message}</div>
  }

  return (
    <div className="bg-background text-foreground font-sans w-full">
      
      {/* Banner mimicking the target site pool header */}
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-gold to-yellow-300 rounded-full flex items-center justify-center border-4 border-brand-navy shadow-lg shadow-brand-gold/20">
             <span className="text-2xl">🏆</span>
          </div>

          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">{pool.name}</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest flex items-center justify-center gap-4">
            <span>Pool Leaderboard</span>
            <span>•</span>
            <span>{pool.scoring_system === 'weighted' ? 'Weighted Scoring' : 'Standard Scoring'}</span>
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20 pb-20">
        
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-background/50">
            <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Pool Standings</h2>
            <Link href="/analytics" className="text-xs font-bold text-brand-green hover:underline">
              View Analytics &rarr;
            </Link>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-slate-400 text-[10px] font-mono font-bold uppercase tracking-widest border-b border-border-subtle">
                <th className="py-4 px-6 w-16 text-center">#</th>
                <th className="py-4 px-6">Participant</th>
                <th className="py-4 px-6 text-center hidden sm:table-cell">Tiebreak</th>
                <th className="py-4 px-6 text-center">Picks</th>
                <th className="py-4 px-6 text-right w-24">Total</th>
                <th className="py-4 px-6 text-center w-16"></th>
              </tr>
            </thead>
            <tbody>
              {standings?.map((standing: any, index: number) => {
                const isMe = standing.username === user?.user_metadata?.username || false // Fallback comparison
                
                // Medal styling
                let rankVisual = <span className="font-mono text-sm text-slate-500 font-medium">{index + 1}</span>
                let bgClass = "bg-surface"
                
                if (index === 0) {
                  rankVisual = <span className="text-brand-gold font-bold text-lg font-mono">1</span>
                  bgClass = "bg-amber-50/30"
                }
                if (index === 1) {
                  rankVisual = <span className="text-slate-400 font-bold text-lg font-mono">2</span>
                }
                if (index === 2) {
                  rankVisual = <span className="text-amber-700 font-bold text-lg font-mono">3</span>
                }

                return (
                  <tr 
                    key={standing.entry_id} 
                    className={`border-b border-border-subtle transition-colors hover:bg-slate-50 cursor-pointer ${bgClass}`}
                  >
                    <td className="py-4 px-6 text-center">{rankVisual}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <span className={`font-semibold ${isMe ? 'text-brand-navy' : 'text-slate-800'}`}>
                          {standing.entry_name}
                        </span>
                        {isMe && <span className="px-1.5 py-0.5 rounded border border-brand-green/30 text-[9px] uppercase font-bold text-brand-green tracking-wider">YOU</span>}
                        {index === 0 && <span className="text-xs border border-brand-gold/30 bg-amber-50 px-1.5 rounded-full text-brand-gold">Champion</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{standing.username}</div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-400 font-mono text-xs hidden sm:table-cell">
                      -
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-xs font-semibold text-slate-600">
                      {standing.total_picks_made} <span className="text-slate-400 font-normal">/104</span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-lg text-brand-green">
                      {standing.total_points > 0 ? `+${standing.total_points}` : '0'}
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className="text-slate-300 text-xs">▼</span>
                    </td>
                  </tr>
                )
              })}
              
              {standings?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 text-sm">
                    No approved players on the board yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4 bg-background border-t border-border-subtle text-center">
             <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono border-t border-transparent inline-block pb-1 cursor-pointer hover:text-slate-600">Show Full Standings Bracket</p>
          </div>
        </div>
      </main>
    </div>
  )
}
