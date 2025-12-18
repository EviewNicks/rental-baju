/**
 * Database Cleanup Script
 *
 * Safely removes all existing test data while preserving schema
 * Handles foreign key constraints and provides detailed reporting
 *
 * Usage:
 * - Dry run: DRY_RUN=true tsx scripts/cleanup-database.ts
 * - Actual cleanup: tsx scripts/cleanup-database.ts
 */

import { prisma } from '../lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

const isDryRun = process.env.DRY_RUN === 'true'
const BACKUP_ENABLED = process.env.BACKUP_ENABLED !== 'false' // Default to true

interface CleanupResult {
  success: boolean
  tablesProcessed: number
  recordsDeleted: number
  backupCreated: boolean
  backupPath?: string
  errors: Array<{
    table: string
    error: string
  }>
}

interface TableInfo {
  name: string
  count: number
}

async function getTableCounts(): Promise<TableInfo[]> {
  const tables = [
    'aktivitas_transaksi',
    'pembayaran', 
    'transaksi_item_return',
    'transaksi_item',
    'transaksi',
    'pengeluaran_kasir',
    'penyewa',
    'kasir',
    'product_sizes',
    'Product',
    'Category',
    'materials',
    'file_upload',
    'User'
  ]

  const counts: TableInfo[] = []
  
  for (const table of tables) {
    try {
      let count = 0
      switch (table) {
        case 'aktivitas_transaksi':
          count = await prisma.aktivitasTransaksi.count()
          break
        case 'pembayaran':
          count = await prisma.pembayaran.count()
          break
        case 'transaksi_item_return':
          count = await prisma.transaksiItemReturn.count()
          break
        case 'transaksi_item':
          count = await prisma.transaksiItem.count()
          break
        case 'transaksi':
          count = await prisma.transaksi.count()
          break
        case 'pengeluaran_kasir':
          count = await prisma.pengeluaranKasir.count()
          break
        case 'penyewa':
          count = await prisma.penyewa.count()
          break
        case 'kasir':
          count = await prisma.kasir.count()
          break
        case 'product_sizes':
          count = await prisma.productSize.count()
          break
        case 'Product':
          count = await prisma.product.count()
          break
        case 'Category':
          count = await prisma.category.count()
          break
        case 'materials':
          count = await prisma.material.count()
          break
        case 'file_upload':
          count = await prisma.fileUpload.count()
          break
        case 'User':
          count = await prisma.user.count()
          break
      }
      counts.push({ name: table, count })
    } catch (error) {
      console.warn(`⚠️  Could not count records in ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      counts.push({ name: table, count: 0 })
    }
  }

  return counts
}

async function createBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    if (!BACKUP_ENABLED) {
      console.log('📋 Backup disabled by BACKUP_ENABLED=false')
      return { success: true }
    }

    console.log('💾 Creating database backup...')
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `database-backup-${timestamp}.json`)

    // Get all data from database
    const backup = {
      timestamp: new Date().toISOString(),
      tables: {
        users: await prisma.user.findMany(),
        categories: await prisma.category.findMany(),
        materials: await prisma.material.findMany(),
        products: await prisma.product.findMany(),
        productSizes: await prisma.productSize.findMany(),
        kasir: await prisma.kasir.findMany(),
        penyewa: await prisma.penyewa.findMany(),
        transaksi: await prisma.transaksi.findMany(),
        transaksiItems: await prisma.transaksiItem.findMany(),
        transaksiItemReturns: await prisma.transaksiItemReturn.findMany(),
        pembayaran: await prisma.pembayaran.findMany(),
        aktivitasTransaksi: await prisma.aktivitasTransaksi.findMany(),
        pengeluaranKasir: await prisma.pengeluaranKasir.findMany(),
        fileUploads: await prisma.fileUpload.findMany()
      }
    }

    // Write backup to file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
    
    const stats = fs.statSync(backupPath)
    console.log(`   ✅ Backup created: ${backupPath}`)
    console.log(`   📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    
    return { success: true, path: backupPath }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`   ❌ Backup failed: ${errorMsg}`)
    return { success: false, error: errorMsg }
  }
}

async function cleanupDatabase(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    tablesProcessed: 0,
    recordsDeleted: 0,
    backupCreated: false,
    errors: []
  }

  try {
    console.log('🚀 Starting Database Cleanup...')
    console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (No database changes)' : 'LIVE CLEANUP'}`)
    console.log('')

    // Get initial counts
    console.log('📊 Current database state:')
    const initialCounts = await getTableCounts()
    let totalRecords = 0
    
    initialCounts.forEach(table => {
      if (table.count > 0) {
        console.log(`   ${table.name}: ${table.count} records`)
        totalRecords += table.count
      }
    })
    
    console.log(`   Total records: ${totalRecords}`)
    console.log('')

    if (totalRecords === 0) {
      console.log('✅ Database is already clean!')
      return result
    }

    // Create backup before cleanup (only if not dry run and has data)
    if (!isDryRun && totalRecords > 0) {
      const backupResult = await createBackup()
      result.backupCreated = backupResult.success
      if (backupResult.path) {
        result.backupPath = backupResult.path
      }
      if (!backupResult.success && BACKUP_ENABLED) {
        console.log('⚠️  Backup failed, but continuing with cleanup...')
        result.errors.push({
          table: 'backup',
          error: backupResult.error || 'Backup creation failed'
        })
      }
      console.log('')
    }

    if (isDryRun) {
      console.log('✅ DRY RUN VALIDATION COMPLETE')
      console.log('')
      console.log('📊 Summary:')
      console.log(`   Would delete ${totalRecords} records from ${initialCounts.filter(t => t.count > 0).length} tables`)
      console.log('')
      console.log('💡 Run without DRY_RUN=true to perform actual cleanup')
      
      result.tablesProcessed = initialCounts.filter(t => t.count > 0).length
      result.recordsDeleted = totalRecords
      return result
    }

    console.log('🗑️  Starting database cleanup...')
    console.log('⚠️  Deleting in order to respect foreign key constraints')
    console.log('')

    // Delete in correct order to respect foreign key constraints
    const deletionOrder = [
      { name: 'aktivitas_transaksi', fn: () => prisma.aktivitasTransaksi.deleteMany() },
      { name: 'pembayaran', fn: () => prisma.pembayaran.deleteMany() },
      { name: 'transaksi_item_return', fn: () => prisma.transaksiItemReturn.deleteMany() },
      { name: 'transaksi_item', fn: () => prisma.transaksiItem.deleteMany() },
      { name: 'transaksi', fn: () => prisma.transaksi.deleteMany() },
      { name: 'pengeluaran_kasir', fn: () => prisma.pengeluaranKasir.deleteMany() },
      { name: 'penyewa', fn: () => prisma.penyewa.deleteMany() },
      { name: 'kasir', fn: () => prisma.kasir.deleteMany() },
      { name: 'product_sizes', fn: () => prisma.productSize.deleteMany() },
      { name: 'Product', fn: () => prisma.product.deleteMany() },
      { name: 'Category', fn: () => prisma.category.deleteMany() },
      { name: 'materials', fn: () => prisma.material.deleteMany() },
      { name: 'file_upload', fn: () => prisma.fileUpload.deleteMany() },
      { name: 'User', fn: () => prisma.user.deleteMany() }
    ]

    for (const deletion of deletionOrder) {
      try {
        const initialCount = initialCounts.find(t => t.name === deletion.name)?.count || 0
        
        if (initialCount > 0) {
          console.log(`🗑️  Deleting ${deletion.name} (${initialCount} records)...`)
          const deleteResult = await deletion.fn()
          console.log(`   ✅ Deleted ${deleteResult.count} records`)
          
          result.tablesProcessed++
          result.recordsDeleted += deleteResult.count
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.log(`   ❌ Failed to delete ${deletion.name}: ${errorMsg}`)
        result.errors.push({
          table: deletion.name,
          error: errorMsg
        })
      }
    }

    console.log('')
    console.log('✅ DATABASE CLEANUP COMPLETE')

    // Verify cleanup
    console.log('')
    console.log('🔍 Verifying cleanup...')
    const finalCounts = await getTableCounts()
    const remainingRecords = finalCounts.reduce((sum, table) => sum + table.count, 0)
    
    if (remainingRecords === 0) {
      console.log('✅ All data successfully removed')
    } else {
      console.log(`⚠️  ${remainingRecords} records remain in database`)
      finalCounts.forEach(table => {
        if (table.count > 0) {
          console.log(`   ${table.name}: ${table.count} records`)
        }
      })
    }

  } catch (error) {
    console.error('')
    console.error('❌ CLEANUP FAILED')
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    result.success = false
    throw error
  }

  return result
}

async function main() {
  try {
    const result = await cleanupDatabase()

    console.log('')
    console.log('='.repeat(50))
    console.log('📊 CLEANUP SUMMARY')
    console.log('='.repeat(50))
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Tables processed: ${result.tablesProcessed}`)
    console.log(`Records deleted: ${result.recordsDeleted}`)
    console.log(`Backup created: ${result.backupCreated ? '✅ YES' : '❌ NO'}`)
    if (result.backupPath) {
      console.log(`Backup location: ${result.backupPath}`)
    }

    if (result.errors.length > 0) {
      console.log('')
      console.log('❌ Errors:')
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.table}: ${err.error}`)
      })
    }

    console.log('='.repeat(50))
    console.log('')

    if (!result.success || result.errors.length > 0) {
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

export { cleanupDatabase }