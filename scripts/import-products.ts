/**
 * Import Products Script
 *
 * Imports products from JSON files into database
 * Supports multiple product types: Organza, Renda Premium
 * Uses ProductService for consistent validation and business logic
 *
 * Usage:
 * - Dry run: DRY_RUN=true PRODUCT_TYPE=organza tsx scripts/import-organza-products.ts
 * - Dry run: DRY_RUN=true PRODUCT_TYPE=renda-premium tsx scripts/import-organza-products.ts
 * - Actual import: PRODUCT_TYPE=organza tsx scripts/import-organza-products.ts
 * - Actual import: PRODUCT_TYPE=renda-premium tsx scripts/import-organza-products.ts
 */

import { prisma } from '../lib/prisma'
import { ProductService } from '../features/manage-product/services/productService'
import { FileUploadService } from '../features/manage-product/services/fileUploadService'
import * as fs from 'fs'
import * as path from 'path'

const isDryRun = process.env.DRY_RUN === 'true'
const DEFAULT_USER_ID = process.env.IMPORT_USER_ID || 'system_import'
const DEFAULT_PRODUCT_IMAGE = '/products/image.png'

interface ProductData {
  code: string
  name: string
  description: string
  modalAwal: number
  currentPrice: number
  quantity: number
  categoryId: string
  imageUrl: string
  sizes: Array<{
    ageCategory: 'ADULT' | 'CHILD' | 'UNIVERSAL'
    size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'UNIVERSAL'
    quantity: number
  }>
}

interface ImportResult {
  success: boolean
  total: number
  imported: number
  skipped: number
  failed: number
  errors: Array<{
    code: string
    name: string
    error: string
  }>
}

/**
 * Normalize CSV size values to SizeEnum
 * Maps "All size" → "UNIVERSAL"
 */
function normalizeSize(csvSize: string): 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'UNIVERSAL' {
  const sizeMap: Record<string, 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'UNIVERSAL'> = {
    'All size': 'UNIVERSAL',
    'all size': 'UNIVERSAL',
    'ALL SIZE': 'UNIVERSAL',
    'Universal': 'UNIVERSAL',
    'UNIVERSAL': 'UNIVERSAL',
    'XS': 'XS',
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    'XXL': 'XXL',
  }

  const normalized = sizeMap[csvSize]
  if (!normalized) {
    throw new Error(
      `Invalid size value: "${csvSize}". Supported: ${Object.keys(sizeMap).join(', ')}`,
    )
  }

  return normalized
}

/**
 * Normalize age category values
 * Maps "DEWASA" → "ADULT", "ANAK" → "CHILD"
 */
function normalizeAgeCategory(csvCategory: string): 'ADULT' | 'CHILD' | 'UNIVERSAL' {
  const categoryMap: Record<string, 'ADULT' | 'CHILD' | 'UNIVERSAL'> = {
    DEWASA: 'ADULT',
    ADULT: 'ADULT',
    ANAK: 'CHILD',
    CHILD: 'CHILD',
    UNIVERSAL: 'UNIVERSAL',
  }

  const normalized = categoryMap[csvCategory.toUpperCase()]
  if (!normalized) {
    throw new Error(
      `Invalid age category: "${csvCategory}". Supported: DEWASA, ANAK, UNIVERSAL`,
    )
  }

  return normalized
}

async function validateCategory(categoryId: string): Promise<boolean> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  })
  return !!category
}

async function checkDuplicates(products: ProductData[]): Promise<string[]> {
  const codes = products.map((p) => p.code)
  const existingProducts = await prisma.product.findMany({
    where: {
      code: { in: codes },
      isActive: true,
    },
    select: { code: true },
  })
  return existingProducts.map((p) => p.code)
}

