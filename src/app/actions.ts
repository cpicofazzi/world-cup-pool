'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function devLogin() {
  const supabase = await createClient()
  const email = 'test@example.com'
  const password = 'password123'
  
  // Step 1: Try to sign in directly
  let { error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) {
    console.log('DevLogin: Sign-in failed, creating account...', error.message)
    // Step 2: If sign-in fails, the account doesn't exist yet — create it
    const { error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { username: 'AdminTester' } }
    })

    if (signUpError) {
      console.error('DevLogin: Signup failed:', signUpError.message)
      redirect('/')
    }

    // Step 3: After signup, sign in to get a proper session
    const { error: retryError } = await supabase.auth.signInWithPassword({ email, password })
    if (retryError) {
      console.error('DevLogin: Retry sign-in failed:', retryError.message)
    }
  }
  
  // Step 4: Promote to admin
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()
    
    if (existingProfile) {
      // Update existing profile — only use columns that exist: role, username
      const { error: updateErr } = await supabase.from('profiles').update({ 
        role: 'admin',
        username: 'AdminTester'
      }).eq('id', user.id)
      if (updateErr) {
        console.error('DevLogin: Profile update failed:', updateErr.message)
      } else {
        console.log('DevLogin: Profile promoted to admin')
      }
    } else {
      // Profile doesn't exist yet (trigger may not have fired)
      const { error: insertErr } = await supabase.from('profiles').insert({ 
        id: user.id, 
        email,
        role: 'admin',
        username: 'AdminTester'
      })
      if (insertErr) {
        console.error('DevLogin: Profile insert failed:', insertErr.message)
      } else {
        console.log('DevLogin: Profile created as admin')
      }
    }
  } else {
    console.error('DevLogin: No user after auth flow!')
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
