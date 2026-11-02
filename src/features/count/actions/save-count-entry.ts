'use server'

import { revalidatePath } from 'next/cache'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface SaveCountEntryResult {
  error?: string
  success?: true
}

export async function saveCountEntry(itemId: string, quantity: number): Promise<SaveCountEntryResult> {
  if (!itemId || !Number.isFinite(quantity) || quantity < 0) {
    return { error: 'Enter a valid quantity before saving.' }
  }

  const supabase = createServerSupabaseClient()
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id')
    .eq('id', itemId)
    .eq('is_inventory_item', true)
    .maybeSingle()

  if (itemError || !item) return { error: 'This inventory item could not be found.' }

  const { data: existingSession, error: sessionLookupError } = await supabase
    .from('inventory_count_sessions')
    .select('id')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionLookupError) return { error: 'The active count could not be loaded.' }

  let sessionId = existingSession?.id
  if (!sessionId) {
    const { data: newSession, error: sessionCreateError } = await supabase
      .from('inventory_count_sessions')
      .insert({ status: 'in_progress' })
      .select('id')
      .single()

    if (sessionCreateError) return { error: 'A new count session could not be started.' }
    sessionId = newSession.id
  }

  const { error: entryError } = await supabase
    .from('inventory_count_entries')
    .upsert(
      {
        session_id: sessionId,
        item_id: itemId,
        quantity,
        counted_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,item_id' },
    )

  if (entryError) return { error: 'The count could not be saved. Please try again.' }

  revalidatePath('/count')
  return { success: true }
}
