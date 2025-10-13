import { prisma } from '../lib/prisma'

async function checkImages() {
  const products = await prisma.product.findMany({
    where: {
      categoryId: '912520ea-ad5a-4294-8057-e9084a871a05',
      isActive: true
    },
    select: {
      code: true,
      name: true,
      imageUrl: true
    },
    orderBy: {
      code: 'asc'
    }
  })

  console.log('Organza Products ImageURL Check:\n')
  products.forEach(p => {
    const isSupabase = p.imageUrl?.includes('supabase') || p.imageUrl?.includes('storage')
    const isDirect = p.imageUrl?.startsWith('/products/')
    console.log(`${p.code}: ${isSupabase ? '☁️  Supabase' : isDirect ? '📁 Direct' : '❓ Unknown'}`)
    console.log(`   ${p.imageUrl}`)
  })

  await prisma.$disconnect()
}

checkImages()
