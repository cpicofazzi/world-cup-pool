export default function RulesPage() {
  return (
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">Pool Rules</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
            How it works & scoring
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20 pb-20 space-y-8">
        
        {/* HOW IT WORKS */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-8">
          <h2 className="text-xl font-serif font-bold text-brand-navy mb-4">How it works</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Everything you need to know about the pool format. Create a bracket and join an office or friend pool today.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Invite friends to your pool using the generated 6-digit code! You will be the commissioner of your pool and are responsible for collecting any entry fees and approving the users before they pop up on the leaderboard!
          </p>
        </div>

        {/* SCORING */}
        <div className="bg-surface rounded-xl shadow-sm border border-border-subtle p-8">
          <h2 className="text-xl font-serif font-bold text-brand-navy mb-4">Scoring Options</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Commissioners choose between two scoring layouts upon pool creation:
          </p>

          <ul className="list-disc pl-5 space-y-3 text-slate-600 text-sm font-medium">
            <li>
              <strong className="text-brand-navy">Standard Bracket:</strong> Flat +1 point for each correct progression. Very standard format.
            </li>
            <li>
              <strong className="text-brand-navy">Weighted (Upsets):</strong> Heavily favours risky picks! Earning +1.5x points if an underdog advances. Standard point system applies if favourites win.
            </li>
          </ul>
        </div>
        
      </main>
    </div>
  )
}
