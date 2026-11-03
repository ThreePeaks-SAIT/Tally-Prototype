import { notFound } from 'next/navigation'

import { getCountPageData } from '../data/get-count-page-data'
import { CountWorkspace } from './count-workspace'

interface LocationCountPageProps {
  locationSlug: string
}

export async function LocationCountPage({ locationSlug }: LocationCountPageProps) {
  const data = await getCountPageData(locationSlug)

  if (!data) notFound()

  return (
    <CountWorkspace
      initialCountedItemIds={data.countedItemIds}
      items={data.items}
      location={data.location}
    />
  )
}
