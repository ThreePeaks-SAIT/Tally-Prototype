const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

export function parseSpokenQuantity(transcript: string) {
  const numericMatch = transcript.match(/\d+(?:[.,]\d+)?/)
  if (numericMatch) return Number.parseFloat(numericMatch[0].replace(',', '.'))

  const tokens = transcript.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean)
  const pointIndex = tokens.indexOf('point')
  const wholeTokens = pointIndex >= 0 ? tokens.slice(0, pointIndex) : tokens
  const decimalTokens = pointIndex >= 0 ? tokens.slice(pointIndex + 1) : []
  const whole = wholeTokens.reduce((total, token) => total + (NUMBER_WORDS[token] ?? 0), 0)
  const recognizedWhole = wholeTokens.some((token) => NUMBER_WORDS[token] !== undefined)
  const decimalDigits = decimalTokens
    .map((token) => NUMBER_WORDS[token])
    .filter((value): value is number => value !== undefined && value < 10)
    .join('')
  const fraction = decimalDigits ? Number(`0.${decimalDigits}`) : 0
  const half = tokens.includes('half') ? 0.5 : 0

  return recognizedWhole || decimalDigits || half ? whole + fraction + half : null
}
