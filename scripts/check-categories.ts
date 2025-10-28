import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCategories() {
  try {
    console.log('🔍 Checking existing categories...')

    const allCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })

    console.log(`Found ${allCategories.length} categories:`)
    console.table(allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color
    })))

  } catch (error) {
    console.error('❌ Error checking categories:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCategories()