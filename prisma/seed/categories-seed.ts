import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding categories from JSON...')

  try {
    // Read categories from JSON file
    const categoriesPath = join(__dirname, 'categories.json')
    const categoriesData = JSON.parse(readFileSync(categoriesPath, 'utf-8'))

    console.log(`📁 Found ${categoriesData.categories.length} categories to seed`)

    // Seed each category with proper error handling
    for (const [index, category] of categoriesData.categories.entries()) {
      try {
        console.log(`📝 Processing ${index + 1}/${categoriesData.categories.length}: ${category.name}`)
        console.log(`   Type: ${category.type}`)
        console.log(`   Color: ${category.color}`)

        await prisma.category.upsert({
          where: { name: category.name },
          update: {},
          create: {
            name: category.name,
            color: category.color,
            type: category.type || 'clothing', // Default for backward compatibility
            createdBy: 'system',
            createdAt: new Date(category.createdAt),
            updatedAt: new Date(category.updatedAt),
          },
        })

        console.log(`✅ Created/Updated: ${category.name}`)
      } catch (error) {
        console.error(`❌ Error seeding category ${category.name}:`, error.message)
      }
    }

    console.log('✅ All categories seeded successfully!')
  } catch (error) {
    console.error('❌ Error reading categories file:', error.message)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  })