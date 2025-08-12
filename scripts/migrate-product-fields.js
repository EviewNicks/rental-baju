/**
 * Migration script untuk update data Product
 * Mengcopy hargaSewa ke currentPrice sebelum menghapus field redundant
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

async function migrateProductFields() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Starting Product field migration...')
    
    // Update currentPrice dengan nilai dari hargaSewa
    const updateResult = await prisma.$executeRaw`
      UPDATE "Product" 
      SET "currentPrice" = "hargaSewa" 
      WHERE "currentPrice" = 0
    `
    
    console.log(`✅ Updated ${updateResult} products with currentPrice from hargaSewa`)
    
    // Verify data migration
    const products = await prisma.product.findMany({
      select: {
        code: true,
        hargaSewa: true,
        currentPrice: true
      }
    })
    
    console.log('📊 Data verification:')
    products.forEach(product => {
      console.log(`  ${product.code}: hargaSewa=${product.hargaSewa}, currentPrice=${product.currentPrice}`)
    })
    
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateProductFields()