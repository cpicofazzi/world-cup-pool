import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { toggleEntryApproval } from './actions'

export default async function ManagePool({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signup')

  // Verify ownership
  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single()

  if (!pool || pool.admin_id !== user.id) {
    redirect('/')
  }

  // Get all entries that have joined this pool
  const { data: entrants } = await supabase
    .from('pool_entries')
    .select(`
      is_approved,
      created_at,
      entry_id,
      entries (
        name,
        profiles (
          username,
          email
        )
      )
    `)
    .eq('pool_id', poolId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto mt-10">
        
        <header className="mb-10">
          <Link href="/" className="text-amber-500 hover:text-amber-400 text-sm font-medium mb-4 inline-block">&larr; Back to Dashboard</Link>
          <div className="flex justify-between items-end border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-amber-500 mb-2">{pool.name}</h1>
              <p className="text-slate-400">Commissioner Settings</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Invite Code</p>
              <p className="text-2xl font-mono bg-slate-800 px-3 py-1 rounded inline-block mt-1">{pool.invite_code}</p>
            </div>
          </div>
        </header>

        <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700 p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Manage Entrants</h2>
            <div className="text-sm px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-400 mb-2">
              Scoring Rule: <span className="text-white font-bold">{pool.scoring_system === 'weighted' ? 'Weighted (1.5x Upsets)' : 'Standard Bracket'}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900 text-slate-300 font-medium border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">User</th>
                  <th className="px-4 py-3">Bracket Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {entrants && entrants.length > 0 ? (
                  entrants.map((p: any) => (
                    <tr key={p.entry_id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-white">{p.entries.profiles?.username || p.entries.profiles?.email}</td>
                      <td className="px-4 py-4">{p.entries.name}</td>
                      <td className="px-4 py-4">
                        {p.is_approved ? (
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 flex w-max py-1 rounded text-xs font-bold ring-1 ring-emerald-500/30">APPROVED</span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-400 px-2 flex w-max py-1 rounded text-xs font-bold ring-1 ring-amber-500/30">PENDING</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <form action={async (formData) => {
                          'use server'
                          await toggleEntryApproval(formData)
                        }}>
                          <input type="hidden" name="pool_id" value={poolId} />
                          <input type="hidden" name="entry_id" value={p.entry_id} />
                          <input type="hidden" name="is_approved" value={p.is_approved ? 'false' : 'true'} />
                          <button 
                            type="submit" 
                            className={`px-3 py-1.5 rounded font-medium text-xs transition-colors ${
                              p.is_approved 
                                ? 'bg-slate-700 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300' 
                                : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-500 border border-amber-500/30'
                            }`}
                          >
                            {p.is_approved ? 'Revoke Access' : 'Approve Payment'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No one has joined this pool yet. Send them your invite code: <span className="font-mono text-white">{pool.invite_code}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
