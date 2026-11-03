export interface CountItem {
  id: string
  description: string
  packSize: number
  unitSize: string
  parLevel: number | null
  vendorName: string
}

export interface CountLocation {
  id: string
  name: string
  slug: string
}

export interface CountLocationSummary extends CountLocation {
  countedItems: number
  totalItems: number
}

export interface CountPageData {
  items: CountItem[]
  countedItemIds: string[]
  location: CountLocation
}

export interface CountLocationsPageData {
  locations: CountLocationSummary[]
  unassignedItemCount: number
}
