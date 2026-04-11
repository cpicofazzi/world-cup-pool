import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function PaymentPendingPage() {
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

  if (profile?.is_approved) {
    redirect('/')
  }

  async function submitVenmoHandle(formData: FormData) {
    'use server'
    const handle = formData.get('venmo_handle') as string
    
    if (handle) {
      const supabaseServer = await createClient()
      const { data: { user } } = await supabaseServer.auth.getUser()
      if (user) {
         await supabaseServer
          .from('profiles')
          .update({ venmo_handle: handle })
          .eq('id', user.id)
      }
      revalidatePath('/payment-pending')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-amber-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl p-8 z-10 text-center">
        <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Pending Approval</h1>
        <p className="text-slate-300 mb-8">
          Your entry has been created! To unlock your picks, please send the entry fee to the pool commissioner.
        </p>

        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 mb-8 text-left">
          <p className="text-sm text-slate-400 mb-1">Commissioner Venmo Link</p>
          <a 
            href="#" // Add real Venmo link based on admin preference
            target="_blank" 
            rel="noopener noreferrer"
            className="text-2xl font-bold text-teal-400 hover:text-teal-300 transition-colors"
          >
            @Commissioner-Venmo
          </a>
          <p className="text-xs text-slate-500 mt-2">Please include your Pool Username ("{profile?.username || 'Your pool alias'}") in the transaction description.</p>
        </div>

        {profile?.venmo_handle ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-400 font-medium">Handle submitted: {profile.venmo_handle}</p>
            <p className="text-sm text-emerald-500/80 mt-1">We are verifying your transaction. You will be granted access shortly.</p>
          </div>
        ) : (
          <form action={submitVenmoHandle} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="venmo_handle">Confirm your Venmo handle</label>
              <input 
                id="venmo_handle" 
                name="venmo_handle" 
                type="text" 
                required 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="@your-handle" 
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5"
            >
              Submit Verification
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
