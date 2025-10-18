/**
 * Transform Renda Premium CSV to JSON Script
 *
 * Converts CSV data to JSON format matching organza-products.json structure
 * Handles data cleaning, validation, and transformation
 *
 * Usage: tsx scripts/transform-renda-csv.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface CSVRow {
  kode: string
  nama: string
  harga: string
  jumlahDewasa: string
  jumlahAnak: string
}

interface SizeEntry {
  ageCategory: 'ADULT' | 'CHILD'
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  quantity: number
}

interface RendaProduct {
  code: string
  name: string
  description: string
  modalAwal: number
  currentPrice: number
  quantity: number
  categoryId: string
  imageUrl: string
  sizes: SizeEntry[]
}

interface TransformationResult {
  success: boolean
  totalRows: number
  transformedProducts: number
  skippedRows: number
  errors: Array<{
    rowNumber: number
    kode: string
    error: string
  }>
  warnings: Array<{
    rowNumber: number
    kode: string
    warning: string
  }>
}

const RENDA_PREMIUM_CATEGORY_ID = 'bddcd8e5-7873-4a12-8649-600cc8da4b1e'
const CSV_PATH = path.join(__dirname, '../public/renda-premium.csv')
const OUTPUT_PATH = path.join(__dirname, '../prisma/renda-premium-products.json')

/**
 * Parse price string "RP 500,000" to number 500000
 */
function parsePrice(priceStr: string): number {
  // Remove "RP " prefix and commas
  const cleaned = priceStr.replace(/RP\s*/i, '').replace(/,/g, '').trim()
  const parsed = parseInt(cleaned, 10)

  if (isNaN(parsed)) {
    throw new Error(`Invalid price format: ${priceStr}`)
  }

  return parsed
}

/**
 * Normalize product code by removing spaces
 */
function normalizeCode(code: string): string {
  return code.replace(/\s+/g, '')
}

/**
 * Parse size data string "M:2, L:1" into SizeEntry array
 */
function parseSizeData(sizeStr: string, ageCategory: 'ADULT' | 'CHILD'): SizeEntry[] {
  if (!sizeStr || sizeStr.trim() === '') {
    return []
  }

  const sizes: SizeEntry[] = []
  const sizeMap = new Map<string, number>()

  // Clean and split size data
  const cleaned = sizeStr.replace(/;\s*$/, '') // Remove trailing semicolon
  const sizeEntries = cleaned.split(/[,]\s*/) // Split by comma

  for (const entry of sizeEntries) {
    if (!entry.trim()) continue

    // Parse "M:2" format
    const match = entry.match(/^([A-Za-z]+)\s*:\s*(\d+)$/)
    if (!match) {
      throw new Error(`Invalid size format: ${entry}`)
    }

    const size = match[1].toUpperCase().trim()
    const quantity = parseInt(match[2], 10)

    // Normalize size names
    const normalizedSize = normalizeSize(size)
    if (!normalizedSize) {
      throw new Error(`Invalid size: ${size}`)
    }

    // Aggregate quantities for duplicate sizes
    const currentQuantity = sizeMap.get(normalizedSize) || 0
    sizeMap.set(normalizedSize, currentQuantity + quantity)
  }

  // Convert map to SizeEntry array
  for (const [sizeEntry, quantity] of sizeMap.entries()) {
    sizes.push({
      ageCategory,
      size: sizeEntry as SizeEntry['size'],
      quantity,
    })
  }

  return sizes
}

/**
 * Normalize size names to valid values
 */
function normalizeSize(size: string): string | null {
  const sizeMap: Record<string, string> = {
    XS: 'XS',
    S: 'S',
    M: 'M',
    L: 'L',
    XL: 'XL',
    XXL: 'XXL',
  }

  return sizeMap[size.toUpperCase()] || null
}

/**
 * Parse CSV line with semicolon delimiter
 */
function parseCSVLine(line: string): CSVRow | null {
  // Skip empty lines and header
  if (!line.trim() || line.includes('KODE;NAMA')) {
    return null
  }

  const parts = line.split(';').map((part) => part.trim())

  if (parts.length < 4) {
    throw new Error(`Invalid CSV format: expected at least 4 columns, got ${parts.length}`)
  }

  // Handle missing child data
  if (parts.length === 4) {
    parts.push('') // Add empty child data
  }

  return {
    kode: parts[0],
    nama: parts[1],
    harga: parts[2],
    jumlahDewasa: parts[3],
    jumlahAnak: parts[4] || '',
  }
}

