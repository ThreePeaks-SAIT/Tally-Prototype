import { access } from 'node:fs/promises'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readSheet, type CellValue, type Row } from 'read-excel-file/node'

config({ path: '.env.local', quiet: true })
config({ quiet: true })

type PurchaseType = 'full_case' | 'broken_case' | 'non_inventory'
type InputCell = CellValue | null | undefined

type SourceRow = {
  rowNumber: number
  month: string
  fromDate: string
  toDate: string
  manufacturerName: string
  syscoItemNumber: string
  vendorItemNumber: string | null
  packSize: number
  unitSize: string
  description: string
  brand: string | null
  salesAmount: number
  purchaseType: PurchaseType
  quantityShipped: number
}

type CatalogItem = {
  sysco_item_number: string
  manufacturer_name: string
  description: string
  pack_size: number
  unit_size: string
  brand: string | null
  is_inventory_item: boolean
}

type MonthMarker = {
  month: string
  rowNumber: number
  reportedQuantity: number
}

const SHEET_NAME = 'Page1'
const VENDOR_NAME = 'Sysco'
const NON_INVENTORY_ITEM_NUMBERS = new Set(['1331883'])

const EXPECTED_SOURCE = {
  rowCount: 265,
  itemCount: 70,
  quantityShipped: 907,
  salesCents: 4_628_867,
  months: ['2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01'],
}

const COLUMN = {
  fromDate: 1,
  toDate: 2,
  manufacturerName: 6,
  syscoItemNumber: 7,
  vendorItemNumber: 8,
  packSize: 9,
  unitSize: 10,
  description: 11,
  brand: 12,
  salesAmount: 13,
  brokenCase: 14,
  quantityShipped: 15,
} as const

function printUsage() {
  console.log(`Usage:
  npm run db:import:sysco -- --file "path/to/report.xlsx"
  npm run db:import:sysco -- --file "path/to/report.xlsx" --apply

The default mode validates the workbook without writing to Supabase.
Use --apply only after the database migration has been applied.`)
}

function parseArguments(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(0)
  }

  const fileFlagIndex = args.indexOf('--file')
  const filePath = fileFlagIndex >= 0 ? args[fileFlagIndex + 1] : undefined

  if (!filePath || filePath.startsWith('--')) {
    throw new Error('Missing required --file argument. Run with --help for usage.')
  }

  return {
    apply: args.includes('--apply'),
    filePath: path.resolve(filePath),
  }
}

function cellText(value: InputCell) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function requiredText(value: InputCell, label: string, rowNumber: number) {
  const text = cellText(value)
  if (!text) throw new Error(`Row ${rowNumber}: missing ${label}.`)
  return text
}

function nullableText(value: InputCell) {
  const text = cellText(value)
  return text || null
}

function numberValue(value: InputCell, label: string, rowNumber: number) {
  const parsed = typeof value === 'number' ? value : Number(cellText(value).replaceAll(',', ''))
  if (!Number.isFinite(parsed)) throw new Error(`Row ${rowNumber}: invalid ${label}.`)
  return parsed
}

function integerValue(value: InputCell, label: string, rowNumber: number) {
  const parsed = numberValue(value, label, rowNumber)
  if (!Number.isInteger(parsed)) throw new Error(`Row ${rowNumber}: ${label} must be an integer.`)
  return parsed
}

function parseMonthMarker(value: string) {
  const match = /^Month:\s*(\d{4})(\d{2})$/.exec(value)
  if (!match) return null

  const month = Number(match[2])
  if (month < 1 || month > 12) throw new Error(`Invalid month marker: ${value}.`)
  return `${match[1]}-${match[2]}-01`
}

function cents(value: number) {
  return Math.round(value * 100)
}

function sourceDate(value: InputCell, label: string, rowNumber: number) {
  const text = requiredText(value, label, rowNumber)
  if (!/^\d{6}$/.test(text)) throw new Error(`Row ${rowNumber}: invalid ${label}.`)
  return text
}

function purchaseType(syscoItemNumber: string, brokenCase: string): PurchaseType {
  if (NON_INVENTORY_ITEM_NUMBERS.has(syscoItemNumber)) return 'non_inventory'
  return brokenCase.toUpperCase() === 'Y' ? 'broken_case' : 'full_case'
}

function validateHeaders(header: Row) {
  const expectedHeaders = new Map<number, string>([
    [COLUMN.fromDate, 'FromDate'],
    [COLUMN.toDate, 'ToDate'],
    [COLUMN.manufacturerName, 'Name'],
    [COLUMN.syscoItemNumber, 'Item'],
    [COLUMN.vendorItemNumber, 'Vendor Item #'],
    [COLUMN.packSize, 'Item Pack'],
    [COLUMN.unitSize, 'Item Size'],
    [COLUMN.description, 'Item Description Line 1'],
    [COLUMN.brand, 'Item Brand'],
    [COLUMN.salesAmount, 'Sales'],
    [COLUMN.brokenCase, 'B/C'],
    [COLUMN.quantityShipped, 'Qty shipped'],
  ])

  for (const [index, expected] of expectedHeaders) {
    const actual = cellText(header[index])
    if (actual !== expected) {
      throw new Error(`Unexpected column ${index + 1}. Expected "${expected}", received "${actual}".`)
    }
  }
}

