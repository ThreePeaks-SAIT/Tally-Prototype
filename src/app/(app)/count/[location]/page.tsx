import { LocationCountPage } from '@/features/count'

export const dynamic = 'force-dynamic'

interface LocationCountRouteProps {
  params: Promise<{ location: string }>
}

export default async function LocationCountRoute({ params }: LocationCountRouteProps) {
  const { location } = await params

  return <LocationCountPage locationSlug={location} />
}
