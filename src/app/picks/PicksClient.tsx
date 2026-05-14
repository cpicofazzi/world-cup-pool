'use client'

import { useState, useTransition } from 'react'
import GroupPicker from './GroupPicker'
import BracketView from './BracketView'
import { setThirdPlacePicks, clearBracketPicks, clearAllGroupPicks } from './actions'
import { GROUP_LETTERS, GROUP_PICK_POINTS, ROUND_POINTS, ROUND_NAMES, ROUND_MATCH_COUNT, KNOCKOUT_MAX, TOTAL_MAX_POINTS } from '@/lib/bracketStructure'

interface PicksClientProps {
  entryId: string
  isOwner: boolean
  isPhase1Locked: boolean
  isPhase2Locked: boolean
  teamsByGroup: Record<string, any[]>
  teamsMap: Record<string, any>
  initialGroupPicks: Record<string, { first: string | null; second: string | null }>
  initialThirdPlaceTeams: (string | null)[]
  initialBracketPicks: Record<string, string>
}

export default function PicksClient({
  entryId, isOwner,
  isPhase1Locked, isPhase2Locked,
  teamsByGroup, teamsMap,
  initialGroupPicks, initialThirdPlaceTeams, initialBracketPicks,
}: PicksClientProps) {
  const [groupPicks, setGroupPicks] = useState(initialGroupPicks)
  const [thirdPlaceTeams, setThirdPlaceTeams] = useState<(string | null)[]>(initialThirdPlaceTeams)
  const [bracketPicks, setBracketPicks] = useState(initialBracketPicks)
  const [activePhase, setActivePhase] = useState<'groups' | 'bracket'>('groups')
  const [isPending, startTransition] = useTransition()
  const [thirdError, setThirdError] = useState<string | null>(null)

  const handleGroupPickChange = (group: string, first: string | null, second: string | null) => {
    setGroupPicks(prev => ({ ...prev, [group]: { first, second } }))
    setBracketPicks({})
  }

  const handleThirdPlaceRankChange = (teamId: string, newRank: number | null) => {
    if (isPhase1Locked || isPending) return
    setThirdError(null)

    const newTeams = [...thirdPlaceTeams]
    
    const currentIndex = newTeams.indexOf(teamId)
    if (currentIndex !== -1) {
      newTeams[currentIndex] = null
    }

    if (newRank !== null) {
      const targetIndex = newRank - 1
      if (newTeams[targetIndex] !== null && currentIndex !== -1) {
         newTeams[currentIndex] = newTeams[targetIndex]
      }
      newTeams[targetIndex] = teamId
    }

    setThirdPlaceTeams(newTeams)
    setBracketPicks({})

    startTransition(async () => {
      await clearBracketPicks(entryId)
      const res = await setThirdPlacePicks(entryId, newTeams)
      if (res.error) {
        setThirdError(res.error)
        setThirdPlaceTeams(thirdPlaceTeams)
      }
    })
  }

  const handleClearGroupPicks = () => {
    if (isPhase1Locked || isPending) return
    if (!confirm('Are you sure you want to clear ALL group picks? This will also reset your 3rd-place and bracket picks.')) return

    setGroupPicks({})
    setThirdPlaceTeams(Array(8).fill(null))
    setBracketPicks({})

    startTransition(async () => {
      await clearAllGroupPicks(entryId)
    })
  }

  const handleClearThirdPlace = () => {
    if (isPhase1Locked || isPending) return
    if (!confirm('Are you sure you want to clear your 3rd-place picks?')) return

    setThirdPlaceTeams(Array(8).fill(null))
    setBracketPicks({})

    startTransition(async () => {
      await clearBracketPicks(entryId)
      await setThirdPlacePicks(entryId, [])
    })
  }

  const completedGroups = Object.values(groupPicks).filter(g => g.first && g.second).length
  const allGroupsComplete = completedGroups === 12
  const thirdPlaceReady = thirdPlaceTeams.filter(Boolean).length === 8
  const bracketReady = allGroupsComplete && thirdPlaceReady

  // Calculate remaining teams for 3rd place selection
  const pickedInGroups = new Set(Object.values(groupPicks).flatMap(g => [g.first, g.second]).filter(Boolean))
  const remainingTeams = Object.values(teamsMap).filter(t => !pickedInGroups.has(t.id)).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-10">
      {/* Phase Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActivePhase('groups')}
          className={`flex-1 py-4 rounded-xl text-center transition-all border ${
            activePhase === 'groups'
              ? 'bg-brand-navy text-white border-brand-navy shadow-md'
              : 'bg-surface text-slate-500 border-border-subtle hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest mb-1">Phase 1</div>
          <div className="text-sm font-bold">Group & 3rd-Place Picks</div>
          <div className="text-[10px] font-mono mt-1 opacity-70">{completedGroups}/12 groups • {thirdPlaceTeams.filter(Boolean).length}/8 thirds</div>
        </button>
        <button
          onClick={() => bracketReady && setActivePhase('bracket')}
          className={`flex-1 py-4 rounded-xl text-center transition-all border ${
            activePhase === 'bracket'
              ? 'bg-brand-navy text-white border-brand-navy shadow-md'
              : bracketReady
              ? 'bg-surface text-slate-500 border-border-subtle hover:bg-slate-50'
              : 'bg-slate-100 text-slate-300 border-border-subtle cursor-not-allowed'
          }`}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest mb-1">Phase 2</div>
          <div className="text-sm font-bold">Knockout Bracket</div>
          <div className="text-[10px] font-mono mt-1 opacity-70">
            {bracketReady ? 'Ready' : 'Complete Phase 1 first'}
          </div>
        </button>
      </div>

      {/* Phase 1: Group Picks */}
      {activePhase === 'groups' && (
        <section className="space-y-10">
          {/* Scoring Summary */}
          <div className="bg-surface rounded-xl border border-border-subtle p-5 shadow-sm">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-3">Phase 1 Scoring</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <div className="text-base font-bold text-brand-navy">{GROUP_PICK_POINTS.CORRECT_TEAM_ADVANCE} pt</div>
                <div className="text-[9px] text-slate-500 font-mono uppercase">Correct Team</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <div className="text-base font-bold text-brand-green">+{GROUP_PICK_POINTS.CORRECT_POSITION} pt</div>
                <div className="text-[9px] text-slate-500 font-mono uppercase">Right Position</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <div className="text-base font-bold text-brand-navy">{GROUP_PICK_POINTS.MAX_PER_GROUP}</div>
                <div className="text-[9px] text-slate-500 font-mono uppercase">Max / Group</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <div className="text-base font-bold text-amber-600">{GROUP_PICK_POINTS.CORRECT_THIRD_PLACE} pt</div>
                <div className="text-[9px] text-slate-500 font-mono uppercase">3rd Correct</div>
              </div>
              <div className="p-2.5 bg-brand-gold/10 rounded-lg">
                <div className="text-base font-bold text-brand-gold">{GROUP_PICK_POINTS.MAX_PHASE1_TOTAL}</div>
                <div className="text-[9px] text-slate-500 font-mono uppercase">Phase 1 Max</div>
              </div>
            </div>
          </div>

          {/* Group Picks */}
          <div>
            <div className="mb-5 border-b border-border-subtle pb-3 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-serif font-bold text-brand-navy">Group Stage Rankings</h2>
                <p className="text-slate-500 text-sm mt-1">
                  For each group, rank the teams <strong>1st and 2nd</strong>. Click once for 1st, again for 2nd.
                </p>
              </div>
              {!isPhase1Locked && Object.keys(groupPicks).length > 0 && (
                <button 
                  onClick={handleClearGroupPicks}
                  disabled={isPending}
                  className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear Groups
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {GROUP_LETTERS.map(letter => (
                <GroupPicker
                  key={letter}
                  groupLetter={letter}
                  teams={teamsByGroup[letter] || []}
                  entryId={entryId}
                  initialFirst={groupPicks[letter]?.first ?? null}
                  initialSecond={groupPicks[letter]?.second ?? null}
                  isLocked={isPhase1Locked}
                  onGroupPickChange={handleGroupPickChange}
                />
              ))}
            </div>
          </div>

          {/* 3rd-Place Advancement Picker */}
          {allGroupsComplete && (
            <div>
              <div className="mb-5 border-b border-border-subtle pb-3 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-brand-navy">Best Third-Place Teams</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Select exactly <strong>8</strong> third-place teams from the remaining teams that will advance to the knockout stage.
                  </p>
                </div>
                {!isPhase1Locked && thirdPlaceTeams.some(Boolean) && (
                  <button 
                    onClick={handleClearThirdPlace}
                    disabled={isPending}
                    className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider mb-1 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Clear 3rd Place
                  </button>
                )}
              </div>

              <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm">
                <div className="bg-amber-50 px-5 py-3 border-b border-amber-200/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider font-mono">
                    Which 3rd-place teams advance?
                  </span>
                  <span className={`text-xs font-bold font-mono ${thirdPlaceTeams.filter(Boolean).length === 8 ? 'text-brand-green' : 'text-amber-600'}`}>
                    {thirdPlaceTeams.filter(Boolean).length}/8 selected
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-x divide-y divide-border-subtle">
                  {remainingTeams.map(team => {
                    const rankIndex = thirdPlaceTeams.indexOf(team.id)
                    const isSelected = rankIndex !== -1
                    const rank = isSelected ? rankIndex + 1 : null

                    return (
                      <div
                        key={team.id}
                        className={`flex items-center gap-3 px-4 py-3 transition-all ${
                          isSelected 
                            ? 'bg-amber-50'
                            : 'bg-surface'
                        }`}
                      >
                        <select
                          value={rank || ''}
                          onChange={(e) => handleThirdPlaceRankChange(team.id, e.target.value ? parseInt(e.target.value, 10) : null)}
                          disabled={isPhase1Locked || isPending}
                          className={`w-14 h-8 text-sm font-bold border rounded bg-white shadow-sm focus:ring-2 focus:ring-amber-500 focus:outline-none text-center
                            ${isSelected ? 'border-amber-500 text-amber-700' : 'border-slate-300 text-slate-600'}
                            ${(isPhase1Locked || isPending) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <option value="">-</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>

                        {/* Team info */}
                        <div className="flex items-center gap-2 min-w-0">
                          {team.flag_url && (
                            <img src={team.flag_url} alt="" className="w-6 h-4 rounded-sm object-cover border border-slate-200" />
                          )}
                          <div className="min-w-0">
                            <div className="text-[10px] text-slate-400 font-mono uppercase">Grp {team.group_letter}</div>
                            <div className="text-xs font-bold text-slate-700 truncate">{team.name}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {thirdError && (
                  <div className="px-5 py-2 bg-red-50 border-t border-red-200">
                    <p className="text-xs text-red-600">{thirdError}</p>
                  </div>
                )}
              </div>

              {/* Proceed CTA */}
              {bracketReady && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setActivePhase('bracket')}
                    className="bg-brand-green text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-brand-green/90 shadow-md transition-all uppercase tracking-wider"
                  >
                    Proceed to Knockout Bracket →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Phase 2: Knockout Bracket */}
      {activePhase === 'bracket' && (
        <section>
          <div className="mb-6 border-b border-border-subtle pb-4">
            <h2 className="text-3xl font-serif font-bold text-brand-navy">PHASE 2: KNOCKOUT BRACKET</h2>
            <p className="text-slate-500 mt-1">
              Your group predictions fill the bracket. Click a team to advance them. 
              Points: {Object.entries(ROUND_POINTS).map(([r, p]) => `${ROUND_NAMES[r]} (${p}pts)`).join(' → ')}.
            </p>
          </div>

          <BracketView
            entryId={entryId}
            isLocked={isPhase2Locked}
            teamsMap={teamsMap}
            groupPicks={groupPicks}
            advancingThirdTeams={thirdPlaceTeams.filter(Boolean) as string[]}
            existingBracketPicks={bracketPicks}
          />

          <div className="mt-8 text-center">
            <button
              onClick={() => setActivePhase('groups')}
              className="text-brand-navy text-sm font-bold hover:underline uppercase tracking-wider"
            >
              ← Back to Group Picks
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
