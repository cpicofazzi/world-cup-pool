import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signup')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              FIFA Match Control
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">Match Score Entry</Link>
              <Link href="/admin/settings" className="text-slate-400 hover:text-white transition-colors">Global Lock Settings</Link>
            </div>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-white border border-slate-700 px-4 py-2 rounded-lg transition-colors">
            Exit Admin
          </Link>
        </div>
      </nav>
      {/* Mobile nav fallback if needed can be added later */}
      <main className="flex-grow p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
