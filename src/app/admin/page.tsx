import { createClient } from '@/utils/supabase/server'
import { saveMatchScore } from '../actions'

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
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Match Entry</h1>
        <p className="text-slate-400 mt-2">Enter final scores. Automated DB triggers will calculate and award points instantly.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {matches?.map((match: any) => {
          const tA = match.team_a || { name: 'TBD', flag_url: '' }
          const tB = match.team_b || { name: 'TBD', flag_url: '' }
          const hasScore = match.team_a_score !== null && match.team_b_score !== null

          return (
            <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col relative overflow-hidden">
             {hasScore && (
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
             )}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-2 py-1 rounded">
                  Phase: {match.phase}
                </span>
                {match.result && (
                  <span className="text-xs font-semibold text-emerald-400">Status: Final</span>
                )}
              </div>
              
              <div className="flex-grow flex items-center justify-between mb-6">
                {/* Team A */}
                <div className="flex flex-col items-center w-1/3">
                  <img src={tA.flag_url || 'https://flagcdn.com/w80/un.png'} alt={tA.name} className="w-12 h-8 rounded-sm shadow-sm object-cover mb-2" />
                  <span className="text-xs font-bold text-center leading-tight h-8 truncate w-full">{tA.name}</span>
                </div>
                
                <div className="text-slate-500 font-bold">VS</div>
                
                {/* Team B */}
                <div className="flex flex-col items-center w-1/3">
                  <img src={tB.flag_url || 'https://flagcdn.com/w80/un.png'} alt={tB.name} className="w-12 h-8 rounded-sm shadow-sm object-cover mb-2" />
                  <span className="text-xs font-bold text-center leading-tight h-8 truncate w-full">{tB.name}</span>
                </div>
              </div>

              {!match.team_a && !match.team_b && (
                  <p className="text-center text-xs text-slate-500 mb-4">{match.description}</p>
              )}

              <form className="mt-auto pt-4 border-t border-slate-800/50" action={async (formData: FormData) => {
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
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-sm placeholder:font-normal" 
                  />
                  <input 
                    type="number" 
                    name="team_b_score" 
                    defaultValue={match.team_b_score ?? ''}
                    placeholder="Score B" 
                    required 
                    min="0"
                    className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-sm placeholder:font-normal" 
                  />
                </div>
                <button 
                  type="submit" 
                  className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                    hasScore 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                  }`}
                >
                  {hasScore ? 'Update Score' : 'Save Final Score'}
                </button>
              </form>
            </div>
          )
        })}
      </div>
    </div>
  )
}