function parseDataRow(row: Row, rowNumber: number): Omit<SourceRow, 'month'> {
  const syscoItemNumber = requiredText(row[COLUMN.syscoItemNumber], 'Sysco item number', rowNumber)
  const brokenCase = cellText(row[COLUMN.brokenCase])

  if (brokenCase && brokenCase.toUpperCase() !== 'Y') {
    throw new Error(`Row ${rowNumber}: unexpected B/C value "${brokenCase}".`)
  }

  const packSize = integerValue(row[COLUMN.packSize], 'pack size', rowNumber)
  if (packSize <= 0) throw new Error(`Row ${rowNumber}: pack size must be positive.`)

  return {
    rowNumber,
    fromDate: sourceDate(row[COLUMN.fromDate], 'FromDate', rowNumber),
    toDate: sourceDate(row[COLUMN.toDate], 'ToDate', rowNumber),
    manufacturerName: requiredText(row[COLUMN.manufacturerName], 'manufacturer name', rowNumber),
    syscoItemNumber,
    vendorItemNumber: nullableText(row[COLUMN.vendorItemNumber]),
    packSize,
    unitSize: requiredText(row[COLUMN.unitSize], 'unit size', rowNumber),
    description: requiredText(row[COLUMN.description], 'description', rowNumber),
    brand: nullableText(row[COLUMN.brand]),
    salesAmount: numberValue(row[COLUMN.salesAmount], 'sales amount', rowNumber),
    purchaseType: purchaseType(syscoItemNumber, brokenCase),
    quantityShipped: numberValue(row[COLUMN.quantityShipped], 'quantity shipped', rowNumber),
  }
}

async function parseWorkbook(filePath: string) {
  const rows = await readSheet(filePath, SHEET_NAME)
  if (rows.length < 2) throw new Error('The workbook does not contain any data rows.')

  validateHeaders(rows[0])

  const history: SourceRow[] = []
  const monthMarkers: MonthMarker[] = []
  let pendingRows: Array<Omit<SourceRow, 'month'>> = []

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    const firstCell = cellText(row[0])
    const markerMonth = parseMonthMarker(firstCell)

    if (markerMonth) {
      if (pendingRows.length === 0) throw new Error(`Row ${rowNumber}: month marker has no product rows.`)

      const reportedQuantity = numberValue(row[COLUMN.quantityShipped], 'monthly quantity subtotal', rowNumber)
      const calculatedQuantity = pendingRows.reduce((sum, item) => sum + item.quantityShipped, 0)

      if (calculatedQuantity !== reportedQuantity) {
        throw new Error(
          `Row ${rowNumber}: monthly quantity subtotal is ${reportedQuantity}, calculated ${calculatedQuantity}.`,
        )
      }

      history.push(...pendingRows.map((item) => ({ ...item, month: markerMonth })))
      monthMarkers.push({ month: markerMonth, reportedQuantity, rowNumber })
      pendingRows = []
      continue
    }

    if (firstCell === 'Overall') {
      if (pendingRows.length > 0) throw new Error('Found unassigned product rows before the Overall total.')
      continue
    }

    const itemNumber = cellText(row[COLUMN.syscoItemNumber])
    if (!itemNumber) {
      const hasContent = row.some((value) => cellText(value) !== '')
      if (hasContent) throw new Error(`Row ${rowNumber}: unrecognized non-product row.`)
      continue
    }

    pendingRows.push(parseDataRow(row, rowNumber))
  }

  if (pendingRows.length > 0) throw new Error('The final product rows are missing a month marker.')
  return { history, monthMarkers }
}

function buildCatalog(history: SourceRow[]) {
  const catalog = new Map<string, CatalogItem>()

  for (const row of history) {
    const existing = catalog.get(row.syscoItemNumber)
    if (
      existing &&
      (existing.description !== row.description ||
        existing.pack_size !== row.packSize ||
        existing.unit_size !== row.unitSize)
    ) {
      throw new Error(`Item ${row.syscoItemNumber} has inconsistent catalog metadata at row ${row.rowNumber}.`)
    }

    catalog.set(row.syscoItemNumber, {
      sysco_item_number: row.syscoItemNumber,
      manufacturer_name: row.manufacturerName,
      description: row.description,
      pack_size: row.packSize,
      unit_size: row.unitSize,
      brand: row.brand,
      is_inventory_item: existing?.is_inventory_item || row.purchaseType !== 'non_inventory',
    })
  }

  return [...catalog.values()]
}

