# CLAUDE.md

Nama Saya adalah Ardiansyah

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Name:** Maguru - Sistem Manajemen Penyewaan Pakaian (Rental Clothing Management System)  
**Tech Stack:** Next.js 15, TypeScript, Prisma, Supabase, TailwindCSS, React Query, Jest, Playwright  
**Developer:** Ardiansyah Arifin

### Role-Based Access Control

- **Owner:** Full access to all features (`/owner/*`, `/producer/*`, `/dashboard/*`)
- **Producer:** Product management and kasir features (`/producer/*`, `/dashboard/*`)
- **Kasir:** Transaction management only (`/dashboard/*`)
- Roles managed via Clerk custom session claims

## Plan & Review

- Always in Plan mode to make a plan
- after get the plan, make sure you write the plan to .claude/tasks/TASK_NAME.md
- after task compleated, make sure you write the report to .claude/reports/TASK_NAME.md
- The plan should be a detailed implementation plan and the reasoning behind them, as well as tasks broken down
- if the task require external knowledge or certain package, also research to get latest knowledge (use Task tool for research)
- Don't over plan it, always think MVP.
- Once you write the plan, foirstly ask me to review it. Do not continue untill i approve the plan

### While Implementing

- You should update the plan as you work
- after you complete tasks in the plan, you should update and append detailed description of the changes you made, so following tasks can be easily hand over to other engineers.

## Architecture

### Core Principles

- **Feature-First Architecture:** Code organized by business features in `/features/[feature-name]/`
- **3-Tier Modular Monolith:** Presentation → Business Logic → Data Access
- **Simple State Management:** Feature Context (global) + Custom Hooks (feature) + useState (component)

### Layer Structure per Feature

```
features/[feature-name]/
├── components/     # UI Components (Presentation Layer)
├── hooks/         # Business Logic + State Management
├── services/      # Business Logic (Server-side CRUD operations)
├── api.ts         # API client/fetcher for this feature
├── types/         # TypeScript types & schemas
└── context/       # Global state (when needed across components)
```

### Tech Stack Implementation

- **Frontend:** Next.js App Router, React 19, TypeScript strict mode
- **Backend:** Next.js API Routes with Prisma ORM
- **Database:** PostgreSQL via Supabase
- **State Management:** React Query + Custom Hooks pattern
- **Styling:** TailwindCSS with Radix UI components
- **Authentication:** Clerk
- **File Upload:** Supabase Storage

## Commands

### Development

```bash
yarn app                    # Start development server (with Turbopack)
yarn app:prod              # Start with production environment
yarn build                 # Build for production
yarn start                 # Start production server
```

### Code Quality

```bash
yarn lint                  # Run ESLint (zero warnings policy)
yarn lint:fix              # Auto-fix linting issues
yarn type-check            # TypeScript type checking
```

### Testing Strategy

```bash
# Unit Tests (TDD approach)
yarn test:unit              # Run unit tests for specific feature
yarn test:unit:all          # Run all unit tests

# Integration Tests (2-layer integration)
yarn test:int               # Run integration tests for specific feature
yarn test:int:all           # Run all integration tests

# E2E Tests (BDD approach with Playwright)
yarn test:e2e               # Run E2E tests for specific feature
yarn test:e2e:all           # Run all E2E tests
yarn test:e2e:ui            # Run E2E tests with UI
yarn test:e2e:debug         # Debug specific E2E test
yarn test:e2e:report        # View test reports

# Coverage
yarn test:coverage          # Run tests with coverage report (minimum 80% target)
```

**Testing Approach:**

- **TDD:** Red → Green → Refactor cycle for unit/integration tests
- **BDD:** Given-When-Then structure for E2E tests using Playwright
- **MSW:** Mock Service Worker for API mocking in integration tests
- **Co-location:** Unit tests alongside implementation files (`.test.ts`)

### Database

```bash
yarn test:db               # Test database connection
yarn env:validate          # Validate environment variables
```

## Development Workflow

### Feature Development Pattern

1. **API Layer:** Create/update API routes in `app/api/[feature]/route.ts`
2. **Service Layer:** Implement business logic in `features/[feature]/services/`
3. **Data Layer:** Use Prisma for database operations
4. **Hook Layer:** Create custom hooks in `features/[feature]/hooks/`
5. **Component Layer:** Build UI components in `features/[feature]/components/`
6. **Integration:** Wire everything together via `features/[feature]/api.ts`

### Testing Approach (TDD/BDD)

- **Unit Tests:** Co-located with implementation files (`.test.ts` files)
- **Integration Tests:** Located in `__tests__/integration/[feature]/`
- **E2E Tests:** Located in `__tests__/playwright/[feature]/` using BDD format
- **Test-First Development:** Write tests before implementation

