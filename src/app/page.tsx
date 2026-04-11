import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createEntry, createPool, joinPool } from './actions'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signup')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch entries for this user
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Fetch pools this user administers
  const { data: managedPools } = await supabase
    .from('pools')
    .select('*')
    .eq('admin_id', user.id)

  // Fetch pools this user has joined (across all entries)
  const { data: poolMemberships } = await supabase
    .from('pool_entries')
    .select('*, pool:pools(*), entry:entries(*)')
    .in('entry_id', (entries || []).map(e => e.id))

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 relative">
      <div className="max-w-6xl mx-auto mt-10 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-4 sm:mb-0">
            Grand Pool '26
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Welcome, {profile?.username || user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: ENTRIES */}
          <div className="space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700 p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-emerald-400">My Brackets</h2>
              
              {entries && entries.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {entries.map(entry => (
                    <div key={entry.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{entry.name}</p>
                        <p className="text-sm text-slate-400">ID: {entry.id.split('-')[0]}</p>
                      </div>
                      <Link 
                        href={`/picks?entryId=${entry.id}`}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg font-medium transition-all"
                      >
                        Make Picks
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 mb-8">You haven't created any bracket entries yet.</p>
              )}

              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Create New Bracket</h3>
                <form action={createEntry} className="flex gap-2">
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="e.g. My Safe Picks" 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium">
                    Create
                  </button>
                </form>
              </div>
            </div>
            
            {/* MANAGED POOLS */}
            {managedPools && managedPools.length > 0 && (
              <div className="bg-amber-900/20 backdrop-blur-md rounded-3xl border border-amber-700/30 p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 text-amber-500">Commissioner Dashboard</h2>
                <div className="space-y-4">
                  {managedPools.map(pool => (
                    <div key={pool.id} className="bg-slate-900/50 p-4 rounded-xl border border-amber-700/30 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{pool.name}</p>
                        <p className="text-xs text-amber-500">Invite Code: <span className="font-mono text-white bg-slate-800 px-1 rounded">{pool.invite_code}</span></p>
                      </div>
                      <Link 
                        href={`/manage/${pool.id}`}
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium"
                      >
                        Manage Users &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: POOLS */}
          <div className="space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700 p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">My Pools</h2>
              
              {poolMemberships && poolMemberships.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {poolMemberships.map((pm: any) => (
                    <div key={`${pm.pool_id}-${pm.entry_id}`} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-lg">{pm.pool.name}</p>
                          <p className="text-sm text-slate-400">Entered with: {pm.entry.name}</p>
                        </div>
                        {pm.is_approved ? (
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-bold">APPROVED</span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded font-bold">PENDING</span>
                        )}
                      </div>
                      
                      {pm.is_approved ? (
                        <Link 
                          href={`/leaderboard?poolId=${pm.pool_id}`}
                          className="block text-center mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          View Leaderboard
                        </Link>
                      ) : (
                        <div className="mt-4 p-3 bg-slate-800/80 rounded-lg text-sm text-slate-400 border border-slate-700">
                          <p>Approval pending from commissioner.</p>
                          {pm.pool.venmo_handle && (
                            <p className="mt-1">Venmo: <span className="font-bold text-white">{pm.pool.venmo_handle}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 mb-8">You are not participating in any pools.</p>
              )}

              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Join a Pool</h3>
                <form action={joinPool} className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    name="invite_code" 
                    placeholder="6-Digit Invite Code" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    maxLength={6}
                    required
                  />
                  <div className="flex gap-2">
                    <select 
                      name="entry_id"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">-- Select Bracket to Enter --</option>
                      {entries?.map(e => (
                         <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium whitespace-nowrap">
                      Join
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700 p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-4">Host a Pool</h2>
              <p className="text-slate-400 text-sm mb-6">Create a private pool for your friends or office. You control approvlas and verify entry fees.</p>
              
              <form action={createPool} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pool Name</label>
                  <input type="text" name="name" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Your Venmo (Optional)</label>
                  <input type="text" name="venmo" placeholder="@your-handle" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scoring Rules</label>
                  <select name="scoring" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none">
                    <option value="bracket">Standard Bracket (Fixed Points)</option>
                    <option value="weighted">Weighted (1.5x Upsets)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-bold mt-2">
                  Create Pool
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
