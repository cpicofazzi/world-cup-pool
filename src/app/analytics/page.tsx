import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // 1. Auth & Approval Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  const { data: profile } = await supabase.from('profiles').select('is_approved').eq('id', user.id).single()
  if (!profile?.is_approved) redirect('/')

  // 2. Fetch basic aggregation data for analytics
  const { count: totalPicks } = await supabase.from('picks').select('*', { count: 'exact', head: true })
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true)

  // Distribution of Predicted Results for Phase 1 vs Knockouts
  const { data: rawPicks } = await supabase.from('picks').select('predicted_result, match:match_id(phase)')
  
  let groupDraws = 0, groupWins = 0
  let knockoutWins = 0 // Knockouts can't "draw" in prediction logic usually, they predict to advance

  rawPicks?.forEach((p: any) => {
    if (p.match?.phase === 'group') {
      if (p.predicted_result === 'draw') groupDraws++
      else groupWins++
    } else {
      knockoutWins++
    }
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/leaderboard" className="text-xl font-bold text-slate-300 hover:text-white transition-colors">
            &larr; Back to Leaderboard
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
        <div className="mb-8 border-b border-slate-800 pb-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                GLOBAL ANALYTICS
            </h1>
            <p className="text-slate-400 mt-2">Aggregate trends and tendencies of the participant pool.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Global Stat Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-center items-center">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Total Pool Activity</span>
                <span className="text-6xl font-black text-indigo-400">{totalPicks || 0}</span>
                <span className="text-slate-400 text-sm mt-2">Picks submitted sitewide</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-center items-center">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Approved Operatives</span>
                <span className="text-6xl font-black text-emerald-400">{totalUsers || 0}</span>
                <span className="text-slate-400 text-sm mt-2">Participants battling</span>
            </div>

            {/* Distribution Analysis */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg md:col-span-2">
                <h3 className="text-xl font-bold mb-6">Group Stage Tendencies</h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">Predicted Match Winners</span>
                            <span className="font-bold">{groupWins}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3">
                            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${Math.min((groupWins / (groupWins + groupDraws || 1)) * 100, 100)}%`}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300">Predicted Draws (The Coward's Pick)</span>
                            <span className="font-bold">{groupDraws}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3">
                            <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${Math.min((groupDraws / (groupWins + groupDraws || 1)) * 100, 100)}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  )
}
