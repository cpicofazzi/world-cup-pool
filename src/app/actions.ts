'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function devLogin() {
  const supabase = await createClient()
  const email = 'test@example.com'
  const password = 'password123'
  
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // If signin fails, sign them up
    const { data } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { username: 'AdminTester' } }
    })
    if (data?.user) {
       // Optional: force approval using service_role if available, but for now normal RLS allows user to update their own profile
       // Just auto approve and promote to admin
       await supabase.from('profiles').update({ is_approved: true, role: 'admin' }).eq('id', data.user.id)
    }
  }
  redirect('/')
}

export async function createEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const name = formData.get('name') as string
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('entries')
    .insert({ user_id: user.id, name })

  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function createPool(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const name = formData.get('name') as string
  const venmo = formData.get('venmo') as string
  const scoring = formData.get('scoring') as string
  if (!name) return { error: 'Name is required' }

  // Generate random 6 char invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { error } = await supabase
    .from('pools')
    .insert({
      admin_id: user.id,
      name,
      venmo_handle: venmo || null,
      invite_code: inviteCode,
      scoring_system: scoring
    })

  if (error) return { error: error.message }
  revalidatePath('/')
}

export async function joinPool(formData: FormData) {
  const supabase = await createClient()
  
  const inviteCode = formData.get('invite_code') as string
  const entryId = formData.get('entry_id') as string

  if (!inviteCode || !entryId) return { error: 'Invite code and entry selection required' }

  // 1. Find pool
  const { data: pool, error: poolErr } = await supabase
    .from('pools')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (poolErr || !pool) return { error: 'Invalid invite code' }

  // 2. Join
  const { error: joinErr } = await supabase
    .from('pool_entries')
    .insert({
      pool_id: pool.id,
      entry_id: entryId,
      is_approved: false
    })

  if (joinErr) {
    if (joinErr.code === '23505') return { error: 'This entry is already in that pool' }
    return { error: joinErr.message }
  }

  revalidatePath('/')
}
