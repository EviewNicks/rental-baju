import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`
    console.log('📊 Database info:', result)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Connection failed:', error)
    process.exit(1)
  }
}

testConnection()
