# Task Plan: Remove Color Management System

## 📋 Task Information
- **Task ID**: TASK-REMOVE-COLOR-001
- **Created**: 2025-01-15
- **Estimate**: 2-3 hours
- **Priority**: High
- **Risk Level**: Medium

## 🎯 Objective
Menghapus seluruh entitas color management dari sistem karena tidak digunakan lagi dalam aplikasi rental clothing.

## 🏗️ Current Architecture Analysis

### Files to Remove (Total: 15+ files)

#### Database Layer
- `prisma/schema.prisma` (Color model lines 69-83)
- `prisma/migrations/20250723091906_add_color_model_and_size_field/migration.sql`

#### API Layer
- `app/api/colors/route.ts`
- `app/api/colors/[id]/route.ts`
- `features/manage-product/services/colorService.ts`

#### Component Layer
- `features/manage-product/components/color/ColorForm.tsx`
- `features/manage-product/components/color/ColorList.tsx`
- `features/manage-product/components/color/ColorPreview.tsx`
- `features/manage-product/components/color/ColorDeleteConfirmationDialog.tsx`
- `features/manage-product/components/color/ColorManagement.tsx`

#### Type Definitions
- `features/manage-product/types/color.ts`
- `features/manage-product/lib/utils/color.ts`

#### Data & Tests
- `features/manage-product/data/mock-colors.ts`
- `features/manage-product/services/colorService.test.ts`

#### References to Update
- `features/manage-product/types/index.ts` (Color interfaces)
- `features/manage-product/lib/validation/productSchema.ts` (color schemas)
- `features/manage-product/services/productService.ts` (color references)
- `features/manage-product/components/form-product/ProductForm.tsx` (color selection)
- Multiple product display components

## 🔄 Execution Plan

### Phase 1: Database Schema Changes (30 minutes)
1. **Backup Database**
   ```bash
   npx prisma db push --preview-feature
   ```

2. **Remove Color Model from schema.prisma**
   - Delete lines 69-83 (Color model)
   - Remove `colorId` field from Product model (line 29)
   - Remove `color` relation from Product model (line 39)
   - Remove Color-related indexes (lines 49, 80-81)

3. **Create Migration**
   ```bash
   npx prisma migrate dev --name remove_color_system
   ```

4. **Generate New Prisma Client**
   ```bash
   npx prisma generate
   ```

### Phase 2: Backend Cleanup (45 minutes)

1. **Remove API Endpoints**
   ```bash
   rm -rf app/api/colors/
   ```

2. **Remove Service Layer**
   ```bash
   rm features/manage-product/services/colorService.ts
   rm features/manage-product/services/colorService.test.ts
   ```

3. **Update productService.ts**
   - Remove colorService imports
   - Remove color-related logic
   - Clean color references in product queries

4. **Update Validation Schemas**
   - Remove colorSchema from `productSchema.ts`
   - Remove color-related validation rules
   - Update product creation/update schemas

### Phase 3: Frontend Component Removal (60 minutes)

1. **Remove Color Components**
   ```bash
   rm -rf features/manage-product/components/color/
   ```

2. **Update ProductForm.tsx**
   - Remove color selection dropdown
   - Remove color state management
   - Clean color-related form validation

3. **Update Product Display Components**
   - Remove color badges/info from product cards
   - Update product detail views
   - Clean color-related conditional rendering

4. **Clean Type Definitions**
   - Remove Color interfaces from `types/index.ts`
   - Remove color-related request/response types
   - Update Product interfaces (remove colorId, color)

### Phase 4: Supporting Files Cleanup (30 minutes)

1. **Remove Utility Files**
   ```bash
   rm features/manage-product/types/color.ts
   rm features/manage-product/lib/utils/color.ts
   rm features/manage-product/data/mock-colors.ts
   ```

2. **Update API Client**
   - Remove color endpoints from `api.ts`
   - Clean color-related hooks (if any exist)

3. **Clean Imports**
   - Search and remove unused color imports
   - Fix any broken references

### Phase 5: Testing & Validation (30 minutes)

1. **Build Test**
   ```bash
   yarn build
   ```

2. **Type Check**
   ```bash
   yarn type-check
   ```

3. **Lint Check**
   ```bash
   yarn lint
   ```

4. **Manual Testing**
   - Test product creation flow
   - Test product listing/editing
   - Verify no broken UI elements

## ⚠️ Risk Assessment & Mitigation

### High Risk Areas
1. **ProductForm.tsx** - May have heavy color integration
2. **Database Migration** - Need to ensure no data loss
3. **Broken Imports** - Color references throughout codebase

### Mitigation Strategies
- **ColorId is nullable** - No existing data loss expected
- **Incremental Changes** - Test after each phase
- **Backup Plan** - Git commits after each major phase
- **Rollback Strategy** - Keep migration files for potential rollback

## 📝 Pre-Execution Checklist

- [ ] Git status is clean (no uncommitted changes)
- [ ] Database backup created
- [ ] All color usages identified in ProductForm.tsx
- [ ] Test environment ready
- [ ] Rollback plan prepared

## 🎯 Success Criteria

1. **Zero Build Errors** - Application builds successfully
2. **Zero Type Errors** - TypeScript compilation passes
3. **Product Management Works** - Create/edit/delete products function normally
4. **No Color References** - No color-related code remains in the system
5. **Tests Pass** - All existing tests continue to pass

## 📊 Post-Execution Tasks

1. **Update Documentation**
   - Update API documentation
   - Update feature documentation
   - Update database schema documentation

2. **Performance Verification**
   - Check database performance after migration
   - Verify no memory leaks from removed components

3. **Team Communication**
   - Notify team about color system removal
   - Update any external documentation

## 🚨 Emergency Rollback Plan

If critical issues arise:
1. Revert schema changes: `git checkout HEAD~1 -- prisma/schema.prisma`
2. Restore migration: `npx prisma migrate reset`
3. Restore files: `git checkout HEAD~1 -- features/manage-product/components/color/`
4. Test and verify system functionality

---

**Notes**:
- Color system was not heavily integrated (colorId nullable)
- Main impact is on ProductForm UI components
- Database changes are straightforward with minimal risk
- Plan allows for incremental testing and validation