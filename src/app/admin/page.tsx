import { createClient } from '@/utils/supabase/server'
import { saveMatchScore, triggerDataSync } from './actions'

export default async function AdminMatchesPage() {
  const supabase = await createClient()

  // Fetch matches with associated team data
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      phase,
      kickoff_time,
      result,
      team_a_score,
      team_b_score,
      description,
      team_a:team_a_id (id, name, flag_url),
      team_b:team_b_id (id, name, flag_url)
    `)
    .order('kickoff_time', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Failed to load matches: {error.message}</div>
  }

  return (
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">Match Entry</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
             Automated DB triggers will calculate and award points instantly
          </p>
          <form action={async (formData) => {
            'use server'
            await triggerDataSync(formData)
          }} className="mt-6">
            <button type="submit" className="bg-brand-green text-brand-navy px-6 py-2 rounded-full text-sm font-bold hover:bg-brand-green/90 shadow-sm transition-colors uppercase tracking-wider">
              Sync Tournament Data
            </button>
          </form>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-0 -mt-8 relative z-20 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches?.map((match: any) => {
            const tA = match.team_a || { name: 'TBD', flag_url: '' }
            const tB = match.team_b || { name: 'TBD', flag_url: '' }
            const hasScore = match.team_a_score !== null && match.team_b_score !== null

            return (
              <div key={match.id} className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
               {hasScore && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-brand-green"></div>
               )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Phase: {match.phase}
                  </span>
                  {match.result && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green">Final</span>
                  )}
                </div>
                
                <div className="flex-grow flex items-center justify-between mb-6">
                  {/* Team A */}
                  <div className="flex flex-col items-center w-1/3">
                    {tA.flag_url ? (
                      <img src={tA.flag_url} alt={tA.name} className="w-12 h-8 rounded-sm shadow-sm object-cover mb-2 border border-slate-200" />
                    ) : (
                      <div className="w-12 h-8 rounded-sm bg-slate-100 mb-2 border border-slate-200"></div>
                    )}
                    <span className="text-xs font-bold text-center leading-tight h-8 truncate w-full text-brand-navy">{tA.name}</span>
                  </div>
                  
                  <div className="text-slate-400 font-mono text-xs">VS</div>
                  
                  {/* Team B */}
                  <div className="flex flex-col items-center w-1/3">
                    {tB.flag_url ? (
                      <img src={tB.flag_url} alt={tB.name} className="w-12 h-8 rounded-sm shadow-sm object-cover mb-2 border border-slate-200" />
                    ) : (
                      <div className="w-12 h-8 rounded-sm bg-slate-100 mb-2 border border-slate-200"></div>
                    )}
                    <span className="text-xs font-bold text-center leading-tight h-8 truncate w-full text-brand-navy">{tB.name}</span>
                  </div>
                </div>

                {!match.team_a && !match.team_b && (
                    <p className="text-center text-xs text-slate-500 mb-4 font-mono">{match.description}</p>
                )}

                <form className="mt-auto pt-4 border-t border-border-subtle" action={async (formData: FormData) => {
                  'use server'
                  const scoreA = Number(formData.get('team_a_score'))
                  const scoreB = Number(formData.get('team_b_score'))
                  await saveMatchScore(match.id, scoreA, scoreB)
                }}>
                  <div className="flex space-x-2 mb-4">
                    <input 
                      type="number" 
                      name="team_a_score" 
                      defaultValue={match.team_a_score ?? ''}
                      placeholder="Score A" 
                      required 
                      min="0"
                      className="w-1/2 bg-white border border-border-subtle rounded-lg px-3 py-2 text-center text-xl font-bold font-mono focus:ring-2 focus:ring-brand-navy focus:outline-none placeholder:text-sm placeholder:font-sans placeholder:font-normal" 
                    />
                    <input 
                      type="number" 
                      name="team_b_score" 
                      defaultValue={match.team_b_score ?? ''}
                      placeholder="Score B" 
                      required 
                      min="0"
                      className="w-1/2 bg-white border border-border-subtle rounded-lg px-3 py-2 text-center text-xl font-bold font-mono focus:ring-2 focus:ring-brand-navy focus:outline-none placeholder:text-sm placeholder:font-sans placeholder:font-normal" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                      hasScore 
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-border-subtle' 
                        : 'bg-brand-navy text-white hover:bg-brand-navy/90 shadow-sm'
                    }`}
                  >
                    {hasScore ? 'Update Score' : 'Save Final Score'}
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
