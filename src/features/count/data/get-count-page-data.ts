import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

import type { CountLocationsPageData, CountPageData } from '../types'

async function getActiveSessionId() {
  const supabase = createServerSupabaseClient()
  const { data: session, error: sessionError } = await supabase
    .from('inventory_count_sessions')
    .select('id')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) throw new Error(`Could not load the active count: ${sessionError.message}`)
  return session?.id ?? null
}

export async function getCountLocationsPageData(): Promise<CountLocationsPageData> {
  const supabase = createServerSupabaseClient()
  const [{ data: locations, error: locationsError }, { data: items, error: itemsError }, sessionId] = await Promise.all([
    supabase
      .from('storage_locations')
      .select('id, name, slug')
      .order('display_order'),
    supabase
      .from('inventory_overview')
      .select('item_id, storage_location_id'),
    getActiveSessionId(),
  ])

  if (locationsError) throw new Error(`Could not load storage locations: ${locationsError.message}`)
  if (itemsError) throw new Error(`Could not load inventory locations: ${itemsError.message}`)

  let countedItemIds = new Set<string>()
  if (sessionId) {
    const { data: entries, error: entriesError } = await supabase
      .from('inventory_count_entries')
      .select('item_id')
      .eq('session_id', sessionId)

    if (entriesError) throw new Error(`Could not load count progress: ${entriesError.message}`)
    countedItemIds = new Set(entries.map((entry) => entry.item_id))
  }

  return {
    locations: locations.map((location) => {
      const locationItems = items.filter((item) => item.storage_location_id === location.id)

      return {
        id: location.id,
        name: location.name,
        slug: location.slug,
        countedItems: locationItems.filter((item) => countedItemIds.has(item.item_id)).length,
        totalItems: locationItems.length,
      }
    }),
    unassignedItemCount: items.filter((item) => item.storage_location_id === null).length,
  }
}

export async function getCountPageData(locationSlug: string): Promise<CountPageData | null> {
  const supabase = createServerSupabaseClient()
  const { data: location, error: locationError } = await supabase
    .from('storage_locations')
    .select('id, name, slug')
    .eq('slug', locationSlug)
    .maybeSingle()

  if (locationError) throw new Error(`Could not load storage location: ${locationError.message}`)
  if (!location) return null

  const [{ data: items, error: itemsError }, sessionId] = await Promise.all([
    supabase
      .from('inventory_overview')
      .select('item_id, description, pack_size, unit_size, par_level, vendor_name')
      .eq('storage_location_id', location.id)
      .order('description'),
    getActiveSessionId(),
  ])

  if (itemsError) throw new Error(`Could not load count items: ${itemsError.message}`)

  let countedItemIds: string[] = []
  if (sessionId && items.length > 0) {
    const { data: entries, error: entriesError } = await supabase
      .from('inventory_count_entries')
      .select('item_id')
      .eq('session_id', sessionId)
      .in('item_id', items.map((item) => item.item_id))

    if (entriesError) throw new Error(`Could not load count progress: ${entriesError.message}`)
    countedItemIds = entries.map((entry) => entry.item_id)
  }

  return {
    countedItemIds,
    location,
    items: items.map((item) => ({
      id: item.item_id,
      description: item.description,
      packSize: item.pack_size,
      unitSize: item.unit_size,
      parLevel: item.par_level === null ? null : Number(item.par_level),
      vendorName: item.vendor_name,
    })),
  }
}
