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
    <div className="w-full">
      {/* Admin sub-navigation */}
      <div className="bg-slate-50 border-b border-border-subtle">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-navy bg-brand-navy/10 px-3 py-1 rounded-full border border-brand-navy/20">
              Admin Panel
            </span>
            <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-brand-navy transition-colors">
              Match Scores
            </Link>
            <Link href="/admin/settings" className="text-sm font-medium text-slate-600 hover:text-brand-navy transition-colors">
              Settings
            </Link>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-brand-navy border border-border-subtle px-4 py-1.5 rounded transition-colors">
            ← Exit Admin
          </Link>
        </div>
      </div>
      {children}
    </div>
  )
}
