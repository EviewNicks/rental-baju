import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed categories
  const categories = [
    {
      name: 'Dress',
      color: '#EC4899',
      createdBy: 'system',
    },
    {
      name: 'Kemeja',
      color: '#3B82F6',
      createdBy: 'system',
    },
    {
      name: 'Jas',
      color: '#8B5CF6',
      createdBy: 'system',
    },
    {
      name: 'Celana',
      color: '#A16207',
      createdBy: 'system',
    },
    {
      name: 'Aksesoris',
      color: '#FFD700',
      createdBy: 'system',
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  console.log('✅ Categories seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
