/**
 * Database Migration Orchestration Script
 *
 * Coordinates complete database migration from test data to production data
 * Executes: cleanup → categories → kasir → products
 * 
 * Usage:
 * - Dry run: DRY_RUN=true tsx scripts/migrate-database.ts
 * - Actual migration: tsx scripts/migrate-database.ts
 * - With specific product types: PRODUCT_TYPES=organza,renda-premium tsx scripts/migrate-database.ts
 */

import { cleanupDatabase } from './cleanup-database'
import { importKasir } from './import-kasir'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const isDryRun = process.env.DRY_RUN === 'true'
const DEFAULT_PRODUCT_TYPES = ['organza', 'renda-premium']
const PRODUCT_TYPES = process.env.PRODUCT_TYPES 
  ? process.env.PRODUCT_TYPES.split(',').map(t => t.trim())
  : DEFAULT_PRODUCT_TYPES

interface MigrationStep {
  name: string
  description: string
  execute: () => Promise<void>
  required: boolean
}

interface MigrationResult {
  success: boolean
  totalSteps: number
  completedSteps: number
  failedSteps: number
  skippedSteps: number
  startTime: Date
  endTime?: Date
  duration?: number
  errors: Array<{
    step: string
    error: string
  }>
}

async function executeCommand(command: string, description: string): Promise<void> {
  console.log(`🔧 ${description}`)
  console.log(`   Command: ${command}`)
  
  if (isDryRun) {
    console.log('   ⏭️  Skipped (dry run mode)')
    return
  }

  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env, DRY_RUN: 'false' }
    })
    console.log('   ✅ Success')
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.log(`   ❌ Failed: ${errorMsg}`)
    throw new Error(`${description} failed: ${errorMsg}`)
  }
}

async function validatePrerequisites(): Promise<void> {
  console.log('🔍 Validating prerequisites...')
  
  // Check if required JSON files exist
  const requiredFiles = [
    'prisma/seed/categories.json',
    ...PRODUCT_TYPES.map(type => {
      const fileName = type === 'organza' ? 'organza-products.json' 
        : type === 'renda-premium' ? 'renda-premium-products.json'
        : `${type}-products.json`
      return `prisma/seed/${fileName}`
    })
  ]

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, `../${file}`)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file not found: ${file}`)
    }
    console.log(`   ✅ Found: ${file}`)
  }

  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL']
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable not set: ${envVar}`)
    }
    console.log(`   ✅ Environment variable set: ${envVar}`)
  }

  console.log('✅ All prerequisites validated')
  console.log('')
}

async function generateMigrationReport(result: MigrationResult): Promise<void> {
  const reportDir = path.join(__dirname, '../migration-reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(reportDir, `migration-report-${timestamp}.json`)

  const report = {
    ...result,
    environment: {
      isDryRun,
      productTypes: PRODUCT_TYPES,
      nodeVersion: process.version,
      platform: process.platform
    },
    summary: {
      status: result.success ? 'SUCCESS' : 'FAILED',
      successRate: `${Math.round((result.completedSteps / result.totalSteps) * 100)}%`,
      duration: result.duration ? `${Math.round(result.duration / 1000)}s` : 'N/A'
    }
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`📊 Migration report saved: ${reportPath}`)
}

async function runMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    totalSteps: 0,
    completedSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    startTime: new Date(),
    errors: []
  }

  try {
    console.log('🚀 Starting Database Migration...')
    console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (No database changes)' : 'LIVE MIGRATION'}`)
    console.log(`📦 Product types: ${PRODUCT_TYPES.join(', ')}`)
    console.log('')

    await validatePrerequisites()

    const steps: MigrationStep[] = [
      {
        name: 'cleanup',
        description: 'Clean existing database',
        required: true,
        execute: async () => {
          console.log('🗑️  Step 1: Database Cleanup')
          await cleanupDatabase()
        }
      },
      {
        name: 'categories',
        description: 'Import categories',
        required: true,
        execute: async () => {
          console.log('📂 Step 2: Import Categories')
          await executeCommand(
            `tsx scripts/import-categories.ts`,
            'Importing categories from JSON'
          )
        }
      },
      {
        name: 'kasir',
        description: 'Import kasir accounts',
        required: true,
        execute: async () => {
          console.log('👥 Step 3: Import Kasir Accounts')
          await importKasir()
        }
      },
      ...PRODUCT_TYPES.map((productType, index) => ({
        name: `products-${productType}`,
        description: `Import ${productType} products`,
        required: false,
        execute: async () => {
          console.log(`📦 Step ${4 + index}: Import ${productType} Products`)
          await executeCommand(
            `cross-env PRODUCT_TYPE=${productType} tsx scripts/import-products.ts`,
            `Importing ${productType} products`
          )
        }
      }))
    ]

    result.totalSteps = steps.length

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      
      try {
        console.log('')
        console.log('='.repeat(60))
        await step.execute()
        console.log('='.repeat(60))
        
        result.completedSteps++
        console.log(`✅ Step completed: ${step.name}`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.log(`❌ Step failed: ${step.name} - ${errorMsg}`)
        
        result.failedSteps++
        result.errors.push({
          step: step.name,
          error: errorMsg
        })

        if (step.required) {
          console.log('🛑 Required step failed, stopping migration')
          result.success = false
          break
        } else {
          console.log('⚠️  Optional step failed, continuing migration')
          result.skippedSteps++
        }
      }
    }

    result.endTime = new Date()
    result.duration = result.endTime.getTime() - result.startTime.getTime()

    console.log('')
    console.log('✅ MIGRATION COMPLETE')

  } catch (error) {
    console.error('')
    console.error('❌ MIGRATION FAILED')
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    result.success = false
    result.endTime = new Date()
    result.duration = result.endTime.getTime() - result.startTime.getTime()
    throw error
  }

  return result
}

async function main() {
  try {
    const result = await runMigration()

    console.log('')
    console.log('='.repeat(70))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(70))
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Total steps: ${result.totalSteps}`)
    console.log(`Completed: ${result.completedSteps}`)
    console.log(`Failed: ${result.failedSteps}`)
    console.log(`Skipped: ${result.skippedSteps}`)
    console.log(`Duration: ${result.duration ? Math.round(result.duration / 1000) : 'N/A'}s`)
    console.log(`Started: ${result.startTime.toISOString()}`)
    console.log(`Ended: ${result.endTime?.toISOString() || 'N/A'}`)

    if (result.errors.length > 0) {
      console.log('')
      console.log('❌ Errors:')
      result.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.step}: ${err.error}`)
      })
    }

    console.log('='.repeat(70))

    // Generate detailed report
    await generateMigrationReport(result)

    if (!result.success || result.failedSteps > 0) {
      process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { runMigration }