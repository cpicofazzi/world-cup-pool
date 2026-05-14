export default function RulesPage() {
  return (
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">Pool Rules</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
            How it works &amp; scoring
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20 pb-20 space-y-8">
        
        {/* HOW IT WORKS */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-8">
          <h2 className="text-xl font-serif font-bold text-brand-navy mb-4">How it works</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Create a bracket entry and make your predictions in two phases. 
            First, rank the top 3 teams in each group and pick which 3rd-place teams advance. 
            Then, fill out the 32-team knockout bracket. Join pools with invite codes!
          </p>
        </div>

        {/* PHASE 1 */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-navy text-white text-sm font-bold">1</span>
            <h2 className="text-xl font-serif font-bold text-brand-navy">Phase 1: Group & Third-Place Picks</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            For each of the <strong>12 groups</strong>, rank the top 3 teams (1st, 2nd, 3rd). 
            Then select which <strong>8 of 12</strong> third-place teams will advance to the knockout stage.
          </p>

          <div className="bg-slate-50 rounded-lg p-5 border border-border-subtle mb-4">
            <h3 className="text-sm font-bold text-brand-navy mb-3 uppercase tracking-wider">Group Scoring</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-brand-navy text-white text-xs font-bold">+1</span>
                <span>Correctly picking a team that finishes in the top 2</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-brand-green text-white text-xs font-bold">+1</span>
                <span>Bonus for getting their exact position right (1st vs 2nd)</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-lg p-5 border border-amber-200/50 mb-4">
            <h3 className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-wider">Third-Place Scoring</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-amber-500 text-white text-xs font-bold">+1</span>
                <span>For each correct third-place team that advances (max 8)</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-brand-navy/5 rounded-lg">
              <div className="text-lg font-bold text-brand-navy">48 pts</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Max Groups (12×4)</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="text-lg font-bold text-amber-600">8 pts</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Max 3rd Place</div>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-lg">
              <div className="text-lg font-bold text-brand-gold">56 pts</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Phase 1 Total</div>
            </div>
          </div>
        </div>

        {/* PHASE 2 */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-green text-white text-sm font-bold">2</span>
            <h2 className="text-xl font-serif font-bold text-brand-navy">Phase 2: Knockout Bracket</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Your group predictions populate the 32-team knockout bracket (based on official FIFA pairings). 
            Pick the winner of each match from <strong>Round of 32</strong> to the <strong>Final</strong>. 
            Points increase each round.
          </p>

          <div className="bg-slate-50 rounded-lg p-5 border border-border-subtle mb-4">
            <h3 className="text-sm font-bold text-brand-navy mb-3 uppercase tracking-wider">Points Per Round</h3>
            <div className="space-y-2">
              {[
                { round: 'Round of 32', pts: 2, matches: 16, total: 32 },
                { round: 'Round of 16', pts: 3, matches: 8, total: 24 },
                { round: 'Quarter-Finals', pts: 5, matches: 4, total: 20 },
                { round: 'Semi-Finals', pts: 8, matches: 2, total: 16 },
                { round: 'Final', pts: 13, matches: 1, total: 13 },
              ].map(r => (
                <div key={r.round} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">{r.round}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-xs font-mono">{r.matches} match{r.matches > 1 ? 'es' : ''}</span>
                    <span className="font-bold text-brand-navy w-16 text-right">{r.pts} pts</span>
                    <span className="text-brand-green font-bold w-16 text-right">{r.total} max</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-brand-gold/10 rounded-lg border border-brand-gold/20">
            <span className="text-sm font-bold text-brand-navy">Knockout Total</span>
            <span className="text-xl font-black text-brand-gold">105 pts max</span>
          </div>
        </div>

        {/* GRAND TOTAL */}
        <div className="bg-brand-navy rounded-xl shadow-md p-8 text-center">
          <h2 className="text-sm font-mono font-bold text-brand-green uppercase tracking-widest mb-2">Grand Total</h2>
          <div className="text-5xl font-black text-brand-gold mb-2">161</div>
          <div className="text-sm text-slate-400 font-mono uppercase tracking-wider">Maximum Possible Points</div>
          <div className="mt-4 flex justify-center gap-6 text-slate-400 text-xs font-mono">
            <span>48 groups</span>
            <span>+</span>
            <span>8 third-place</span>
            <span>+</span>
            <span>105 knockout</span>
          </div>
        </div>
        
      </main>
    </div>
  )
}