/**
 * Transform CSV row to product JSON
 */
function transformRow(row: CSVRow): RendaProduct | null {
  try {
    const code = normalizeCode(row.kode)
    const name = row.nama.trim()
    const price = parsePrice(row.harga)

    // Parse adult sizes
    const adultSizes = parseSizeData(row.jumlahDewasa, 'ADULT')

    // Parse child sizes
    const childSizes = parseSizeData(row.jumlahAnak, 'CHILD')

    // Combine all sizes
    const allSizes = [...adultSizes, ...childSizes]

    // Calculate total quantity
    const totalQuantity = allSizes.reduce((sum, size) => sum + size.quantity, 0)

    const product: RendaProduct = {
      code,
      name,
      description: '',
      modalAwal: price,
      currentPrice: price,
      quantity: totalQuantity,
      categoryId: RENDA_PREMIUM_CATEGORY_ID,
      imageUrl: `/products/renda-premium/${code}.jpg`,
      sizes: allSizes,
    }

    return product
  } catch (error) {
    throw new Error(
      `Row transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Main transformation function
 */
async function transformCSV(): Promise<TransformationResult> {
  const result: TransformationResult = {
    success: true,
    totalRows: 0,
    transformedProducts: 0,
    skippedRows: 0,
    errors: [],
    warnings: [],
  }

  try {
    console.log('🚀 Starting Renda Premium CSV Transformation...')
    console.log(`📂 Input: ${CSV_PATH}`)
    console.log(`📤 Output: ${OUTPUT_PATH}`)
    console.log('')

    // Read CSV file
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found: ${CSV_PATH}`)
    }

    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
    const lines = csvContent.split('\n').filter((line) => line.trim())

    result.totalRows = lines.length - 1 // Subtract header row
    const products: RendaProduct[] = []

    console.log(`📊 Found ${result.totalRows} data rows to process`)
    console.log('')

    // Process each row
    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1
      const line = lines[i]

      try {
        const csvRow = parseCSVLine(line)

        if (!csvRow) {
          continue // Skip header or empty lines
        }

        const product = transformRow(csvRow)

        if (product) {
          products.push(product)
          result.transformedProducts++
          console.log(
            `✅ [${lineNumber}] ${csvRow.kode} → ${product.code}: ${product.name} (${product.quantity} items)`,
          )
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push({
          rowNumber: lineNumber,
          kode: `Line ${lineNumber}`,
          error: errorMsg,
        })
        console.log(`❌ [${lineNumber}] Error: ${errorMsg}`)
        result.skippedRows++
      }
    }

    console.log('')
    console.log(`📈 Transformation Summary:`)
    console.log(`   Total rows: ${result.totalRows}`)
    console.log(`   Transformed: ${result.transformedProducts}`)
    console.log(`   Skipped: ${result.skippedRows}`)
    console.log(`   Errors: ${result.errors.length}`)

    if (result.errors.length > 0) {
      console.log('')
      console.log('❌ Errors encountered:')
      result.errors.forEach((err) => {
        console.log(`   Row ${err.rowNumber}: ${err.error}`)
      })
    }

    // Write JSON output
    if (products.length > 0) {
      const jsonOutput = JSON.stringify(products, null, 2)
      fs.writeFileSync(OUTPUT_PATH, jsonOutput, 'utf-8')

      console.log('')
      console.log(`✅ JSON file created: ${OUTPUT_PATH}`)
      console.log(`   Products: ${products.length}`)

      // Calculate totals
      const totalItems = products.reduce((sum, p) => sum + p.quantity, 0)
      const totalSizes = products.reduce((sum, p) => sum + p.sizes.length, 0)

      console.log(`   Total stock: ${totalItems} items`)
      console.log(`   Total sizes: ${totalSizes} variations`)
    }

    result.success = result.errors.length === 0 || products.length > 0
  } catch (error) {
    console.error('')
    console.error(
      '❌ Transformation failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    result.success = false
  }

  return result
}

/**
 * Main execution
 */
async function main() {
  try {
    const result = await transformCSV()

    console.log('')
    console.log('='.repeat(60))
    console.log('📊 TRANSFORMATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Total rows: ${result.totalRows}`)
    console.log(`Transformed: ${result.transformedProducts}`)
    console.log(`Skipped: ${result.skippedRows}`)
    console.log(`Errors: ${result.errors.length}`)
    console.log('='.repeat(60))

    if (!result.success || result.errors.length > 0) {
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { transformCSV }
