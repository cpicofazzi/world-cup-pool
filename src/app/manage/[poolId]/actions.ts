'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleEntryApproval(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const poolId = formData.get('pool_id') as string
  const entryId = formData.get('entry_id') as string
  const isApproved = formData.get('is_approved') === 'true'

  if (!poolId || !entryId) return { error: 'Missing logic' }

  // First, verify the current user is the admin of this pool
  const { data: pool } = await supabase
    .from('pools')
    .select('admin_id')
    .eq('id', poolId)
    .single()

  if (pool?.admin_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('pool_entries')
    .update({ is_approved: isApproved })
    .match({ pool_id: poolId, entry_id: entryId })

  if (error) return { error: error.message }
  
  revalidatePath(`/manage/${poolId}`)
}
