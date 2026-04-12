import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const supabase = await createClient()

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
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">Global Analytics</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
            Aggregate Pool Trends
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20 pb-20 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Global Stat Cards */}
            <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col justify-center items-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Pool Activity</span>
                <span className="text-5xl font-serif font-bold text-brand-navy">{totalPicks || 0}</span>
                <span className="text-slate-400 text-xs mt-2 font-mono">Picks submitted sitewide</span>
            </div>

            <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col justify-center items-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Approved Operatives</span>
                <span className="text-5xl font-serif font-bold text-brand-green">{totalUsers || 0}</span>
                <span className="text-slate-400 text-xs mt-2 font-mono">Participants battling</span>
            </div>

            {/* Distribution Analysis */}
            <div className="bg-surface border border-border-subtle rounded-xl p-8 shadow-sm md:col-span-2">
                <h3 className="text-xl font-serif font-bold mb-6 text-brand-navy">Group Stage Tendencies</h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-semibold">
                            <span className="text-slate-700">Predicted Match Winners</span>
                            <span className="text-brand-navy bg-slate-100 px-2 rounded-full">{groupWins}</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-border-subtle rounded-full h-3 overflow-hidden">
                            <div className="bg-brand-navy h-3 rounded-full" style={{ width: `${Math.min((groupWins / (groupWins + groupDraws || 1)) * 100, 100)}%`}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-semibold">
                            <span className="text-slate-700">Predicted Draws (The Coward's Pick)</span>
                            <span className="text-amber-600 bg-amber-50 px-2 rounded-full">{groupDraws}</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-border-subtle rounded-full h-3 overflow-hidden">
                            <div className="bg-brand-gold h-3 rounded-full" style={{ width: `${Math.min((groupDraws / (groupWins + groupDraws || 1)) * 100, 100)}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  )
}
