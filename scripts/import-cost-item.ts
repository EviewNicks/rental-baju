/**
 * Import Cost Items Script
 *
 * Imports cost items from JSON file into database
 * Uses CostItemService for consistent validation and business logic
 *
 * Usage:
 * - Dry run: DRY_RUN=true tsx scripts/import-cost-item.ts
 * - Actual import: tsx scripts/import-cost-item.ts
 */

import { prisma } from '../lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

const isDryRun = process.env.DRY_RUN === 'true'

interface CostItemData {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface ImportResult {
  success: boolean
  total: number
  imported: number
  skipped: number
  failed: number
  errors: Array<{
    id: string
    name: string
    error: string
  }>
}

async function checkDuplicateNames(costItems: CostItemData[]): Promise<string[]> {
  const names = costItems.map((c) => c.name.toLowerCase())
  const existingCostItems = await prisma.costItem.findMany({
    where: {
      name: { in: names },
    },
    select: { name: true },
  })
  return existingCostItems.map((c) => c.name.toLowerCase())
}

async function validateCostItemName(name: string): Promise<boolean> {
  // Validate name is not empty and not just whitespace
  if (!name || name.trim().length === 0) {
    return false
  }
  
  // Validate name length (max 255 characters)
  if (name.length > 255) {
    return false
  }
  
  return true
}

async function importCostItems(): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  try {
    console.log('🚀 Starting Cost Items Import...')
    console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (No database changes)' : 'LIVE IMPORT'}`)
    console.log('')

    const jsonPath = path.join(__dirname, '../prisma/seed/cost-items.json')

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at: ${jsonPath}`)
    }

    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(jsonContent)

    if (!data.costItems || !Array.isArray(data.costItems)) {
      throw new Error('Invalid JSON format: expected "costItems" array')
    }

    const costItems: CostItemData[] = data.costItems
    result.total = costItems.length

    console.log(`📦 Found ${costItems.length} cost items to import`)
    console.log('')

    if (costItems.length === 0) {
      console.log('⚠️  No cost items found in JSON file')
      return result
    }

    // Validate all cost item names first
    console.log('🔍 Validating cost item names...')
    for (const costItem of costItems) {
      const isValidName = await validateCostItemName(costItem.name)
      if (!isValidName) {
        throw new Error(
          `Invalid cost item name "${costItem.name}" for cost item "${costItem.id}". Name must not be empty and max 255 characters.`,
        )
      }
    }
    console.log('✅ All cost item names are valid')
    console.log('')

    console.log('🔍 Checking for duplicate cost item names...')
    const duplicateNames = await checkDuplicateNames(costItems)

    if (duplicateNames.length > 0) {
      console.log(`⚠️  Found ${duplicateNames.length} duplicate names:`, duplicateNames.join(', '))
      console.log('These cost items will be skipped')
      console.log('')
    } else {
      console.log('✅ No duplicate names found')
      console.log('')
    }

    if (isDryRun) {
      console.log('✅ DRY RUN VALIDATION COMPLETE')
      console.log('')
      console.log('📊 Summary:')
      console.log(`   Total cost items: ${result.total}`)
      console.log(`   Would import: ${result.total - duplicateNames.length}`)
      console.log(`   Would skip (duplicates): ${duplicateNames.length}`)
      console.log('')
      console.log('💡 Run without DRY_RUN=true to perform actual import')

      result.imported = result.total - duplicateNames.length
      result.skipped = duplicateNames.length
      return result
    }

    console.log('💾 Starting database import...')
    console.log('')

    // Import cost items in batch
    for (let i = 0; i < costItems.length; i++) {
      const costItem = costItems[i]
      const progress = `[${i + 1}/${costItems.length}]`

      try {
        if (duplicateNames.includes(costItem.name.toLowerCase())) {
          console.log(`⏭️  ${progress} Skipping ${costItem.name} (duplicate)`)
          result.skipped++
          continue
        }

        console.log(`📝 ${progress} Importing ${costItem.name}`)

        if (!isDryRun) {
          await prisma.costItem.create({
            data: {
              id: costItem.id,
              name: costItem.name,
              createdAt: new Date(costItem.createdAt),
              updatedAt: new Date(costItem.updatedAt),
              createdBy: costItem.createdBy,
            },
          })
        }

        console.log(`   ✅ Success`)
        result.imported++
      } catch (error) {
        console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.failed++
        result.errors.push({
          id: costItem.id,
          name: costItem.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('')
    console.log('✅ IMPORT COMPLETE')
  } catch (error) {
    console.error('')
    console.error('❌ IMPORT FAILED')
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    result.success = false
    throw error
  }

  return result
}

async function main() {
  try {
    const result = await importCostItems()

    console.log('')
    console.log('='.repeat(50))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Total cost items: ${result.total}`)
    console.log(`Imported: ${result.imported}`)
    console.log(`Skipped: ${result.skipped}`)
    console.log(`Failed: ${result.failed}`)

    if (result.errors.length > 0) {
      console.log('')
      console.log('❌ Errors:')
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.name} (${err.id}): ${err.error}`)
      })
    }

    console.log('='.repeat(50))
    console.log('')

    if (!result.success || result.failed > 0) {
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export { importCostItems }