import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

import type { CountPageData } from '../types'

export async function getCountPageData(): Promise<CountPageData> {
  const supabase = createServerSupabaseClient()
  const [{ data: vendors, error: vendorsError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from('vendors').select('id, name'),
    supabase
      .from('items')
      .select('id, description, pack_size, unit_size, par_level, vendor_id')
      .eq('is_inventory_item', true)
      .order('description'),
  ])

  if (vendorsError) throw new Error(`Could not load vendors: ${vendorsError.message}`)
  if (itemsError) throw new Error(`Could not load count items: ${itemsError.message}`)

  const { data: session, error: sessionError } = await supabase
    .from('inventory_count_sessions')
    .select('id')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) throw new Error(`Could not load the active count: ${sessionError.message}`)

  let countedItemIds: string[] = []
  if (session) {
    const { data: entries, error: entriesError } = await supabase
      .from('inventory_count_entries')
      .select('item_id')
      .eq('session_id', session.id)

    if (entriesError) throw new Error(`Could not load count progress: ${entriesError.message}`)
    countedItemIds = entries.map((entry) => entry.item_id)
  }

  const vendorNames = new Map(vendors.map((vendor) => [vendor.id, vendor.name]))

  return {
    countedItemIds,
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      packSize: item.pack_size,
      unitSize: item.unit_size,
      parLevel: item.par_level === null ? null : Number(item.par_level),
      vendorName: vendorNames.get(item.vendor_id) ?? 'Unknown vendor',
    })),
  }
}
