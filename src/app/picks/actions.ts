'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Upsert a group pick — user selects 1st and 2nd place for a group
 */
export async function upsertGroupPick(
  entryId: string, 
  groupLetter: string, 
  firstPlaceTeamId: string | null, 
  secondPlaceTeamId: string | null
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: entry } = await supabase
      .from('entries')
      .select('user_id')
      .eq('id', entryId)
      .single()

    if (entry?.user_id !== user.id) {
      throw new Error('Not authorized to modify this bracket')
    }

    // Check lock status
    const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (settings?.phase_1_locked) {
      throw new Error('Group picks are locked. No more changes allowed.')
    }

    // Validate teams belong to the group
    const teamIds = [firstPlaceTeamId, secondPlaceTeamId].filter(Boolean)
    if (teamIds.length > 0) {
      const { data: validTeams } = await supabase
        .from('teams')
        .select('id, group_letter')
        .in('id', teamIds)

      for (const t of (validTeams || [])) {
        if (t.group_letter !== groupLetter) throw new Error('Team does not belong to this group')
      }
    }

    // Prevent duplicates
    const uniqueIds = new Set(teamIds)
    if (uniqueIds.size !== teamIds.length) {
      throw new Error('Cannot pick the same team for multiple positions')
    }

    // Upsert
    const { error } = await supabase.from('group_picks').upsert({
      entry_id: entryId,
      group_letter: groupLetter,
      first_place_team_id: firstPlaceTeamId,
      second_place_team_id: secondPlaceTeamId,
    }, { onConflict: 'entry_id, group_letter' })

    if (error) {
      console.error('Group pick error:', error)
      throw new Error('Failed to save group pick')
    }

    revalidatePath('/picks')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Save an ordered list of 3rd place teams
 */
export async function setThirdPlacePicks(
  entryId: string,
  orderedTeamIds: (string | null)[]
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: entry } = await supabase
      .from('entries')
      .select('user_id')
      .eq('id', entryId)
      .single()

    if (entry?.user_id !== user.id) {
      throw new Error('Not authorized to modify this bracket')
    }

    const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (settings?.phase_1_locked) {
      throw new Error('Group picks are locked.')
    }

    if (orderedTeamIds.filter(Boolean).length > 8) {
       throw new Error('You can only select up to 8 third-place teams limit.')
    }

    // Delete existing
    await supabase.from('third_place_picks').delete().eq('entry_id', entryId)

    // Insert new
    const inserts = orderedTeamIds
      .map((teamId, index) => teamId ? {
        entry_id: entryId,
        team_id: teamId,
        order_rank: index + 1
      } : null)
      .filter((item): item is NonNullable<typeof item> => item !== null)

    const { error } = await supabase.from('third_place_picks').insert(inserts)

    if (error) {
      console.error('Error inserting 3rd place picks', error)
      throw new Error('Failed to save third-place picks')
    }

    revalidatePath('/picks')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Upsert a bracket pick — user selects a winner for a knockout matchup
 */
export async function upsertBracketPick(
  entryId: string,
  round: string,
  matchSlot: number,
  pickedTeamId: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: entry } = await supabase
      .from('entries')
      .select('user_id')
      .eq('id', entryId)
      .single()

    if (entry?.user_id !== user.id) {
      throw new Error('Not authorized to modify this bracket')
    }

    const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (settings?.phase_2_locked) {
      throw new Error('Bracket picks are locked. No more changes allowed.')
    }

    const { error } = await supabase.from('bracket_picks').upsert({
      entry_id: entryId,
      round,
      match_slot: matchSlot,
      picked_team_id: pickedTeamId,
    }, { onConflict: 'entry_id, round, match_slot' })

    if (error) {
      console.error('Bracket pick error:', error)
      throw new Error('Failed to save bracket pick')
    }

    revalidatePath('/picks')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Clear all bracket picks (used when group/3rd-place picks change)
 */
export async function clearBracketPicks(entryId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const roundOrder = ['R32', 'R16', 'QF', 'SF', 'F']
    for (const round of roundOrder) {
      await supabase
        .from('bracket_picks')
        .delete()
        .eq('entry_id', entryId)
        .eq('round', round)
    }

    revalidatePath('/picks')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Clear all group picks, 3rd-place picks, and bracket picks
 */
export async function clearAllGroupPicks(entryId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: entry } = await supabase
      .from('entries')
      .select('user_id')
      .eq('id', entryId)
      .single()

    if (entry?.user_id !== user.id) {
      throw new Error('Not authorized to modify this bracket')
    }

    const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).single()
    if (settings?.phase_1_locked) {
      throw new Error('Group picks are locked.')
    }

    await supabase.from('group_picks').delete().eq('entry_id', entryId)
    await supabase.from('third_place_picks').delete().eq('entry_id', entryId)
    await supabase.from('bracket_picks').delete().eq('entry_id', entryId)

    revalidatePath('/picks')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
