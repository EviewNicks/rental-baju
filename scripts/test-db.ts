import { prisma } from '../lib/prisma';

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Koneksi dasar
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test 2: Cek apakah tabel User ada
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `;
    console.log('✅ User table exists:', tableExists);

    // Test 3: Coba insert data test
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });
    console.log('✅ Insert test successful:', testUser);

    // Test 4: Coba query data
    const users = await prisma.user.findMany();
    console.log('✅ Query test successful, total users:', users.length);

    // Test 5: Cleanup - hapus data test
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('✅ Cleanup successful');

    console.log('�� All database tests passed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan test jika file dijalankan langsung
if (require.main === module) {
  testDatabaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testDatabaseConnection };
