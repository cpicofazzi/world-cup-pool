import { createClient } from '@/utils/supabase/server'
import { updateAppSettings } from '../actions'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // Fetch current settings
  const { data: settings, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    return <div className="p-8 text-red-500">Failed to load settings: {error.message}</div>
  }

  return (
    <div className="bg-background text-foreground font-sans w-full min-h-screen">
      
      <div className="bg-brand-navy border-b border-brand-green/30 pt-10 pb-16 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <p className="text-brand-green font-mono text-xs font-bold tracking-widest mb-2 uppercase">2026 WORLD CUP</p>
          <h1 className="text-4xl font-serif font-bold text-brand-gold mb-2">Global Settings</h1>
          <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">
            Manage the state of the pool, locking phases, and scoring formulas
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-0 -mt-8 relative z-20 pb-20">
        <div className="bg-surface border border-border-subtle rounded-xl p-8 shadow-sm">
          <form action={async (formData) => {
            'use server'
            await updateAppSettings(formData)
          }} className="space-y-8">
            
            <div className="space-y-6">
              <h3 className="text-xl font-serif font-bold border-b border-border-subtle pb-2 text-brand-navy">Phase Locking (The Vault)</h3>
              <p className="text-sm text-slate-600">Locking a phase completely disables users from modifying their picks for that phase. The DB RLS policies will reject updates.</p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border-subtle">
                <div>
                  <strong className="block text-brand-navy mb-1">Lock Phase 1 (Group Stages)</strong>
                  <span className="text-sm text-slate-500">Prevents users from touching Phase 1 picks.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="phase_1_locked" defaultChecked={settings.phase_1_locked} className="sr-only peer" />
                  <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border-subtle">
                <div>
                  <strong className="block text-brand-navy mb-1">Lock Phase 2 (Knockouts)</strong>
                  <span className="text-sm text-slate-500">Prevents users from touching Phase 2 bracket picks.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="phase_2_locked" defaultChecked={settings.phase_2_locked} className="sr-only peer" />
                  <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
                </label>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-border-subtle">
              <h3 className="text-xl font-serif font-bold border-b border-border-subtle pb-2 text-brand-navy">Scoring System Engine</h3>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-border-subtle">
                <label className="block text-brand-navy font-bold mb-2">Active Logic Profile</label>
                <select 
                  name="active_scoring_system" 
                  defaultValue={settings.active_scoring_system}
                  className="w-full bg-white border border-border-subtle text-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-navy"
                >
                  <option value="bracket">Option 1: Standard Bracket (Fixed Round Points)</option>
                  <option value="weighted">Option 2: Strategic Weighted (1.5x Multiplier for Underdog Wins)</option>
                </select>
                <p className="text-xs text-amber-700 mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                  Warning: Changing the scoring system only applies to matches finalized AFTER the change is saved. It will not retroactively alter the points earned on already processed games.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                className="w-full sm:w-auto px-8 py-3 bg-brand-navy hover:bg-brand-navy/90 text-white font-bold rounded-xl transition-all shadow-sm"
              >
                Save Global Configuration
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
