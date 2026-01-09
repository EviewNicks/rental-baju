/**
 * Import Kasir Script
 *
 * Creates initial kasir accounts for Ina, Naya, and Tiara
 * Handles duplicate detection and proper error handling
 *
 * Usage:
 * - Dry run: DRY_RUN=true tsx scripts/import-kasir.ts
 * - Actual import: tsx scripts/import-kasir.ts
 */

import { prisma } from '../lib/prisma'

const isDryRun = process.env.DRY_RUN === 'true'
const DEFAULT_USER_ID = process.env.IMPORT_USER_ID || 'system_import'

interface KasirData {
  id?: string // Optional ID for special accounts like Owner
  nama: string
  isActive: boolean
  createdBy: string
}

interface ImportResult {
  success: boolean
  total: number
  imported: number
  skipped: number
  failed: number
  errors: Array<{
    nama: string
    error: string
  }>
}

const KASIR_ACCOUNTS: KasirData[] = [
  {
    id: 'owner-system', // Special ID for Owner
    nama: 'Owner',
    isActive: true,
    createdBy: 'system',
  },
  {
    nama: 'Ina',
    isActive: true,
    createdBy: DEFAULT_USER_ID,
  },
  {
    nama: 'Naya',
    isActive: true,
    createdBy: DEFAULT_USER_ID,
  },
  {
    nama: 'Tiara',
    isActive: true,
    createdBy: DEFAULT_USER_ID,
  },
]

async function checkExistingKasir(kasirList: KasirData[]): Promise<string[]> {
  const names = kasirList.map((k) => k.nama)
  const existingKasir = await prisma.kasir.findMany({
    where: {
      nama: { in: names },
    },
    select: { nama: true },
  })
  return existingKasir.map((k) => k.nama)
}

async function importKasir(): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  try {
    console.log('🚀 Starting Kasir Import...')
    console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (No database changes)' : 'LIVE IMPORT'}`)
    console.log('')

    result.total = KASIR_ACCOUNTS.length

    console.log(`👥 Found ${KASIR_ACCOUNTS.length} kasir accounts to create:`)
    KASIR_ACCOUNTS.forEach((kasir, idx) => {
      console.log(`   ${idx + 1}. ${kasir.nama} (Active: ${kasir.isActive})`)
    })
    console.log('')

    console.log('🔍 Checking for existing kasir accounts...')
    const existingNames = await checkExistingKasir(KASIR_ACCOUNTS)

    if (existingNames.length > 0) {
      console.log(`⚠️  Found ${existingNames.length} existing accounts:`, existingNames.join(', '))
      console.log('These accounts will be skipped')
      console.log('')
    } else {
      console.log('✅ No existing accounts found')
      console.log('')
    }

    if (isDryRun) {
      console.log('✅ DRY RUN VALIDATION COMPLETE')
      console.log('')
      console.log('📊 Summary:')
      console.log(`   Total kasir accounts: ${result.total}`)
      console.log(`   Would create: ${result.total - existingNames.length}`)
      console.log(`   Would skip (existing): ${existingNames.length}`)
      console.log('')
      console.log('💡 Run without DRY_RUN=true to perform actual import')

      result.imported = result.total - existingNames.length
      result.skipped = existingNames.length
      return result
    }

    console.log('💾 Starting kasir account creation...')
    console.log('')

    for (let i = 0; i < KASIR_ACCOUNTS.length; i++) {
      const kasir = KASIR_ACCOUNTS[i]
      const progress = `[${i + 1}/${KASIR_ACCOUNTS.length}]`

      try {
        if (existingNames.includes(kasir.nama)) {
          console.log(`⏭️  ${progress} Skipping ${kasir.nama} (already exists)`)
          result.skipped++
          continue
        }

        console.log(
          `👤 ${progress} Creating kasir account: ${kasir.nama}${kasir.id ? ` (ID: ${kasir.id})` : ''}`,
        )

        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createData: any = {
          nama: kasir.nama,
          isActive: kasir.isActive,
          createdBy: kasir.createdBy,
        }

        // Add custom ID if specified (for Owner)
        if (kasir.id) {
          createData.id = kasir.id
        }

        await prisma.kasir.create({
          data: createData,
        })

        console.log(`   ✅ Success - ${kasir.nama} account created`)
        result.imported++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.log(`   ❌ Failed to create ${kasir.nama}: ${errorMsg}`)
        result.failed++
        result.errors.push({
          nama: kasir.nama,
          error: errorMsg,
        })
      }
    }

    console.log('')
    console.log('✅ KASIR IMPORT COMPLETE')

    // Verify all accounts were created
    console.log('')
    console.log('🔍 Verifying kasir accounts...')
    const finalKasir = await prisma.kasir.findMany({
      where: {
        nama: { in: KASIR_ACCOUNTS.map((k) => k.nama) },
      },
      select: { nama: true, isActive: true, createdAt: true },
    })

    console.log(`✅ Found ${finalKasir.length} kasir accounts in database:`)
    finalKasir.forEach((kasir) => {
      console.log(
        `   - ${kasir.nama} (Active: ${kasir.isActive}, Created: ${kasir.createdAt.toISOString()})`,
      )
    })

    if (finalKasir.length !== KASIR_ACCOUNTS.length) {
      console.log(`⚠️  Expected ${KASIR_ACCOUNTS.length} accounts, found ${finalKasir.length}`)
    }
  } catch (error) {
    console.error('')
    console.error('❌ KASIR IMPORT FAILED')
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    result.success = false
    throw error
  }

  return result
}

async function main() {
  try {
    const result = await importKasir()

    console.log('')
    console.log('='.repeat(50))
    console.log('📊 KASIR IMPORT SUMMARY')
    console.log('='.repeat(50))
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Total kasir accounts: ${result.total}`)
    console.log(`Created: ${result.imported}`)
    console.log(`Skipped: ${result.skipped}`)
    console.log(`Failed: ${result.failed}`)

    if (result.errors.length > 0) {
      console.log('')
      console.log('❌ Errors:')
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.nama}: ${err.error}`)
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

export { importKasir }
