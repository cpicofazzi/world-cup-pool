import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { createEntry, createPool, joinPool, devLogin } from './actions'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12">
        <div className="z-10 text-center max-w-4xl mx-auto">
          <p className="text-xl md:text-2xl text-slate-600 mb-12 font-serif italic">
            The ultimate 2026 World Cup Bracket platform. Secure your brackets, challenge friends in private pools, and follow the live global leaderboard.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-brand-navy hover:bg-brand-navy/90 text-white font-bold rounded shadow-md text-lg transition-transform transform hover:-translate-y-0.5">
              Create your Bracket
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded shadow-sm border border-slate-200 text-lg transition-transform transform hover:-translate-y-0.5">
              Sign In
            </Link>
          </div>

          <div className="mt-16 text-slate-500">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">View Public Data</h3>
            <div className="flex justify-center flex-wrap gap-4">
               <Link href="/leaderboard?poolId=example" className="text-brand-green hover:underline font-medium">
                  &rarr; See an example Pool Leaderboard
               </Link>
            </div>
          </div>

          <div className="mt-16 sm:mt-24 inline-block bg-slate-50 p-6 rounded-xl border border-border-subtle shadow-sm">
            <h4 className="text-brand-navy font-bold text-sm tracking-widest uppercase mb-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
              Auto Test Login
            </h4>
            <p className="text-slate-500 text-sm mb-4 max-w-xs">Bypass the auth flow instantly to test platform functionality with an admin account.</p>
            <form action={async (formData) => {
              'use server'
              await devLogin()
            }}>
              <button type="submit" className="w-full px-6 py-3 bg-brand-green text-brand-navy hover:bg-brand-green/90 font-black rounded shadow-sm transition-transform active:scale-95 uppercase tracking-wider">
                ⚡ Login as Admin Tester
              </button>
            </form>
          </div>
        </div>
      </div>
    )
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
    <div className="p-4 md:p-8 relative">
      <div className="max-w-6xl mx-auto mt-4 relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-border-subtle pb-4">
          <h2 className="text-2xl font-serif font-bold text-brand-navy">
            Welcome, {profile?.username || user.email}
          </h2>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {profile?.role === 'admin' && (
               <Link href="/admin" className="px-3 py-1.5 bg-brand-navy/10 text-brand-navy rounded text-sm font-bold border border-brand-navy/20 hover:bg-brand-navy/20 transition-colors">
                 Admin Dashboard
               </Link>
            )}
            <form action="/auth/signout" method="post">
              <button className="px-4 py-1.5 bg-white hover:bg-slate-50 rounded text-sm font-medium transition-colors border border-border-subtle shadow-sm text-slate-700">
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: ENTRIES & DASHBOARDS */}
          <div className="space-y-8">
            <div className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-brand-navy flex border-b border-border-subtle pb-2">My Brackets</h2>
              
              {entries && entries.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {entries.map(entry => (
                    <div key={entry.id} className="bg-background p-4 rounded-lg border border-border-subtle flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg text-brand-navy">{entry.name}</p>
                        <p className="text-xs text-slate-500 font-mono">ID: {entry.id.split('-')[0]}</p>
                      </div>
                      <Link 
                        href={`/picks?entryId=${entry.id}`}
                        className="bg-brand-navy text-white hover:bg-brand-navy/90 px-4 py-2 rounded text-sm font-bold transition-all shadow-sm"
                      >
                        Make Picks
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 mb-6 text-sm">You haven't created any bracket entries yet.</p>
              )}

              <div className="bg-background p-4 rounded-lg border border-border-subtle">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Create New Bracket</h3>
                <form action={async (formData) => {
                  'use server'
                  await createEntry(formData)
                }} className="flex gap-2">
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="e.g. My Safe Picks" 
                    className="flex-1 bg-white border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-navy"
                    required
                  />
                  <button type="submit" className="bg-brand-green hover:bg-brand-green/90 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">
                    Create
                  </button>
                </form>
              </div>
            </div>
            
            {/* MANAGED POOLS */}
            {managedPools && managedPools.length > 0 && (
              <div className="bg-surface rounded-xl border border-amber-200 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                <h2 className="text-xl font-bold mb-6 text-amber-900 flex border-b border-amber-100 pb-2">Commissioner Dashboard</h2>
                <div className="space-y-3">
                  {managedPools.map(pool => (
                    <div key={pool.id} className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-amber-950">{pool.name}</p>
                        <p className="text-xs text-amber-700 mt-1">Invite Code: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200 ml-1">{pool.invite_code}</span></p>
                      </div>
                      <Link 
                        href={`/manage/${pool.id}`}
                        className="text-amber-700 hover:text-amber-900 hover:underline text-sm font-bold"
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
            <div className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-brand-navy flex border-b border-border-subtle pb-2">My Pools</h2>
              
              {poolMemberships && poolMemberships.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {poolMemberships.map((pm: any) => (
                    <div key={`${pm.pool_id}-${pm.entry_id}`} className="bg-background p-4 rounded-lg border border-border-subtle">
                      <div className="flex justify-between items-start mb-3 border-b border-border-subtle pb-3">
                        <div>
                          <p className="font-bold text-lg text-brand-navy">{pm.pool.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Entered with: <span className="font-medium text-slate-700">{pm.entry.name}</span></p>
                        </div>
                        {pm.is_approved ? (
                          <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">APPROVED</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">PENDING</span>
                        )}
                      </div>
                      
                      {pm.is_approved ? (
                        <Link 
                          href={`/leaderboard?poolId=${pm.pool_id}`}
                          className="block text-center w-full bg-brand-navy hover:bg-brand-navy/90 text-white px-4 py-2 rounded text-sm font-bold transition-colors shadow-sm"
                        >
                          View Leaderboard
                        </Link>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded border border-amber-100 text-xs text-amber-800">
                          <p className="font-medium">Approval pending from commissioner.</p>
                          {pm.pool.venmo_handle && (
                            <p className="mt-1">Venmo: <span className="font-bold">{pm.pool.venmo_handle}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 mb-6 text-sm">You are not participating in any pools.</p>
              )}

              <div className="bg-background p-4 rounded-lg border border-border-subtle">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Join a Pool</h3>
                <form action={async (formData) => {
                  'use server'
                  await joinPool(formData)
                }} className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    name="invite_code" 
                    placeholder="6-Digit Invite Code" 
                    className="w-full bg-white border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-navy font-mono uppercase"
                    maxLength={6}
                    required
                  />
                  <div className="flex gap-2">
                    <select 
                      name="entry_id"
                      className="flex-1 bg-white border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-navy text-slate-700"
                      required
                    >
                      <option value="">Select Bracket</option>
                      {entries?.map(e => (
                         <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="bg-brand-navy hover:bg-brand-navy/90 text-white px-4 py-2 rounded text-sm font-bold shadow-sm whitespace-nowrap">
                      Join
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-2 text-brand-navy">Host a Pool</h2>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed">Create a private pool for your friends or office. You control approvals and verify entry fees.</p>
              
              <form action={async (formData) => {
                'use server'
                await createPool(formData)
              }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pool Name</label>
                  <input type="text" name="name" className="w-full bg-white border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-navy" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Venmo (Optional)</label>
                  <input type="text" name="venmo" placeholder="@your-handle" className="w-full bg-white border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-navy" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scoring Rules</label>
                  <select name="scoring" className="w-full bg-white border border-border-subtle rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-navy text-slate-700">
                    <option value="bracket">Standard Bracket (Fixed Points)</option>
                    <option value="weighted">Weighted (1.5x Upsets)</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded text-sm font-bold mt-2 shadow-sm">
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
