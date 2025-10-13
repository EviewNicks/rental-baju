/**
 * Delete Organza Products
 * Remove all existing Organza products before fresh import
 */

import { prisma } from '../lib/prisma'

async function deleteOrganzaProducts() {
  try {
    console.log('🗑️  Deleting existing Organza products...')
    console.log('')

    const ORGANZA_CATEGORY_ID = '912520ea-ad5a-4294-8057-e9084a871a05'

    // Count existing products
    const count = await prisma.product.count({
      where: {
        categoryId: ORGANZA_CATEGORY_ID
      }
    })

    console.log(`Found ${count} Organza products to delete`)

    if (count === 0) {
      console.log('✅ No products to delete')
      return
    }

    // Delete products (cascade will delete ProductSize records)
    const result = await prisma.product.deleteMany({
      where: {
        categoryId: ORGANZA_CATEGORY_ID
      }
    })

    console.log('')
    console.log(`✅ Deleted ${result.count} products successfully`)
    console.log('')
    console.log('Ready for fresh import!')

  } catch (error) {
    console.error('❌ Delete failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteOrganzaProducts()
