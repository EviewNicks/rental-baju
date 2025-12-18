# Database Migration Guide

Complete guide for migrating from test data to production data using real CSV files and images.

## Overview

This migration process replaces all existing test data with real production data from CSV files and product images. The migration includes:

- **Database cleanup**: Remove all existing test data
- **Category import**: Import product categories from JSON
- **Kasir import**: Create kasir accounts (Ina, Naya, Tiara)
- **Product import**: Import products with images from multiple product types
- **Validation**: Verify database integrity after migration

## Prerequisites

### Required Files

Ensure these files exist before running migration:

```
prisma/seed/
├── categories.json                 # Product categories
├── organza-products.json          # Organza products data
├── renda-premium-products.json    # Renda premium products data
└── [other-product-type].json      # Additional product types

public/products/
├── organza/                       # Organza product images
├── renda-premium/                 # Renda premium product images
└── [other-types]/                 # Additional product type images
```

### Environment Variables

Required environment variables:

```bash
# Database connection
DATABASE_URL="your_database_connection_string"

# Supabase configuration (for image uploads)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Optional: User ID for import operations
IMPORT_USER_ID="system_import"
```

### System Requirements

- Node.js 18+ with npm/yarn
- Database access (PostgreSQL)
- Supabase account (for image storage)
- Sufficient disk space for backups

## Migration Process

### Option 1: Full Automated Migration (Recommended)

Run the complete migration with orchestration script:

```bash
# Dry run (recommended first)
DRY_RUN=true tsx scripts/migrate-database.ts

# Full migration with default product types (organza, renda-premium)
tsx scripts/migrate-database.ts

# Migration with specific product types
PRODUCT_TYPES=organza,renda-premium,jas-jaguar tsx scripts/migrate-database.ts
```

### Option 2: Step-by-Step Manual Migration

For more control, run each step individually:

#### Step 1: Database Cleanup

```bash
# Dry run cleanup
npm run cleanup:db:dry

# Actual cleanup (creates backup automatically)
npm run cleanup:db
```

#### Step 2: Import Categories

```bash
# Dry run
npm run import:categories:dry

# Actual import
npm run import:categories
```

#### Step 3: Import Kasir Accounts

```bash
# Dry run
npm run import:kasir:dry

# Actual import
npm run import:kasir
```

#### Step 4: Import Products

```bash
# Import specific product type (dry run)
DRY_RUN=true PRODUCT_TYPE=organza npm run import:product

# Import specific product type (actual)
PRODUCT_TYPE=organza npm run import:product

# Import multiple product types
PRODUCT_TYPE=renda-premium npm run import:product
```

#### Step 5: Validate Database

```bash
# Full validation
tsx scripts/validate-database.ts

# Quick validation
QUICK_MODE=true tsx scripts/validate-database.ts
```

## Available Scripts

### Migration Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `migrate:full` | Complete migration (cleanup + categories + kasir) | `npm run migrate:full` |
| `migrate:full:dry` | Dry run of complete migration | `npm run migrate:full:dry` |

### Individual Component Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `cleanup:db` | Clean database with backup | `npm run cleanup:db` |
| `cleanup:db:dry` | Dry run database cleanup | `npm run cleanup:db:dry` |
| `import:categories` | Import categories from JSON | `npm run import:categories` |
| `import:categories:dry` | Dry run category import | `npm run import:categories:dry` |
| `import:kasir` | Import kasir accounts | `npm run import:kasir` |
| `import:kasir:dry` | Dry run kasir import | `npm run import:kasir:dry` |
| `import:product` | Import products (set PRODUCT_TYPE) | `npm run import:product` |
| `import:product:dry` | Dry run product import | `npm run import:product:dry` |

### Validation Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `tsx scripts/validate-database.ts` | Full database validation | Direct execution |
| `QUICK_MODE=true tsx scripts/validate-database.ts` | Quick validation | Direct execution |

## Product Types

Supported product types for import:

- `organza` - Organza products
- `renda-premium` - Premium renda products
- `renda` - Regular renda products
- `jas-jaguar` - Jaguar jackets
- `jas-polos` - Plain jackets
- `jas-premium` - Premium jackets
- `jas-renda` - Renda jackets
- `gamis-anak` - Children's gamis
- `gamis-dewasa` - Adult gamis
- `gamis-tanggung` - Medium gamis
- `anting` - Earrings
- `bando-besar` - Large headbands
- `bando-kecil` - Small headbands
- `gelang` - Bracelets
- `kalung` - Necklaces
- `sarung` - Sarongs
- `songket` - Songket products

