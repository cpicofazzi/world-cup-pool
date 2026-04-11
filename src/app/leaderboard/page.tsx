import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ poolId: string }> }) {
  const { poolId } = await searchParams
  if (!poolId) redirect('/')

  const supabase = await createClient()

  // 1. Auth & Pool verification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  // Make sure this pool exists and grab its name
  const { data: pool } = await supabase.from('pools').select('*').eq('id', poolId).single()
  if (!pool) redirect('/')

  // Verify the user is an APPROVED member of this pool (or the admin)
  const { data: checkMembership } = await supabase
    .from('pool_entries')
    .select('is_approved, entries(user_id)')
    .eq('pool_id', poolId)

  // A user can be in the pool multiple times, check if they own ANY approved entry, or if they are admin
  const isApprovedMember = checkMembership?.some((pm: any) => pm.is_approved && pm.entries.user_id === user.id)
  
  if (!isApprovedMember && pool.admin_id !== user.id) {
    redirect('/')
  }

  // 2. Fetch Leaderboard via RPC!
  const { data: standings, error } = await supabase
    .rpc('get_pool_leaderboard', { p_pool_id: poolId })

  if (error) {
    return <div className="p-8 text-red-500 text-center">Failed to load standings: {error.message}</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            &larr; Dashboard Hub
          </Link>
          <div className="text-sm font-medium space-x-4">
             <Link href="/analytics" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
               View Analytics Trends
             </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-black mb-4 uppercase">{pool.name}</h1>
          <p className="text-slate-400 text-lg">
            Scoring Rules: <strong className="text-white">{pool.scoring_system === 'weighted' ? 'Weighted (1.5x Upsets)' : 'Standard Bracket'}</strong>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-sm uppercase tracking-wider border-b border-slate-700">
                <th className="p-5 font-bold w-20">Rank</th>
                <th className="p-5 font-bold">Player Bracket</th>
                <th className="p-5 font-bold">User</th>
                <th className="p-5 font-bold text-center">Picks Made</th>
                <th className="p-5 font-bold text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings?.map((standing: any, index: number) => {
                const isMe = standing.username === user?.user_metadata?.username || false // Fallback comparison
                // Medal styling for top 3
                let rankVisual = <span className="font-mono text-lg text-slate-500">{index + 1}</span>
                if (index === 0) rankVisual = <span className="text-2xl" title="1st Place">🥇</span>
                if (index === 1) rankVisual = <span className="text-2xl" title="2nd Place">🥈</span>
                if (index === 2) rankVisual = <span className="text-2xl" title="3rd Place">🥉</span>

                return (
                  <tr 
                    key={standing.entry_id} 
                    className={`border-b border-slate-800/50 transition-colors ${
                      isMe ? 'bg-indigo-900/40 hover:bg-indigo-900/60' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-5 w-16 text-center">{rankVisual}</td>
                    <td className="p-5">
                      <div className="flex items-center space-x-3">
                        <span className={`font-bold text-lg ${isMe ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {standing.entry_name}
                        </span>
                        {isMe && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-400">YOU</span>}
                      </div>
                    </td>
                    <td className="p-5 text-slate-400">{standing.username}</td>
                    <td className="p-5 text-center font-mono text-slate-400">
                      {standing.total_picks_made} <span className="text-slate-600 text-xs">/ 104</span>
                    </td>
                    <td className="p-5 text-right font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                      {standing.total_points}
                    </td>
                  </tr>
                )
              })}
              
              {standings?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No approved players on the board yet!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
