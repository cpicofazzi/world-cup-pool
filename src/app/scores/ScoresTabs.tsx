'use client'

import { useState } from 'react'

type Tab = 'matches' | 'groups'

interface Team {
  name: string
  flag_url: string | null
}

interface Match {
  id: string
  phase: string
  kickoff_time: string
  result: string | null
  team_a_score: number | null
  team_b_score: number | null
  team_a: Team | Team[] | null
  team_b: Team | Team[] | null
}

interface GroupTeam {
  id: string
  name: string
  flag_url: string | null
  group_letter: string | null
  // Computed stats
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export function ScoresTabs({ 
  matches, 
  teams,
  groupMatches
}: { 
  matches: Match[]
  teams: any[]
  groupMatches: any[]
}) {
  const [tab, setTab] = useState<Tab>('matches')

  const now = new Date()

  // Categorize matches
  const upcoming: Match[] = []
  const live: Match[] = []
  const previous: Match[] = []

  matches?.forEach(match => {
    const kickoff = new Date(match.kickoff_time)
    if (match.result) {
      previous.push(match)
    } else if (kickoff < now) {
      live.push(match)
    } else {
      upcoming.push(match)
    }
  })

  // Build group tables from teams + group match results
  const groupLetters = [...new Set(teams.filter(t => t.group_letter).map(t => t.group_letter))].sort()

  const groupTables: Record<string, GroupTeam[]> = {}
  for (const letter of groupLetters) {
    const groupTeams = teams
      .filter(t => t.group_letter === letter)
      .map(t => {
        // Calculate stats from group matches
        let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0
        
        for (const m of groupMatches) {
          const isTeamA = m.team_a_id === t.id
          const isTeamB = m.team_b_id === t.id
          if (!isTeamA && !isTeamB) continue
          if (m.team_a_score === null || m.team_b_score === null) continue

          played++
          const scored = isTeamA ? m.team_a_score : m.team_b_score
          const conceded = isTeamA ? m.team_b_score : m.team_a_score
          gf += scored
          ga += conceded

          if (scored > conceded) won++
          else if (scored < conceded) lost++
          else drawn++
        }

        return {
          id: t.id,
          name: t.name,
          flag_url: t.flag_url,
          group_letter: t.group_letter,
          played,
          won,
          drawn,
          lost,
          gf,
          ga,
          gd: gf - ga,
          pts: won * 3 + drawn
        }
      })
      // Sort: points desc, then GD desc, then GF desc
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

    groupTables[letter] = groupTeams
  }

  // MatchRow helper
  const MatchRow = ({ match, isLive = false, showDate = true }: { match: Match, isLive?: boolean, showDate?: boolean }) => {
    const homeTeam: any = Array.isArray(match.team_a) ? match.team_a[0] : match.team_a
    const awayTeam: any = Array.isArray(match.team_b) ? match.team_b[0] : match.team_b

    let homeScore: string | number = "-"
    let awayScore: string | number = "-"
    if (match.team_a_score !== null && match.team_b_score !== null) {
      homeScore = match.team_a_score
      awayScore = match.team_b_score
    }

    const kickoffStr = new Date(match.kickoff_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    return (
      <div className="flex border-b border-border-subtle hover:bg-slate-50 transition-colors py-3 px-4 sm:px-6 items-center">
        <div className="w-1/4 sm:w-1/5 text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-tight">
          {match.phase}
          {showDate && <div className="mt-1 font-semibold text-slate-500">{kickoffStr}</div>}
        </div>
        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between sm:pr-8">
           <div className="flex items-center justify-between w-full sm:w-2/5 mb-2 sm:mb-0">
             <div className="flex items-center space-x-3">
               {homeTeam?.flag_url && <img src={homeTeam.flag_url} alt="flag" className="w-5 h-5 rounded-full object-cover border border-slate-200" />}
               <span className="font-bold text-slate-800">{homeTeam?.name || 'TBD'}</span>
             </div>
             <span className={`font-mono font-bold text-lg ${homeScore > awayScore ? 'text-brand-green' : 'text-slate-600'}`}>
               {homeScore}
             </span>
           </div>
           <div className="hidden sm:block text-slate-300 text-[10px] font-mono px-4">-</div>
           <div className="flex items-center justify-between w-full sm:w-2/5">
             <div className="flex items-center space-x-3">
               {awayTeam?.flag_url && <img src={awayTeam.flag_url} alt="flag" className="w-5 h-5 rounded-full object-cover border border-slate-200" />}
               <span className="font-bold text-slate-800">{awayTeam?.name || 'TBD'}</span>
             </div>
             <span className={`font-mono font-bold text-lg ${awayScore > homeScore ? 'text-brand-green' : 'text-slate-600'}`}>
               {awayScore}
             </span>
           </div>
        </div>
        <div className="w-12 text-right">
          {isLive && <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded border border-red-200 animate-pulse uppercase">Live</span>}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Sub-tabs */}
      <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20 mb-6">
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle inline-flex overflow-hidden">
          <button
            onClick={() => setTab('matches')}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              tab === 'matches'
                ? 'bg-brand-navy text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              tab === 'groups'
                ? 'bg-brand-navy text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Group Tables
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-0 relative z-20 pb-20 space-y-8">
        {tab === 'matches' && (
          <>
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
          </>
        )}

        {tab === 'groups' && (
          <>
            {groupLetters.length === 0 ? (
              <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-12 text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h2 className="text-xl font-bold text-brand-navy mb-2">Groups Not Assigned</h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Group assignments haven&apos;t been synced yet. An admin can sync tournament data from the Admin Dashboard once standings are available.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {groupLetters.map(letter => (
                  <div key={letter} className="bg-surface rounded-xl shadow-sm border border-border-subtle overflow-hidden">
                    {/* Group Header */}
                    <div className="p-4 border-b border-border-subtle bg-brand-navy">
                      <h2 className="text-sm font-bold text-brand-gold tracking-widest uppercase font-mono">
                        Group {letter}
                      </h2>
                    </div>
                    
                    {/* Table Header */}
                    <div className="flex items-center px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-border-subtle bg-slate-50">
                      <div className="flex-1">Team</div>
                      <div className="w-8 text-center">P</div>
                      <div className="w-8 text-center">W</div>
                      <div className="w-8 text-center">D</div>
                      <div className="w-8 text-center">L</div>
                      <div className="w-10 text-center">GD</div>
                      <div className="w-10 text-center font-black text-brand-navy">Pts</div>
                    </div>
                    
                    {/* Team Rows */}
                    {groupTables[letter]?.map((team, idx) => (
                      <div 
                        key={team.id} 
                        className={`flex items-center px-4 py-3 border-b border-border-subtle last:border-b-0 transition-colors hover:bg-slate-50 ${
                          idx < 2 ? 'bg-brand-green/5' : ''
                        }`}
                      >
                        <div className="flex-1 flex items-center space-x-3">
                          <span className="text-xs font-mono text-slate-400 w-4">{idx + 1}</span>
                          {team.flag_url ? (
                            <img src={team.flag_url} alt={team.name} className="w-6 h-4 rounded-sm object-cover border border-slate-200 shadow-sm" />
                          ) : (
                            <div className="w-6 h-4 rounded-sm bg-slate-100 border border-slate-200"></div>
                          )}
                          <span className="text-sm font-bold text-brand-navy truncate">{team.name}</span>
                        </div>
                        <div className="w-8 text-center text-xs font-mono text-slate-600">{team.played}</div>
                        <div className="w-8 text-center text-xs font-mono text-slate-600">{team.won}</div>
                        <div className="w-8 text-center text-xs font-mono text-slate-600">{team.drawn}</div>
                        <div className="w-8 text-center text-xs font-mono text-slate-600">{team.lost}</div>
                        <div className={`w-10 text-center text-xs font-mono font-bold ${
                          team.gd > 0 ? 'text-brand-green' : team.gd < 0 ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {team.gd > 0 ? `+${team.gd}` : team.gd}
                        </div>
                        <div className="w-10 text-center text-sm font-black text-brand-navy">{team.pts}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
