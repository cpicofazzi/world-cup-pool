'use client'

import { useState, useTransition } from 'react'
import { upsertPick } from './actions'

type PickerCardProps = {
  match: any
  initialPick?: string
  isLocked: boolean
  entryId: string
}

export default function PickerCard({ match, initialPick, isLocked, entryId }: PickerCardProps) {
  const [selected, setSelected] = useState<string | undefined>(initialPick)
  const [isPending, startTransition] = useTransition()
  const [errorLine, setErrorLine] = useState<string | null>(null)
  
  const hA = match.team_a || { name: 'TBD', flag_url: '' }
  const hB = match.team_b || { name: 'TBD', flag_url: '' }

  const handleSelection = (result: string) => {
    if (isLocked) return

    setSelected(result)
    setErrorLine(null)
    startTransition(async () => {
      const res = await upsertPick(entryId, match.id, result, match.phase)
      if (res.error) {
        setErrorLine(res.error)
        setSelected(initialPick) // Rollback optimistic update
      }
    })
  }

  const baseBtn = "flex-1 py-3 text-sm font-bold border-y border-slate-700 transition-all flex flex-col items-center justify-center relative overflow-hidden group"
  const getBtnClass = (val: string, rounding: string) => {
    const isSel = selected === val
    const bg = isSel ? 'bg-indigo-600 border-indigo-500 z-10 scale-[1.02] shadow-lg shadow-indigo-500/20 text-white' : 'bg-slate-800/50 hover:bg-slate-700/80 text-slate-400'
    const cur = isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-slate-500'
    return `${baseBtn} ${rounding} ${bg} ${cur}`
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative">
      {isPending && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
        </div>
      )}

      {/* Teams UI */}
      <div className="flex items-center justify-between mb-4 mt-2 px-2">
        <div className="flex flex-col items-center w-5/12">
           <img src={hA.flag_url || 'https://flagcdn.com/w40/un.png'} className="w-10 h-7 rounded shadow object-cover mb-2" />
           <span className="text-xs font-bold text-center">{hA.name}</span>
        </div>
        <div className="text-xs font-black text-slate-600 bg-slate-950 px-2 py-1 rounded">VS</div>
        <div className="flex flex-col items-center w-5/12">
           <img src={hB.flag_url || 'https://flagcdn.com/w40/un.png'} className="w-10 h-7 rounded shadow object-cover mb-2" />
           <span className="text-xs font-bold text-center">{hB.name}</span>
        </div>
      </div>
      
      {/* Knockout Match Descriptions */}
      {!match.team_a && !match.team_b && (
        <div className="text-center text-xs text-amber-500/70 mb-4">{match.description}</div>
      )}

      {/* Buttons */}
      <div className="flex w-full mt-2">
        <button 
          disabled={isLocked || isPending}
          onClick={() => handleSelection('team_a_win')} 
          className={getBtnClass('team_a_win', 'border-l rounded-l-lg')}
        >
          {hA.name.substring(0,3).toUpperCase()} WIN
        </button>
        <button 
          disabled={isLocked || isPending}
          onClick={() => handleSelection('draw')} 
          className={getBtnClass('draw', 'border-x')}
        >
          DRAW
        </button>
        <button 
          disabled={isLocked || isPending}
          onClick={() => handleSelection('team_b_win')} 
          className={getBtnClass('team_b_win', 'border-r rounded-r-lg')}
        >
          {hB.name.substring(0,3).toUpperCase()} WIN
        </button>
      </div>
      
      {errorLine && <p className="text-xs text-red-400 mt-2 text-center">{errorLine}</p>}
      
      {/* Locking overlay */}
      {isLocked && !selected && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
            <span className="bg-red-500/90 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-lg">LOCKED & EMPTY</span>
        </div>
      )}
      {isLocked && selected && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none border-b-2 border-red-500/50 rounded-b-xl"></div>
      )}
    </div>
  )
}
