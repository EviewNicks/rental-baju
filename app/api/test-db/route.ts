import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Test koneksi
    await prisma.$connect();

    // Test query sederhana
    const userCount = await prisma.user.count();

    // Test insert dan delete
    const testUser = await prisma.user.create({
      data: {
        name: 'API Test User',
        email: `test-${Date.now()}@example.com`,
      },
    });

    await prisma.user.delete({
      where: { id: testUser.id },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Database connection and operations working correctly',
      userCount,
      testResult: 'All operations successful',
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
