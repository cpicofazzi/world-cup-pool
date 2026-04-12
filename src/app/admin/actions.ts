'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncTournamentData } from '@/lib/services/footballDataSync'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function toggleUserApproval(userId: string, isApproved: boolean) {
  try {
    const supabase = await checkAdmin()
    await supabase.from('profiles').update({ is_approved: isApproved }).eq('id', userId)
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateAppSettings(formData: FormData) {
  try {
    const supabase = await checkAdmin()
    const phase1Locked = formData.get('phase_1_locked') === 'on'
    const phase2Locked = formData.get('phase_2_locked') === 'on'
    const scoringSystem = formData.get('active_scoring_system') as string

    await supabase.from('app_settings').update({
      phase_1_locked: phase1Locked,
      phase_2_locked: phase2Locked,
      active_scoring_system: scoringSystem
    }).eq('id', 1)

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function saveMatchScore(matchId: string, teamAScore: number, teamBScore: number) {
  try {
    const supabase = await checkAdmin()
    // The PostgreSQL trigger will calculate points automatically once we update these values.
    // We update the score. The trigger logic will infer the result based on the scores.
    const { error } = await supabase.from('matches').update({
      team_a_score: teamAScore,
      team_b_score: teamBScore
    }).eq('id', matchId)

    if (error) throw error
    revalidatePath('/admin/matches')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function triggerDataSync(formData?: FormData) {
  try {
    await checkAdmin();
    const result = await syncTournamentData();
    revalidatePath('/admin');
    return result;
  } catch (err: any) {
    console.error('Sync Error:', err);
    return { error: err.message };
  }
}