async function uploadImageToSupabase(
  product: ProductData,
  userId: string,
  productType: string,
): Promise<string> {
  try {
    // Extract expected filename from imageUrl
    const expectedFilename = path.basename(product.imageUrl)
    const baseDir = path.join(__dirname, `../public/products/${productType}`)

    // Try multiple filename variations (handle mismatches like OLL01 vs OLL1)
    const codeWithoutZero = product.code.replace(/0(\d)$/, '$1') // OLL01 -> OLL1
    const variations = [
      expectedFilename,
      `${product.code}.jpg`,
      `${product.code}.JPG`,
      `${codeWithoutZero}.jpg`,
      `${codeWithoutZero}.JPG`,
      expectedFilename.toLowerCase(),
      expectedFilename.toUpperCase(),
    ]

    let imagePath: string | null = null
    for (const variation of variations) {
      const testPath = path.join(baseDir, variation)
      if (fs.existsSync(testPath)) {
        imagePath = testPath
        break
      }
    }

    // If image not found, return default image as fallback
    if (!imagePath) {
      console.warn(`   ⚠️  Image not found for ${product.code}, using default image`)
      return DEFAULT_PRODUCT_IMAGE
    }

    // Read file as buffer
    const buffer = fs.readFileSync(imagePath)
    const filename = path.basename(imagePath)

    // Upload to Supabase using buffer method (skip Zod validation)
    const fileUploadService = new FileUploadService(userId)
    const uploadResult = await fileUploadService.uploadProductImageFromBuffer(
      buffer,
      filename,
      product.code,
    )

    if (uploadResult?.url) {
      console.log(`   ✅ Image uploaded: ${uploadResult.url}`)
      return uploadResult.url
    }

    // Fallback if upload returns null
    console.warn(`   ⚠️  Upload returned null for ${product.code}, using default image`)
    return DEFAULT_PRODUCT_IMAGE
  } catch (error) {
    console.error(
      `   ❌ Upload failed for ${product.code}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    console.log(`   💡 Using default image as fallback`)
    return DEFAULT_PRODUCT_IMAGE
  }
}

async function importProducts(): Promise<ImportResult> {
  const productType = process.env.PRODUCT_TYPE || 'organza'

  const result: ImportResult = {
    success: true,
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  try {
    console.log(`🚀 Starting ${productType} Products Import...`)
    console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (No database changes)' : 'LIVE IMPORT'}`)
    console.log('')

    // Validate product type
    const validProductTypes = ['organza', 'renda-premium', 'renda', 'jas-jaguar', 'jas-polos', 'jas-premium', 'jas-renda', 'gamis-anak', 'gamis-dewasa', 'gamis-tanggung', 'gamis-dewasa', 'anting', 'bando-besar', 'bando-kecil', 'gelang', 'kalung', 'sarung', 'songket']
    if (!validProductTypes.includes(productType)) {
      throw new Error(
        `Invalid PRODUCT_TYPE: ${productType}. Valid types: ${validProductTypes.join(', ')}`,
      )
    }

    // Validate Supabase environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasSupabaseConfig = !!(supabaseUrl && supabaseKey)

    if (!hasSupabaseConfig && !isDryRun) {
      console.warn('⚠️  Supabase credentials not configured')
      console.warn('   Images will use direct file paths as fallback')
      console.warn(
        '   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable uploads',
      )
      console.log('')
    } else if (hasSupabaseConfig && !isDryRun) {
      console.log('✅ Supabase configuration detected - images will be uploaded')
      console.log('')
    }

    const jsonFileName =
      productType === 'organza'
        ? 'organza-products.json'
        : productType === 'renda-premium'
          ? 'renda-premium-products.json'
          : productType === 'renda'
            ? 'renda-products.json'
            : productType === 'jas-jaguar'
              ? 'jas-jaguar-products.json'
              : productType === 'jas-polos'
                ? 'jas-polos-products.json'
                : productType === 'jas-premium'
                  ? 'jas-premium-products.json'
                  : productType === 'jas-renda'
                    ? 'jas-renda-products.json'
                    : productType === 'gamis-anak'
                      ? 'gamis-anak-products.json'
                      : productType === 'gamis-dewasa'
                        ? 'gamis-dewasa-products.json'
                        : productType === 'gamis-tanggung'
                          ? 'gamis-tanggung-products.json'
                          : productType === 'gamis-dewasa'
                            ? 'gamis-dewasa-products.json'
                            : productType === 'anting'
                              ? 'anting.json'
                              : productType === 'bando-besar'
                                ? 'bando-besar.json'
                                : productType === 'bando-kecil'
                                  ? 'bando-kecil.json'
                                  : productType === 'gelang'
                                    ? 'gelang.json'
                                    : productType === 'kalung'
                                      ? 'kalung.json'
                                      : productType === 'sarung'
                                        ? 'sarung.json'
                                        : productType === 'songket'
                                          ? 'songket.json'
                                          : 'unknown-products.json'
    const jsonPath = path.join(__dirname, `../prisma/seed/${jsonFileName}`)

    if (!fs.existsSync(jsonPath)) {
      throw new Error(`JSON file not found at: ${jsonPath}`)
    }

    const products: ProductData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    result.total = products.length

    console.log(`📦 Found ${products.length} products to import`)
    console.log('')

    if (products.length === 0) {
      console.log('⚠️  No products found in JSON file')
      return result
    }

    const categoryId = products[0].categoryId
    console.log(`🔍 Validating category: ${categoryId}`)
    const categoryExists = await validateCategory(categoryId)

    if (!categoryExists) {
      throw new Error(`Category ${categoryId} not found in database`)
    }
    console.log('✅ Category validation passed')
    console.log('')

    console.log('🔍 Checking for duplicate product codes...')
    const duplicateCodes = await checkDuplicates(products)

    if (duplicateCodes.length > 0) {
      console.log(`⚠️  Found ${duplicateCodes.length} duplicate codes:`, duplicateCodes.join(', '))
      console.log('These products will be skipped')
      console.log('')
    } else {
      console.log('✅ No duplicate codes found')
      console.log('')
    }

    if (isDryRun) {
      console.log('✅ DRY RUN VALIDATION COMPLETE')
      console.log('')
      console.log('📊 Summary:')
      console.log(`   Total products: ${result.total}`)
      console.log(`   Would import: ${result.total - duplicateCodes.length}`)
      console.log(`   Would skip (duplicates): ${duplicateCodes.length}`)
      console.log('')
      console.log('💡 Run without DRY_RUN=true to perform actual import')

      result.imported = result.total - duplicateCodes.length
      result.skipped = duplicateCodes.length
      return result
    }

    console.log('💾 Starting database import...')
    console.log('')

    const productService = new ProductService(prisma, DEFAULT_USER_ID)

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const progress = `[${i + 1}/${products.length}]`

      try {
        if (duplicateCodes.includes(product.code)) {
          console.log(`⏭️  ${progress} Skipping ${product.code} (duplicate)`)
          result.skipped++
          continue
        }

        console.log(`📝 ${progress} Importing ${product.code} - ${product.name}`)

        // Upload image to Supabase (skip in dry-run mode)
        let finalImageUrl = product.imageUrl
        if (!isDryRun && hasSupabaseConfig) {
          console.log(`   📸 Uploading image...`)
          finalImageUrl = await uploadImageToSupabase(product, DEFAULT_USER_ID, productType)
        }

        await productService.createProduct({
          code: product.code,
          name: product.name,
          description: product.description,
          modalAwal: product.modalAwal,
          currentPrice: product.currentPrice,
          quantity: product.quantity,
          categoryId: product.categoryId,
          imageUrl: finalImageUrl,
          sizes: product.sizes,
        })

        console.log(`   ✅ Success (${product.sizes.length} sizes created)`)
        result.imported++
      } catch (error) {
        console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.failed++
        result.errors.push({
          code: product.code,
          name: product.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('')
    console.log('✅ IMPORT COMPLETE')
  } catch (error) {
    console.error('')
    console.error('❌ IMPORT FAILED')
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    result.success = false
    throw error
  }

  return result
}

async function main() {
  try {
    const result = await importProducts()

    console.log('')
    console.log('='.repeat(50))
    console.log('📊 IMPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Total products: ${result.total}`)
    console.log(`Imported: ${result.imported}`)
    console.log(`Skipped: ${result.skipped}`)
    console.log(`Failed: ${result.failed}`)

    if (result.errors.length > 0) {
      console.log('')
      console.log('❌ Errors:')
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.code} (${err.name}): ${err.error}`)
      })
    }

    console.log('='.repeat(50))
    console.log('')

    if (!result.success || result.failed > 0) {
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}

export { importProducts, normalizeSize, normalizeAgeCategory }
