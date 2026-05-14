'use client'

import { useState, useTransition } from 'react'
import { upsertGroupPick } from './actions'

interface Team {
  id: string
  name: string
  flag_url: string | null
  tla: string
  group_letter: string
}

interface GroupPickerProps {
  groupLetter: string
  teams: Team[]
  entryId: string
  initialFirst: string | null
  initialSecond: string | null
  isLocked: boolean
  onGroupPickChange?: (group: string, first: string | null, second: string | null) => void
}

export default function GroupPicker({ 
  groupLetter, teams, entryId, initialFirst, initialSecond, isLocked, onGroupPickChange 
}: GroupPickerProps) {
  const [firstPlace, setFirstPlace] = useState<string | null>(initialFirst)
  const [secondPlace, setSecondPlace] = useState<string | null>(initialSecond)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleTeamClick = (teamId: string) => {
    if (isLocked || isPending) return
    setError(null)

    let newFirst = firstPlace
    let newSecond = secondPlace

    if (teamId === firstPlace) {
      // Deselect 1st
      newFirst = null
    } else if (teamId === secondPlace) {
      // Deselect 2nd
      newSecond = null
    } else if (!firstPlace) {
      newFirst = teamId
    } else if (!secondPlace) {
      newSecond = teamId
    } else {
      // Both slots filled — replace 2nd
      newSecond = teamId
    }

    setFirstPlace(newFirst)
    setSecondPlace(newSecond)
    onGroupPickChange?.(groupLetter, newFirst, newSecond)

    startTransition(async () => {
      const res = await upsertGroupPick(entryId, groupLetter, newFirst, newSecond)
      if (res.error) {
        setError(res.error)
        setFirstPlace(initialFirst)
        setSecondPlace(initialSecond)
      }
    })
  }

  const getTeamState = (teamId: string): '1st' | '2nd' | null => {
    if (teamId === firstPlace) return '1st'
    if (teamId === secondPlace) return '2nd'
    return null
  }

  const isComplete = firstPlace !== null && secondPlace !== null

  const positionConfig = {
    '1st': { label: 'Winner', badge: 'bg-brand-navy text-white', tag: 'bg-brand-navy/10 text-brand-navy', num: '1' },
    '2nd': { label: 'Runner-up', badge: 'bg-brand-green text-white', tag: 'bg-brand-green/10 text-brand-green', num: '2' },
  }

  return (
    <div className={`bg-surface rounded-xl border overflow-hidden shadow-sm transition-all ${
      isComplete ? 'border-brand-green/40' : 'border-border-subtle'
    }`}>
      {/* Group Header */}
      <div className="bg-brand-navy px-5 py-3 flex justify-between items-center">
        <h3 className="text-sm font-bold text-brand-gold tracking-widest uppercase font-mono">
          Group {groupLetter}
        </h3>
        <div className="flex items-center gap-2">
          {isComplete && (
            <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">✓</span>
          )}
          {isPending && (
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-5 py-2 bg-slate-50 border-b border-border-subtle">
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Rank top 2 • Click to assign 1st → 2nd
        </p>
      </div>

      {/* Team List */}
      <div className="divide-y divide-border-subtle">
        {teams.map(team => {
          const state = getTeamState(team.id)
          const config = state ? positionConfig[state] : null
          
          return (
            <button
              key={team.id}
              onClick={() => handleTeamClick(team.id)}
              disabled={isLocked || isPending}
              className={`w-full flex items-center px-5 py-3 transition-all text-left ${
                isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
              } ${
                state === '1st' ? 'bg-brand-navy/5 hover:bg-brand-navy/10'
                : state === '2nd' ? 'bg-brand-green/5 hover:bg-brand-green/10'
                : 'hover:bg-slate-50'
              }`}
            >
              {/* Position Badge */}
              <div className="w-7 flex-shrink-0">
                {config ? (
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${config.badge}`}>
                    {config.num}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-dashed border-slate-300" />
                )}
              </div>

              {/* Flag + Name */}
              <div className="flex items-center gap-3 flex-1 ml-2">
                {team.flag_url ? (
                  <img src={team.flag_url} alt={team.name} className="w-7 h-5 rounded-sm object-cover border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-7 h-5 rounded-sm bg-slate-100 border border-slate-200" />
                )}
                <span className={`text-sm font-bold ${state ? 'text-brand-navy' : 'text-slate-600'}`}>
                  {team.name}
                </span>
              </div>

              {/* Label */}
              {config && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${config.tag}`}>
                  {config.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
