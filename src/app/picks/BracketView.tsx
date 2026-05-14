'use client'

import { useState, useTransition, useCallback } from 'react'
import { upsertBracketPick } from './actions'
import { R32_BRACKET, R16_FEEDS, QF_FEEDS, SF_FEEDS, F_FEEDS, ROUND_NAMES, ROUND_POINTS, resolveR32Matchups } from '@/lib/bracketStructure'

interface Team {
  id: string
  name: string
  flag_url: string | null
  tla: string
}

interface BracketViewProps {
  entryId: string
  isLocked: boolean
  teamsMap: Record<string, Team>
  groupPicks: Record<string, { first: string | null; second: string | null }>
  advancingThirdTeams: string[]
  existingBracketPicks: Record<string, string>
}

export default function BracketView({ 
  entryId, isLocked, teamsMap, groupPicks, advancingThirdTeams, existingBracketPicks 
}: BracketViewProps) {
  const [picks, setPicks] = useState<Record<string, string>>(existingBracketPicks)
  const [isPending, startTransition] = useTransition()

  const getKey = (round: string, slot: number) => `${round}-${slot}`

  // Resolve the full R32 lineup from group picks + 3rd-place selections
  const r32Matchups = resolveR32Matchups(groupPicks, advancingThirdTeams)

  const getR32Teams = useCallback((slot: number): [string | null, string | null] => {
    const m = r32Matchups.find(m => m.slot === slot)
    return m ? [m.home, m.away] : [null, null]
  }, [r32Matchups])

  // Get team IDs for any round matchup
  const getMatchupTeams = useCallback((round: string, slot: number): [string | null, string | null] => {
    if (round === 'R32') return getR32Teams(slot)

    let feeds: { slot: number; feedFrom: [number, number] }[]
    let prevRound: string
    
    if (round === 'R16') { feeds = R16_FEEDS; prevRound = 'R32' }
    else if (round === 'QF') { feeds = QF_FEEDS; prevRound = 'R16' }
    else if (round === 'SF') { feeds = SF_FEEDS; prevRound = 'QF' }
    else if (round === 'F') { feeds = F_FEEDS; prevRound = 'SF' }
    else return [null, null]

    const feedPair = feeds.find(f => f.slot === slot)
    if (!feedPair) return [null, null]

    const home = picks[getKey(prevRound, feedPair.feedFrom[0])] ?? null
    const away = picks[getKey(prevRound, feedPair.feedFrom[1])] ?? null
    return [home, away]
  }, [picks, getR32Teams])

  const handlePick = (round: string, slot: number, teamId: string) => {
    if (isLocked || isPending || !teamId) return
    
    const key = getKey(round, slot)
    const oldPick = picks[key]
    const newPicks = { ...picks, [key]: teamId }

    // If we changed the pick, cascade clear downstream rounds
    if (oldPick && oldPick !== teamId) {
      const roundOrder = ['R32', 'R16', 'QF', 'SF', 'F']
      const currentIdx = roundOrder.indexOf(round)
      for (let i = currentIdx + 1; i < roundOrder.length; i++) {
        const r = roundOrder[i]
        Object.keys(newPicks)
          .filter(k => k.startsWith(`${r}-`))
          .forEach(k => delete newPicks[k])
      }
    }

    setPicks(newPicks)

    startTransition(async () => {
      await upsertBracketPick(entryId, round, slot, teamId)
    })
  }

  const TeamButton = ({ teamId, round, slot, position }: { 
    teamId: string | null, round: string, slot: number, position: 'home' | 'away' 
  }) => {
    const team = teamId ? teamsMap[teamId] : null
    const key = getKey(round, slot)
    const isSelected = picks[key] === teamId && teamId !== null

    return (
      <button
        onClick={() => teamId && handlePick(round, slot, teamId)}
        disabled={isLocked || isPending || !teamId}
        className={`w-full flex items-center gap-2 px-3 py-2 transition-all text-left ${
          !teamId ? 'opacity-40 cursor-not-allowed' 
          : isLocked ? 'cursor-not-allowed opacity-70'
          : 'cursor-pointer hover:bg-brand-navy/5'
        } ${
          isSelected ? 'bg-brand-green/10' : ''
        } ${
          position === 'home' ? 'border-b border-border-subtle' : ''
        }`}
      >
        {team?.flag_url ? (
          <img src={team.flag_url} alt={team.name} className="w-5 h-3.5 rounded-sm object-cover border border-slate-200" />
        ) : (
          <div className="w-5 h-3.5 rounded-sm bg-slate-200 border border-slate-300" />
        )}
        <span className={`text-[11px] font-bold truncate ${
          isSelected ? 'text-brand-green' : 'text-slate-700'
        }`}>
          {team?.tla || team?.name || 'TBD'}
        </span>
        {isSelected && <span className="ml-auto text-brand-green text-[10px]">✓</span>}
      </button>
    )
  }

  const MatchCard = ({ round, slot, label }: { round: string, slot: number, label?: string }) => {
    const [home, away] = getMatchupTeams(round, slot)
    
    return (
      <div className="bg-white border border-border-subtle rounded-lg overflow-hidden shadow-sm w-[170px] flex-shrink-0">
        {label && (
          <div className="bg-slate-50 px-2 py-0.5 border-b border-border-subtle">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">{label}</span>
          </div>
        )}
        <TeamButton teamId={home} round={round} slot={slot} position="home" />
        <TeamButton teamId={away} round={round} slot={slot} position="away" />
      </div>
    )
  }

  // Check readiness: need all group picks + exactly 8 advancing 3rd-place teams
  const allGroupsComplete = Object.values(groupPicks).every(g => g.first && g.second)
  const thirdPlaceReady = advancingThirdTeams.length === 8

  if (!allGroupsComplete || !thirdPlaceReady) {
    return (
      <div className="bg-surface rounded-xl border border-border-subtle p-12 text-center shadow-sm">
        <div className="text-4xl mb-4">🏆</div>
        <h2 className="text-xl font-bold text-brand-navy mb-2">Complete Your Group & Third-Place Picks</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          {!allGroupsComplete 
            ? 'Rank all 2 positions (1st, 2nd) for every group to build the knockout bracket.'
            : `Select exactly 8 third-place teams to advance. You have ${advancingThirdTeams.length}/8 selected.`
          }
        </p>
      </div>
    )
  }

  const rounds = [
    { round: 'R32', slots: Array.from({ length: 16 }, (_, i) => i + 1) },
    { round: 'R16', slots: Array.from({ length: 8 }, (_, i) => i + 1) },
    { round: 'QF', slots: Array.from({ length: 4 }, (_, i) => i + 1) },
    { round: 'SF', slots: Array.from({ length: 2 }, (_, i) => i + 1) },
    { round: 'F', slots: [1] },
  ]

  return (
    <div className="space-y-4">
      {/* Scoring Guide */}
      <div className="bg-surface rounded-xl border border-border-subtle p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(ROUND_POINTS).map(([round, pts]) => (
            <div key={round} className="text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{ROUND_NAMES[round]}</div>
              <div className="text-sm font-bold text-brand-navy">{pts} pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bracket Flow */}
      <div className="overflow-x-auto pb-8">
        <div className="flex gap-6 min-w-max px-2">
          {rounds.map(({ round, slots }) => (
            <div key={round} className="flex flex-col items-center">
              <div className="sticky top-0 z-10 mb-3">
                <div className="inline-block bg-brand-navy text-white font-bold px-3 py-1 rounded-full text-[11px] shadow-sm uppercase tracking-wider">
                  {ROUND_NAMES[round]}
                </div>
                <div className="text-center mt-1 text-[9px] text-slate-400 font-mono">
                  {ROUND_POINTS[round]} pts each
                </div>
              </div>

              <div className="flex flex-col gap-2 justify-around flex-1">
                {slots.map(slot => {
                  const matchup = round === 'R32' ? R32_BRACKET.find(m => m.slot === slot) : null
                  let label: string | undefined
                  if (matchup) {
                    const awayText = matchup.awayType === '3rd' ? '3rd' : matchup.awayLabel
                    label = `${matchup.homeLabel} v ${awayText}`
                  }
                  return <MatchCard key={`${round}-${slot}`} round={round} slot={slot} label={label} />
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