function validateSource(history: SourceRow[], catalog: CatalogItem[], monthMarkers: MonthMarker[]) {
  const quantityShipped = history.reduce((sum, row) => sum + row.quantityShipped, 0)
  const salesCents = history.reduce((sum, row) => sum + cents(row.salesAmount), 0)
  const months = monthMarkers.map((marker) => marker.month)
  const sourceDateRanges = new Set(history.map((row) => `${row.fromDate}:${row.toDate}`))

  const checks: Array<[string, unknown, unknown]> = [
    ['product rows', history.length, EXPECTED_SOURCE.rowCount],
    ['unique items', catalog.length, EXPECTED_SOURCE.itemCount],
    ['quantity shipped', quantityShipped, EXPECTED_SOURCE.quantityShipped],
    ['sales cents', salesCents, EXPECTED_SOURCE.salesCents],
    ['months', JSON.stringify(months), JSON.stringify(EXPECTED_SOURCE.months)],
    ['source date ranges', sourceDateRanges.size, 1],
  ]

  const failures = checks.filter(([, actual, expected]) => actual !== expected)
  if (failures.length > 0) {
    throw new Error(
      `Source validation failed:\n${failures
        .map(([label, actual, expected]) => `  ${label}: expected ${expected}, received ${actual}`)
        .join('\n')}`,
    )
  }

  const negativeRows = history.filter((row) => row.quantityShipped < 0 || row.salesAmount < 0)
  const zeroQuantityRows = history.filter((row) => row.quantityShipped === 0)
  const brokenCaseRows = history.filter((row) => row.purchaseType === 'broken_case')
  const nonInventoryRows = history.filter((row) => row.purchaseType === 'non_inventory')

  return {
    brokenCaseRows: brokenCaseRows.length,
    negativeRows: negativeRows.length,
    nonInventoryRows: nonInventoryRows.length,
    quantityShipped,
    salesAmount: salesCents / 100,
    zeroQuantityRows: zeroQuantityRows.length,
  }
}

function printSummary(
  filePath: string,
  history: SourceRow[],
  catalog: CatalogItem[],
  monthMarkers: MonthMarker[],
  summary: ReturnType<typeof validateSource>,
) {
  console.log(`Validated ${path.basename(filePath)}
  Catalog items: ${catalog.length}
  History rows: ${history.length}
  Months: ${monthMarkers.map((marker) => marker.month.slice(0, 7)).join(', ')}
  Quantity shipped: ${summary.quantityShipped}
  Sales amount: $${summary.salesAmount.toFixed(2)}
  Broken-case rows: ${summary.brokenCaseRows}
  Non-inventory rows: ${summary.nonInventoryRows}
  Negative rows: ${summary.negativeRows}
  Zero-quantity rows: ${summary.zeroQuantityRows}`)
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }
  return result
}

async function applyImport(filePath: string, history: SourceRow[], catalog: CatalogItem[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      'Apply mode requires NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SECRET_KEY in .env.local.',
    )
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .upsert({ name: VENDOR_NAME }, { onConflict: 'name' })
    .select('id')
    .single()

  if (vendorError) throw new Error(`Could not upsert Sysco vendor: ${vendorError.message}`)

  const itemPayload = catalog.map((item) => ({ ...item, vendor_id: vendor.id }))
  const { data: importedItems, error: itemError } = await supabase
    .from('items')
    .upsert(itemPayload, { onConflict: 'sysco_item_number' })
    .select('id, sysco_item_number')

  if (itemError) throw new Error(`Could not upsert catalog items: ${itemError.message}`)

  const itemIds = new Map(importedItems.map((item) => [item.sysco_item_number, item.id]))
  const sourceFileName = path.basename(filePath)
  const historyPayload = history.map((row) => {
    const itemId = itemIds.get(row.syscoItemNumber)
    if (!itemId) throw new Error(`Missing imported item ID for ${row.syscoItemNumber}.`)

    return {
      item_id: itemId,
      month: row.month,
      purchase_type: row.purchaseType,
      quantity_shipped: row.quantityShipped,
      sales_amount: row.salesAmount,
      manufacturer_name: row.manufacturerName,
      vendor_item_number: row.vendorItemNumber,
      source_file_name: sourceFileName,
      source_row_number: row.rowNumber,
      source_key: `sysco:${row.fromDate}:${row.toDate}:row:${row.rowNumber}`,
    }
  })

  for (const batch of chunks(historyPayload, 100)) {
    const { error } = await supabase
      .from('monthly_purchase_history')
      .upsert(batch, { onConflict: 'source_key' })

    if (error) throw new Error(`Could not upsert purchase history: ${error.message}`)
  }

  console.log(`Imported ${catalog.length} catalog items and ${history.length} history rows.`)
}

async function main() {
  const { apply, filePath } = parseArguments(process.argv.slice(2))
  await access(filePath)

  const { history, monthMarkers } = await parseWorkbook(filePath)
  const catalog = buildCatalog(history)
  const summary = validateSource(history, catalog, monthMarkers)
  printSummary(filePath, history, catalog, monthMarkers, summary)

  if (!apply) {
    console.log('Dry run complete. No database changes were made.')
    return
  }

  await applyImport(filePath, history, catalog)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Import failed: ${message}`)
  process.exitCode = 1
})
