'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertPick(entryId: string, matchId: string, result: string, phase: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership of the entry
    const { data: entry } = await supabase
      .from('entries')
      .select('user_id')
      .eq('id', entryId)
      .single()

    if (entry?.user_id !== user.id) {
      throw new Error('Not authorized to modify this bracket')
    }

    const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (!settings) throw new Error('Settings not found')

    // System-level locking validation
    if (phase === 'group' && settings.phase_1_locked) {
      throw new Error('Phase 1 is officially locked. No more picks.')
    }
    if (phase !== 'group' && settings.phase_2_locked) {
      throw new Error('Phase 2 is officially locked. No more picks.')
    }

    // Attempt to upsert
    const { error } = await supabase.from('picks').upsert({
      entry_id: entryId,
      match_id: matchId,
      predicted_result: result,
      points_bracket: null,
      points_weighted: null
    }, { onConflict: 'entry_id, match_id' })

    if (error) {
      console.error(error)
      throw new Error('DB Error saving pick')
    }

    revalidatePath('/picks')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
