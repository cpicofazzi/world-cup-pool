import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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

  if (!profile?.is_approved) {
    redirect('/payment-pending')
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto mt-10">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
            Grand Pool '26
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Welcome, {profile.username || user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl border border-slate-700 p-10 mt-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">You're in!</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Your entry has been approved. Phase 3 (The Picking Engine) is under construction. Check back soon when the pools open.
          </p>
          
          <button className="px-8 py-3 bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-not-allowed border border-slate-600">
            Make Picks (Locked)
          </button>
        </div>
      </div>
    </div>
  )
}