## Safety Features

### Dry Run Mode

All scripts support dry run mode to preview changes without affecting the database:

```bash
DRY_RUN=true tsx scripts/[script-name].ts
```

### Automatic Backups

The cleanup script automatically creates JSON backups before deletion:

- Location: `backups/database-backup-[timestamp].json`
- Contains: Complete database snapshot
- Disable: Set `BACKUP_ENABLED=false`

### Duplicate Detection

All import scripts detect and skip existing records:

- Products: Skip by product code
- Categories: Skip by category ID
- Kasir: Skip by kasir name

### Error Handling

- **Graceful failures**: Optional steps continue on failure
- **Detailed logging**: Comprehensive error messages and progress tracking
- **Exit codes**: Proper exit codes for CI/CD integration

## Validation Checks

The validation script performs these checks:

### Table Counts
- Verifies expected record counts
- Checks for empty critical tables

### Foreign Key Constraints
- Product → Category relationships
- ProductSize → Product relationships
- Product → Material relationships
- Kasir account validity

### Business Rules
- All products have at least one size
- Product quantities match size totals
- Valid prices (> 0)
- Unique product codes
- Required kasir accounts exist

### Data Consistency
- No orphaned records
- Valid enum values
- No negative quantities
- Proper quantity calculations

## Troubleshooting

### Common Issues

#### 1. Missing Files
```
Error: Required file not found: prisma/seed/categories.json
```
**Solution**: Ensure all required JSON files exist in `prisma/seed/` directory

#### 2. Database Connection
```
Error: Can't reach database server
```
**Solution**: Check `DATABASE_URL` environment variable and database connectivity

#### 3. Supabase Upload Failures
```
Warning: Upload failed for [product], using default image
```
**Solution**: Check Supabase credentials and bucket permissions. Products will use fallback images.

#### 4. Duplicate Product Codes
```
Error: Unique constraint failed on the fields: (`code`)
```
**Solution**: Run cleanup script first or check for duplicate codes in JSON files

#### 5. Foreign Key Violations
```
Error: Foreign key constraint failed
```
**Solution**: Ensure categories are imported before products

### Recovery Procedures

#### Restore from Backup
```bash
# Backups are created automatically in backups/ directory
# Manual restore requires custom script (not provided)
```

#### Partial Migration Recovery
```bash
# Clean and restart from specific step
npm run cleanup:db
npm run import:categories
# Continue from where it failed...
```

#### Validation Failures
```bash
# Run validation to identify issues
tsx scripts/validate-database.ts

# Fix issues and re-run validation
QUICK_MODE=true tsx scripts/validate-database.ts
```

## Best Practices

### Before Migration
1. **Backup production database** (external backup)
2. **Test in staging environment** first
3. **Verify all files exist** and are valid
4. **Run dry-run mode** to preview changes
5. **Check disk space** for backups

### During Migration
1. **Monitor progress** through console output
2. **Don't interrupt** running processes
3. **Check for errors** in real-time
4. **Validate each step** if running manually

### After Migration
1. **Run full validation** to verify integrity
2. **Test application functionality** with new data
3. **Monitor application** for any issues
4. **Keep backups** for rollback if needed
5. **Document any issues** encountered

## Performance Considerations

### Large Datasets
- Migration time scales with data size
- Image uploads are the slowest part
- Consider running during low-traffic periods

### Resource Usage
- Database connections: Scripts use single connection
- Memory: Backups load entire database into memory
- Disk: Backups require significant disk space
- Network: Image uploads require stable internet

### Optimization Tips
- Use `QUICK_MODE=true` for faster validation
- Disable backups with `BACKUP_ENABLED=false` if not needed
- Run product imports in parallel for different types
- Use staging environment for testing

## Monitoring and Logging

### Log Locations
- Console output: Real-time progress and errors
- Migration reports: `migration-reports/migration-report-[timestamp].json`
- Backup files: `backups/database-backup-[timestamp].json`

### Key Metrics
- Total records processed
- Success/failure rates
- Processing time per step
- Error counts and types

### Alerts
Scripts exit with proper codes for monitoring:
- `0`: Success
- `1`: Failure or errors

## Support

### Getting Help
1. Check this documentation first
2. Review console output for specific errors
3. Run validation script to identify issues
4. Check troubleshooting section above

### Reporting Issues
When reporting issues, include:
- Complete error messages
- Environment details (Node.js version, OS)
- Steps to reproduce
- Migration report JSON (if available)

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Compatibility**: Node.js 18+, PostgreSQL, Supabase