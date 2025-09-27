/**
 * Advanced Size Management Migration - Data Assessment Script
 *
 * This script analyzes the current state of products in the database
 * to understand the scope of migration needed for advanced-only size management.
 *
 * SAFE OPERATION: This script only performs READ operations
 */

import { prisma } from '../lib/prisma'
import fs from 'fs'

interface AssessmentResult {
  totalProducts: number
  productsWithSizes: number
  productsNeedingMigration: number
  migrationComplexity: 'low' | 'medium' | 'high'
  legacyDataSummary: {
    productsWithLegacySize: number
    productsWithLegacyQuantity: number
    productsWithBothLegacyFields: number
  }
  migrationStrategy: {
    defaultAgeCategory: 'UNIVERSAL'
    defaultSize: 'M'
    preserveQuantity: boolean
  }
  detailedAnalysis: Array<{
    id: string
    code: string
    name: string
    legacySize?: string
    legacyQuantity: number
    existingSizes: number
    migrationAction: string
  }>
}

async function assessLegacyProducts(): Promise<AssessmentResult> {
  console.log('🔍 Starting legacy product assessment...')

  // 1. Get total product count
  const totalProducts = await prisma.product.count()
  console.log(`📊 Total products in database: ${totalProducts}`)

  // 2. Get products with existing ProductSize records
  const productsWithSizes = await prisma.product.count({
    where: {
      sizes: {
        some: {},
      },
    },
  })
  console.log(`✅ Products with advanced sizes: ${productsWithSizes}`)

  // 3. Get products needing migration (no ProductSize records)
  const productsNeedingMigration = totalProducts - productsWithSizes
  console.log(`⚠️  Products needing migration: ${productsNeedingMigration}`)

  // 4. Detailed analysis of legacy products
  const legacyProducts = await prisma.product.findMany({
    where: {
      sizes: {
        none: {},
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      size: true,
      quantity: true,
      sizes: {
        select: {
          id: true,
        },
      },
    },
  })

  // 5. Legacy field analysis
  const productsWithLegacySize = legacyProducts.filter((p) => p.size && p.size.trim() !== '').length
  const productsWithLegacyQuantity = legacyProducts.filter((p) => p.quantity > 0).length
  const productsWithBothLegacyFields = legacyProducts.filter(
    (p) => p.size && p.size.trim() !== '' && p.quantity > 0,
  ).length

  // 6. Determine migration complexity
  let migrationComplexity: 'low' | 'medium' | 'high'
  if (productsNeedingMigration === 0) {
    migrationComplexity = 'low'
  } else if (productsNeedingMigration <= 50) {
    migrationComplexity = 'low'
  } else if (productsNeedingMigration <= 200) {
    migrationComplexity = 'medium'
  } else {
    migrationComplexity = 'high'
  }

  // 7. Detailed analysis for each legacy product
  const detailedAnalysis = legacyProducts.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    legacySize: product.size || undefined,
    legacyQuantity: product.quantity,
    existingSizes: product.sizes.length,
    migrationAction: determineMigrationAction(product),
  }))

  // 8. Compile results
  const result: AssessmentResult = {
    totalProducts,
    productsWithSizes,
    productsNeedingMigration,
    migrationComplexity,
    legacyDataSummary: {
      productsWithLegacySize,
      productsWithLegacyQuantity,
      productsWithBothLegacyFields,
    },
    migrationStrategy: {
      defaultAgeCategory: 'UNIVERSAL',
      defaultSize: 'M',
      preserveQuantity: true,
    },
    detailedAnalysis,
  }

  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function determineMigrationAction(product: any): string {
  if (product.sizes.length > 0) {
    return 'Already has advanced sizes - skip'
  }

  if (product.size && product.quantity > 0) {
    return `Migrate: ${product.size} (${product.quantity} qty) → UNIVERSAL/${product.size}/${product.quantity}`
  }

  if (product.quantity > 0) {
    return `Migrate: No size (${product.quantity} qty) → UNIVERSAL/M/${product.quantity}`
  }

  return 'Migrate: Default → UNIVERSAL/M/1'
}

function displayResults(result: AssessmentResult) {
  console.log('\n' + '='.repeat(80))
  console.log('📋 LEGACY PRODUCT ASSESSMENT RESULTS')
  console.log('='.repeat(80))

  console.log(`\n📊 OVERVIEW:`)
  console.log(`   Total Products: ${result.totalProducts}`)
  console.log(`   Products with Advanced Sizes: ${result.productsWithSizes}`)
  console.log(`   Products Needing Migration: ${result.productsNeedingMigration}`)
  console.log(`   Migration Complexity: ${result.migrationComplexity.toUpperCase()}`)

  console.log(`\n📈 LEGACY DATA ANALYSIS:`)
  console.log(
    `   Products with Legacy Size Field: ${result.legacyDataSummary.productsWithLegacySize}`,
  )
  console.log(
    `   Products with Legacy Quantity: ${result.legacyDataSummary.productsWithLegacyQuantity}`,
  )
  console.log(
    `   Products with Both Legacy Fields: ${result.legacyDataSummary.productsWithBothLegacyFields}`,
  )

  console.log(`\n🔧 MIGRATION STRATEGY:`)
  console.log(`   Default Age Category: ${result.migrationStrategy.defaultAgeCategory}`)
  console.log(`   Default Size: ${result.migrationStrategy.defaultSize}`)
  console.log(`   Preserve Quantity: ${result.migrationStrategy.preserveQuantity}`)

  if (result.detailedAnalysis.length > 0) {
    console.log(`\n📝 DETAILED MIGRATION PLAN:`)
    result.detailedAnalysis.slice(0, 10).forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.code} (${product.name}): ${product.migrationAction}`)
    })

    if (result.detailedAnalysis.length > 10) {
      console.log(`   ... and ${result.detailedAnalysis.length - 10} more products`)
    }
  }

  console.log(`\n✅ RECOMMENDATIONS:`)
  if (result.productsNeedingMigration === 0) {
    console.log(`   🎉 All products already have advanced sizes - ready for interface cleanup!`)
  } else if (result.migrationComplexity === 'low') {
    console.log(`   💚 Low complexity migration - can proceed with automated migration`)
  } else if (result.migrationComplexity === 'medium') {
    console.log(`   💛 Medium complexity - recommend batch migration with validation`)
  } else {
    console.log(`   ❤️  High complexity - recommend phased migration approach`)
  }

  console.log('\n' + '='.repeat(80))
}

async function main() {
  try {
    const result = await assessLegacyProducts()
    displayResults(result)

    // Save results to file for reference
    const resultFile = `assessment-result-${new Date().toISOString().split('T')[0]}.json`
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2))
    console.log(`\n💾 Results saved to: ${resultFile}`)
  } catch (error) {
    console.error('❌ Assessment failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run assessment if this file is executed directly
if (require.main === module) {
  main()
}

export { assessLegacyProducts, type AssessmentResult }
