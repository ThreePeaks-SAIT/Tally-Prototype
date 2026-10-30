export interface CountItem {
  id: string
  description: string
  packSize: number
  unitSize: string
  parLevel: number | null
  vendorName: string
}

export interface CountPageData {
  items: CountItem[]
  countedItemIds: string[]
}
