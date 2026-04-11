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
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Global Settings</h1>
        <p className="text-slate-400 mt-2">Manage the state of the pool, locking phases, and scoring formulas.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <form action={updateAppSettings} className="space-y-8">
          
          <div className="space-y-6">
            <h3 className="text-xl font-bold border-b border-slate-800 pb-2">Phase Locking (The Vault)</h3>
            <p className="text-sm text-slate-400">Locking a phase completely disables users from modifying their picks for that phase. The DB RLS policies will reject updates.</p>
            
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <strong className="block text-white mb-1">Lock Phase 1 (Group Stages)</strong>
                <span className="text-sm text-slate-500">Prevents users from touching Phase 1 picks.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="phase_1_locked" defaultChecked={settings.phase_1_locked} className="sr-only peer" />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <strong className="block text-white mb-1">Lock Phase 2 (Knockouts)</strong>
                <span className="text-sm text-slate-500">Prevents users from touching Phase 2 bracket picks.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="phase_2_locked" defaultChecked={settings.phase_2_locked} className="sr-only peer" />
                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500 shadow-inner"></div>
              </label>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-800">
            <h3 className="text-xl font-bold border-b border-slate-800 pb-2">Scoring System Engine</h3>
            
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <label className="block text-white font-bold mb-2">Active Logic Profile</label>
              <select 
                name="active_scoring_system" 
                defaultValue={settings.active_scoring_system}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bracket">Option 1: Standard Bracket (Fixed Round Points)</option>
                <option value="weighted">Option 3: Strategic Weighted (1.5x Multiplier for Underdog Wins)</option>
              </select>
              <p className="text-xs text-amber-500 mt-3 p-3 bg-amber-500/10 rounded border border-amber-500/20">
                Warning: Changing the scoring system only applies to matches finalized AFTER the change is saved. It will not retroactively alter the points earned on already processed games.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
            >
              Save Global Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
