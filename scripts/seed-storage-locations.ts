import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
config({ quiet: true })

const STORAGE_ASSIGNMENTS = {
  wic: [
    '7198305', // Apple Granny Smith
    '5142072', // Baby arugula
    '3937818', // Fresh avocado halves
    '3879962', // Fresh carrots
    '0746420', // Brie
    '4452183', // Goat cheese
    '0296202', // Swiss cheese
    '2449858', // Chicken breast
    '2219095', // Fresh cilantro
    '7157088', // Fresh cucumber
    '2840155', // Fresh egg yolk
    '7289542', // Fresh lemon
    '1675909', // Fresh green leaf lettuce
    '4109080', // Milk drink
    '7350788', // Green onion
    '7157085', // Fresh red pepper
    '2814465', // Smoked salmon
    '5363744', // Sour cream
    '2303063', // Fresh alfalfa sprouts
    '3179058', // Cherry tomato
    '5418132', // Roma tomato
    '5527084', // Whipped cream
    '8199176', // Smoked turkey breast
  ],
  freezer: [
    '8247403', // Frozen bacon
    '1157807', // IQF banana slices
    '7264851', // IQF banana slices
    '2586970', // Frozen croissant
  ],
  'dry-goods': [
    '5491677', // Capers
    '0349555', // Vanilla extract
    '9665589', // Flour
    '5501459', // Balsamic glaze
    '7296319', // Canola oil
    '7247362', // Pan coating
    '5577480', // Roasted peanuts
    '4780559', // Peanut butter
    '7232804', // Cinnamon
    '7232838', // Cumin
    '7232887', // Garlic powder
    '9887944', // Nutmeg
    '7232895', // Granulated onion
    '8451619', // Cayenne pepper
    '9658352', // Ground chipotle pepper
    '4431823', // Apple cider vinegar
    '0068460', // Red wine vinegar
  ],
} as const

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function validateAssignments() {
  const seenItemNumbers = new Set<string>()

  for (const [slug, itemNumbers] of Object.entries(STORAGE_ASSIGNMENTS)) {
    for (const itemNumber of itemNumbers) {
      if (seenItemNumbers.has(itemNumber)) {
        throw new Error(`Item ${itemNumber} is assigned to more than one storage location.`)
      }

      seenItemNumbers.add(itemNumber)
    }

  }

  return [...seenItemNumbers]
}

async function main() {
  const apply = process.argv.includes('--apply')
  const assignedItemNumbers = validateAssignments()
  const supabase = createClient(
    requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnvironmentVariable('SUPABASE_SECRET_KEY'),
  )

  const [{ data: locations, error: locationsError }, { data: items, error: itemsError }] = await Promise.all([
    supabase
      .from('storage_locations')
      .select('id, name, slug')
      .in('slug', Object.keys(STORAGE_ASSIGNMENTS)),
    supabase
      .from('items')
      .select('id, sysco_item_number, description, storage_location_id')
      .eq('is_inventory_item', true),
  ])

  if (locationsError) throw locationsError
  if (itemsError) throw itemsError

  const locationsBySlug = new Map(locations.map((location) => [location.slug, location]))
  const itemsByNumber = new Map(items.map((item) => [item.sysco_item_number, item]))
  const missingLocations = Object.keys(STORAGE_ASSIGNMENTS).filter((slug) => !locationsBySlug.has(slug))
  const missingItems = assignedItemNumbers.filter((itemNumber) => !itemsByNumber.has(itemNumber))

  if (missingLocations.length > 0) {
    throw new Error(`Missing storage locations: ${missingLocations.join(', ')}`)
  }

  if (missingItems.length > 0) {
    throw new Error(`Missing catalog items: ${missingItems.join(', ')}`)
  }

  console.log(apply ? 'Applying storage location assignments:' : 'Storage location assignment preview:')

  for (const [slug, itemNumbers] of Object.entries(STORAGE_ASSIGNMENTS)) {
    const location = locationsBySlug.get(slug)
    if (!location) throw new Error(`Storage location ${slug} could not be loaded.`)

    console.log(`  ${location.name}: ${itemNumbers.length} items`)

    if (!apply) continue

    const { error } = await supabase
      .from('items')
      .update({ storage_location_id: location.id })
      .in('sysco_item_number', itemNumbers)

    if (error) throw error
  }

  if (!apply) {
    const assignedItemNumberSet = new Set(assignedItemNumbers)
    const predictedUnassigned = items.filter(
      (item) => !item.storage_location_id && !assignedItemNumberSet.has(item.sysco_item_number),
    ).length

    console.log(`  Unassigned after apply: ${predictedUnassigned} items`)
    console.log('Dry run complete. No database changes were made.')
    return
  }

  const { data: overview, error: overviewError } = await supabase
    .from('inventory_overview')
    .select('storage_location_name')

  if (overviewError) throw overviewError

  const summary = overview.reduce<Record<string, number>>((counts, item) => {
    const location = item.storage_location_name ?? 'Unassigned'
    counts[location] = (counts[location] ?? 0) + 1
    return counts
  }, {})

  console.log('Assignment summary:')
  for (const [location, count] of Object.entries(summary).sort()) {
    console.log(`  ${location}: ${count} items`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
