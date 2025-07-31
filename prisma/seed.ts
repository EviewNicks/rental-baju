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

  // Seed colors
  const colors = [
    {
      name: 'Merah Marun',
      hexCode: '#800000',
      description: 'Warna merah tua yang elegan',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Biru Navy',
      hexCode: '#000080',
      description: 'Warna biru gelap yang profesional',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Hitam Pekat',
      hexCode: '#000000',
      description: 'Warna hitam klasik',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Putih Gading',
      hexCode: '#FFFDD0',
      description: 'Warna putih dengan nuansa krem',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Emas Champagne',
      hexCode: '#F7E7CE',
      description: 'Warna emas yang mewah',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Pink Dusty',
      hexCode: '#D4A5A5',
      description: 'Warna pink lembut yang feminin',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Hijau Emerald',
      hexCode: '#50C878',
      description: 'Warna hijau yang fresh',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Ungu Royal',
      hexCode: '#663399',
      description: 'Warna ungu yang mewah',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Abu-abu Silver',
      hexCode: '#C0C0C0',
      description: 'Warna abu-abu metalik',
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Coklat Mocca',
      hexCode: '#8B4513',
      description: 'Warna coklat hangat',
      isActive: true,
      createdBy: 'system',
    },
  ]

  for (const color of colors) {
    await prisma.color.upsert({
      where: { name: color.name },
      update: {},
      create: color,
    })
  }

  console.log('✅ Colors seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
