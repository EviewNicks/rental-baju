# Scripts Directory

Utility scripts untuk advanced size management migration dan system maintenance.

## Available Scripts

### `assess-legacy-products.ts`

**Purpose**: Analyzes current product data untuk understand migration scope ke advanced-only size management.

**Description**: Safe read-only script yang queries database untuk identify:
- Products with existing ProductSize records (advanced sizing)
- Products needing migration (legacy sizing)
- Migration complexity assessment
- Detailed migration strategy recommendations

**Usage**:
```bash
# Run assessment
npx tsx scripts/assess-legacy-products.ts

# Or with yarn
yarn tsx scripts/assess-legacy-products.ts
```

**Output**:
- Console report dengan detailed analysis
- JSON file dengan complete results (`assessment-result-YYYY-MM-DD.json`)

**Safety**: 100% safe - only performs READ operations, no data modifications.

**Dependencies**:
- Database connection (prisma)
- TypeScript execution environment (tsx)

---

## Migration Strategy

Based on assessment results, follow the 4-phase implementation plan:

1. **Phase 1**: Foundation (data assessment, new interfaces)
2. **Phase 2**: Infrastructure (advanced services, components)
3. **Phase 3**: Testing (migration testing, integration)
4. **Phase 4**: Cutover (atomic switch, cleanup)

## Safety Guidelines

- All migration scripts should be tested in development first
- Always create database backups before data modifications
- Use feature flags untuk gradual rollout
- Maintain rollback procedures untuk emergency recovery