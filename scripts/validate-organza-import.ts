/**
 * Validate Organza Import
 * Verify that all products and sizes were imported correctly
 */

import { prisma } from '../lib/prisma'

async function validateImport() {
  try {
    console.log('🔍 Validating Organza Products Import...')
    console.log('')

    const ORGANZA_CATEGORY_ID = '912520ea-ad5a-4294-8057-e9084a871a05'

    const products = await prisma.product.findMany({
      where: {
        categoryId: ORGANZA_CATEGORY_ID,
        isActive: true,
      },
      include: {
        category: true,
        sizes: true,
      },
      orderBy: {
        code: 'asc',
      },
    })

    console.log(`✅ Found ${products.length} Organza products`)
    console.log('')

    if (products.length === 0) {
      console.log('⚠️  No products found!')
      return
    }

    console.log('📊 Product Details:')
    console.log('='.repeat(80))

    let totalSizes = 0

    products.forEach((product, index) => {
      const sizeCount = product.sizes.length
      totalSizes += sizeCount

      console.log(`${index + 1}. ${product.code} - ${product.name}`)
      console.log(`   Price: Rp${product.currentPrice.toString()}`)
      console.log(`   Sizes: ${sizeCount} variations`)

      product.sizes.forEach((size) => {
        console.log(`      - ${size.ageCategory} ${size.size}: ${size.quantity} items`)
      })

      console.log('')
    })

    console.log('='.repeat(80))
    console.log('📈 Summary:')
    console.log(`   Total Products: ${products.length}`)
    console.log(`   Total Size Records: ${totalSizes}`)
    console.log(`   Category: ${products[0]?.category.name || 'N/A'}`)
    console.log('='.repeat(80))

    console.log('')
    console.log('✅ Validation Complete!')

    const expectedProducts = 14

    if (products.length === expectedProducts) {
      console.log(`✅ Product count matches expected (${expectedProducts})`)
    } else {
      console.log(
        `⚠️  Product count mismatch: Expected ${expectedProducts}, got ${products.length}`,
      )
    }
  } catch (error) {
    console.error('❌ Validation failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  validateImport()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { validateImport }
