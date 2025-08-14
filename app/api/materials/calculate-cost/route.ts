/**
 * API Route: Material Cost Calculation
 * 
 * POST /api/materials/calculate-cost - Calculate material cost untuk quantity tertentu
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { MaterialService } from '@/features/manage-product/services/materialService'
import { prisma } from '@/lib/prisma'
import { NotFoundError } from '@/features/manage-product/lib/errors/AppError'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 },
      )
    }

    // Parse JSON request body
    const body = await request.json()

    // Extract fields
    const { materialId, quantity } = body

    // Basic validation
    if (!materialId || typeof materialId !== 'string' || materialId.trim() === '') {
      return NextResponse.json(
        { error: { message: 'Material ID wajib diisi', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: { message: 'Quantity harus berupa angka positif', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    // Initialize service
    const materialService = new MaterialService(prisma, userId)

    // Calculate material cost
    const costCalculation = await materialService.calculateMaterialCost(materialId, quantity)

    return NextResponse.json(costCalculation, { status: 200 })
  } catch (error) {
    console.error('POST /api/materials/calculate-cost error:', error)

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { message: error.message, code: 'NOT_FOUND' } },
        { status: 404 },
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message, code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 },
    )
  }
}