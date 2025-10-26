/**
 * Import Categories Script
 *
 * Imports categories from JSON file into database
 * Uses CategoryService for consistent validation and business logic
 *
 * Usage:
 * - Dry run: DRY_RUN=true tsx scripts/import-categories.ts
 * - Actual import: tsx scripts/import-categories.ts
 */

import { prisma } from '../lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

const isDryRun = process.env.DRY_RUN === 'true'
const DEFAULT_USER_ID = process.env.IMPORT_USER_ID || 'system_import'

interface CategoryData {
  id: string
  name: string
  color: string
  type: string
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

async function validateCategoryType(type: string): Promise<boolean> {
  const validTypes = ['clothing', 'accessories_age_based', 'accessories_universal']
  return validTypes.includes(type)
}

async function checkDuplicateNames(categories: CategoryData[]): Promise<string[]> {
  const names = categories.map(c => c.name.toLowerCase())
  const existingCategories = await prisma.category.findMany({
    where: {
      name: { in: names },
    },
    select: { name: true },
  })
  return existingCategories.map(c => c.name.toLowerCase())
}

async function importCategories(): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: []
  }

  try {
    console.log('🚀 Starting Categories Import...')
    console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (No database changes)' : 'LIVE IMPORT'}`)
    console.log('')

    const jsonPath = path.join(__dirname, '../prisma/seed/categories.json')

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at: ${jsonPath}`)
    }

    const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(jsonContent)

    if (!data.categories || !Array.isArray(data.categories)) {
      throw new Error('Invalid JSON format: expected "categories" array')
    }

    const categories: CategoryData[] = data.categories
    result.total = categories.length

    console.log(`📦 Found ${categories.length} categories to import`)
    console.log('')

    if (categories.length === 0) {
      console.log('⚠️  No categories found in JSON file')
      return result
    }

    // Validate all category types first
    console.log('🔍 Validating category types...')
    for (const category of categories) {
      const isValidType = await validateCategoryType(category.type)
      if (!isValidType) {
        throw new Error(`Invalid category type "${category.type}" for category "${category.name}". Valid types: clothing, accessories_age_based, accessories_universal`)
      }
    }
    console.log('✅ All category types are valid')
    console.log('')

    console.log('🔍 Checking for duplicate category names...')
    const duplicateNames = await checkDuplicateNames(categories)

    if (duplicateNames.length > 0) {
      console.log(`⚠️  Found ${duplicateNames.length} duplicate names:`, duplicateNames.join(', '))
      console.log('These categories will be skipped')
      console.log('')
    } else {
      console.log('✅ No duplicate names found')
      console.log('')
    }

    if (isDryRun) {
      console.log('✅ DRY RUN VALIDATION COMPLETE')
      console.log('')
      console.log('📊 Summary:')
      console.log(`   Total categories: ${result.total}`)
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

    // Import categories in batch
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]
      const progress = `[${i + 1}/${categories.length}]`

      try {
        if (duplicateNames.includes(category.name.toLowerCase())) {
          console.log(`⏭️  ${progress} Skipping ${category.name} (duplicate)`)
          result.skipped++
          continue
        }

        console.log(`📝 ${progress} Importing ${category.name} - ${category.type}`)

        if (!isDryRun) {
          await prisma.category.create({
            data: {
              id: category.id,
              name: category.name,
              color: category.color,
              type: category.type as any, // Cast to any to avoid type issues
              createdAt: new Date(category.createdAt),
              updatedAt: new Date(category.updatedAt),
              createdBy: category.createdBy,
            },
          })
        }

        console.log(`   ✅ Success`)
        result.imported++

      } catch (error) {
        console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.failed++
        result.errors.push({
          id: category.id,
          name: category.name,
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
    const result = await importCategories()

    console.log('')
    console.log('='.repeat(50))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Total categories: ${result.total}`)
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

export { importCategories }