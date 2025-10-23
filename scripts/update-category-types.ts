#!/usr/bin/env tsx

/**
 * Script untuk update existing categories dengan appropriate type values
 * Run setelah migration database selesai
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCategoryTypes() {
  try {
    console.log('🔄 Updating existing categories with type values...')

    // Use raw SQL for now since enum might not be properly created in database
    const sarungSongket = await prisma.$executeRaw`
      UPDATE "Category"
      SET type = 'accessories_age_based'
      WHERE name IN ('Sarung', 'Songket')
    `

    console.log(`✅ Updated ${sarungSongket.length} rows to accessories_age_based`)

    // Update Anting, Bando, Gelang, Kalung ke accessories_universal
    const accessories = await prisma.$executeRaw`
      UPDATE "Category"
      SET type = 'accessories_universal'
      WHERE name IN ('Anting', 'Bando', 'Gelang', 'Kalung')
    `

    console.log(`✅ Updated ${accessories.length} rows to accessories_universal`)

    // Verify results
    const allCategories = await prisma.$queryRaw`
      SELECT id, name, type, color, "createdAt", "updatedAt", "createdBy"
      FROM "Category"
      ORDER BY name ASC
    `

    console.log('\n📊 All Categories after update:')
    console.table(allCategories)

    console.log('\n🎉 Category type update completed successfully!')

  } catch (error) {
    console.error('❌ Error updating category types:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
updateCategoryTypes()