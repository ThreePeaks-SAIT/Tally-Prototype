import { CountWorkspace } from './count-workspace'
import { getCountPageData } from '../data/get-count-page-data'

export async function CountPage() {
  const data = await getCountPageData()

  return <CountWorkspace initialCountedItemIds={data.countedItemIds} items={data.items} />
}