### Code Standards

- **Files:** kebab-case (`product-form.tsx`)
- **Components:** PascalCase (`ProductForm.tsx`)
- **Hooks:** `use` + CamelCase (`useProductData.ts`)
- **Services:** Entity + `Service.ts` (`productService.ts`)
- **API Clients:** Entity + `Api.ts` (`productApi.ts`)

## Key Implementation Details

### Error Handling

- Custom error classes in `features/[feature]/lib/errors/`
- Graceful fallbacks for all async operations
- Comprehensive logging with retry mechanisms
- Error boundaries for React components

### Data Flow Example (Product Management)

1. UI Component calls `useProducts()` hook
2. Hook uses React Query to call `productApi.getProducts()`
3. API client makes request to `/app/api/products/route.ts`
4. API route uses `ProductService` for business logic
5. Service uses Prisma to query database
6. Response flows back through the layers with proper type safety

### Authentication & Authorization

- **Clerk** for authentication with custom role-based session claims
- **Role-based routing** enforced in `middleware.ts`:
  - Owner routes: `/owner/*` (owner only)
  - Producer routes: `/producer/*` (owner & producer)
  - Kasir routes: `/dashboard/*` (all roles - note: uses `/dashboard` not `/kasir`)
- **API Protection** via Clerk's `auth.protect()` method
- **Unauthorized redirect** to `/unauthorized` page for access violations

### File Structure Highlights

- `app/` - Next.js App Router (pages, layouts, API routes)
- `features/` - Feature modules (complete business domains):
  - `auth/` - Authentication and role management
  - `homepage/` - Landing page components
  - `kasir/` - Transaction management system
  - `manage-product/` - Product and category management
  - `rentals-manage/` - Rental operations (in development)
- `lib/` - Shared utilities and configurations
- `components/ui/` - Reusable UI components (Radix + TailwindCSS)
- `prisma/` - Database schema and migrations
- `__tests__/` - Testing structure (integration, e2e)

## Architectural References

- Detailed architecture documentation: `/docs/rules/architecture.md`
- Test instruction guidelines: `/docs/rules/test-instruction.md`
- Design failure handling: `/docs/rules/designing-for-failure.md`

## Database Schema Overview

**Core Models:**

- `User` - Basic user information
- `Product` - Rental items with status tracking (AVAILABLE, RENTED, MAINTENANCE)
- `Category` - Product categorization with color-coded badges
- `Color` - Product color management

**Kasir Feature Models:**

- `Penyewa` - Customer/renter information
- `Transaksi` - Transaction records with status tracking
- `TransaksiItem` - Line items for transactions
- `Pembayaran` - Payment records
- `AktivitasTransaksi` - Transaction activity audit trail
- `FileUpload` - File management for various entities

**Key Database Patterns:**

- UUID primary keys with meaningful codes (Product.code, Transaksi.kode)
- Comprehensive indexing for performance
- Cascade deletes for related data integrity
- Audit trails via createdBy fields and activity logs

**API Response Patterns:**

- List endpoints return paginated results with `{ data: [], pagination: {}, summary: {} }` structure
- Transaction list includes `itemCount` field for performance (avoids loading full item details)
- Frontend transformation handles both full `items[]` arrays and fallback to `itemCount`

## Context Preservation

- Maintain architectural decisions throughout development sessions
- Reference implemented patterns for consistency across features
- Apply learned solutions to similar problems within the codebase
- Keep track of feature implementation status and dependencies
- Follow the modular monolith approach with feature-first organization

## Known Issues & Solutions

### Transaction Display Issue (Fixed - 2025-07-26)

**Problem**: Dashboard showing "Tidak ada transaksi ditemukan" despite API returning transaction data.

**Root Cause**: Backend API (`/api/kasir/transaksi`) returns `itemCount` field but not full `items[]` array. Frontend `useTransactions` hook expected `items` array and failed transformation when undefined.

**Solution Applied**:

1. **Frontend Fallback**: Modified `useTransactions.ts` line 65-66 to use `itemCount` as fallback:

   ```typescript
   items: transaction?.items?.map((item: any) => item?.produk?.name || '') ||
          (transaction?.itemCount ? [`${transaction.itemCount} item(s)`] : ['Tidak ada item']),
   ```

2. **UI Enhancement**: Added visual styling in `TransactionsTable.tsx` to distinguish fallback displays from actual item names.

**Future Enhancement**: Consider updating backend to include full `items` array with product details in GET `/api/kasir/transaksi` response.
