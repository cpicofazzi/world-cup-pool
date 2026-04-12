import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function ScoresPage() {
  const supabase = await createClient()

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      phase,
      kickoff_time,
      result,
      team_a:team_a_id ( name, flag_url ),
      team_b:team_b_id ( name, flag_url )
    `)
    .order('kickoff_time', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Failed to load matches: {error.message}</div>
  }

  const now = new Date()

  // Categorize matches
  const upcoming: any[] = []
  const live: any[] = []
  const previous: any[] = []

  matches?.forEach(match => {
    const kickoff = new Date(match.kickoff_time)
    
    if (match.result && Array.isArray(match.result) && match.result.length > 0) {
      // It has a result, so it's previous (finished)
      previous.push(match)
    } else if (kickoff < now && (!match.result || match.result.length === 0)) {
       // Kickoff is past but no result yet -> LIVE
       live.push(match)
    } else {
       // Future
       upcoming.push(match)
    }
  })

  // Helper to neatly render a match row matching the Playful Tarsier table aesthetic
  const MatchRow = ({ match, isLive = false, showDate = true }: { match: any, isLive?: boolean, showDate?: boolean }) => {
    const homeTeam = match.team_a?.[0] || match.team_a
    const awayTeam = match.team_b?.[0] || match.team_b
    
    // In our DB result is stored as [homeScore, awayScore] or similar depending on sync mechanism.
    let homeScore = "-"
    let awayScore = "-"
    if (match.result && Array.isArray(match.result) && match.result.length === 2) {
      homeScore = match.result[0]
      awayScore = match.result[1]
    }

    const kickoffStr = new Date(match.kickoff_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    return (
      <div className="flex border-b border-border-subtle hover:bg-slate-50 transition-colors py-3 px-4 sm:px-6 items-center">
        {/* Match Info */}
        <div className="w-1/4 sm:w-1/5 text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-tight">
          Phase: {match.phase}
          {showDate && <div className="mt-1 font-semibold text-slate-500">{kickoffStr}</div>}
        </div>
        
        {/* Teams and Scores */}
        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between sm:pr-8">
           {/* Home */}
           <div className="flex items-center justify-between w-full sm:w-2/5 mb-2 sm:mb-0">
             <div className="flex items-center space-x-3">
               {homeTeam?.flag_url && <img src={homeTeam.flag_url} alt="flag" className="w-5 h-5 rounded-full object-cover border border-slate-200" />}
               <span className="font-bold text-slate-800">{homeTeam?.name || 'Unknown'}</span>
             </div>
             <span className={`font-mono font-bold text-lg ${homeScore > awayScore ? 'text-brand-green' : 'text-slate-600'}`}>
               {homeScore}
             </span>
           </div>

           {/* VS Divider - Hidden on mobile */}
           <div className="hidden sm:block text-slate-300 text-[10px] font-mono px-4">-</div>

           {/* Away */}
           <div className="flex items-center justify-between w-full sm:w-2/5">
             <div className="flex items-center space-x-3">
               {awayTeam?.flag_url && <img src={awayTeam.flag_url} alt="flag" className="w-5 h-5 rounded-full object-cover border border-slate-200" />}
               <span className="font-bold text-slate-800">{awayTeam?.name || 'Unknown'}</span>
             </div>
             <span className={`font-mono font-bold text-lg ${awayScore > homeScore ? 'text-brand-green' : 'text-slate-600'}`}>
               {awayScore}
             </span>
           </div>
        </div>

        {/* Live Indicator */}
        <div className="w-12 text-right">
          {isLive && <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded border border-red-200 animate-pulse uppercase">Live</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">Live Scores</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
            Follow the Action
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20 pb-20 space-y-8">
        
        {/* LIVE GAMES */}
        {live.length > 0 && (
          <div className="bg-surface rounded-xl shadow-md border border-brand-green overflow-hidden ring-1 ring-brand-green/30">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-brand-green/5 text-brand-green">
              <h2 className="text-xs font-mono font-bold flex items-center space-x-2 tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                <span>Live Matches</span>
              </h2>
            </div>
            <div className="flex flex-col">
              {live.map(m => <MatchRow key={m.id} match={m} isLive={true} showDate={false} />)}
            </div>
          </div>
        )}

        {/* UPCOMING GAMES */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <div className="p-4 border-b border-border-subtle bg-background/50">
            <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Upcoming Matches</h2>
          </div>
          <div className="flex flex-col">
            {upcoming.length > 0 ? (
              upcoming.slice(0, 10).map(m => <MatchRow key={m.id} match={m} />)
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">No upcoming scheduled matches found.</div>
            )}
          </div>
          {upcoming.length > 10 && (
            <div className="p-3 text-center border-t border-border-subtle bg-slate-50">
              <span className="text-xs uppercase font-mono font-bold text-brand-navy hover:underline cursor-pointer">View All Upcoming</span>
            </div>
          )}
        </div>

        {/* PREVIOUS GAMES */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden opacity-80">
          <div className="p-4 border-b border-border-subtle bg-background/50">
            <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Previous Matches</h2>
          </div>
          <div className="flex flex-col">
            {previous.length > 0 ? (
              previous.slice().reverse().slice(0, 10).map(m => <MatchRow key={m.id} match={m} />)
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">No completed matches yet.</div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
