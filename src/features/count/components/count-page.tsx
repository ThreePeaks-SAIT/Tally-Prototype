import { CountLocationsPage } from './count-locations-page'
import { getCountLocationsPageData } from '../data/get-count-page-data'

export async function CountPage() {
  const data = await getCountLocationsPageData()

  return <CountLocationsPage {...data} />
}
