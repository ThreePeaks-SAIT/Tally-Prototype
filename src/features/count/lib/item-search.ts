import type { CountItem } from '../types'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function scoreItem(item: CountItem, query: string) {
  const normalizedDescription = normalize(item.description)
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) return 0
  if (normalizedDescription === normalizedQuery) return 100
  if (normalizedDescription.startsWith(normalizedQuery)) return 90

  // A single letter should narrow the list by the beginning of the item name,
  // not match every occurrence of that letter inside a description.
  if (normalizedQuery.length === 1) return 0

  const queryTokens = normalizedQuery.split(' ')
  const descriptionTokens = normalizedDescription.split(' ')

  if (descriptionTokens.some((token) => token === normalizedQuery)) return 80
  if (descriptionTokens.some((token) => token.startsWith(normalizedQuery))) return 70

  const allQueryTokensMatch = queryTokens.every((queryToken) =>
    descriptionTokens.some((descriptionToken) => descriptionToken.startsWith(queryToken)),
  )

  if (allQueryTokensMatch) return 60
  if (normalizedQuery.length >= 3 && normalizedDescription.includes(normalizedQuery)) return 40

  return 0
}

export function findMatchingItems(items: CountItem[], query: string, limit = 6) {
  return items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.item.description.localeCompare(right.item.description))
    .slice(0, limit)
    .map(({ item }) => item)
}

export function formatItemName(description: string) {
  return description
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
