# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Name:** Sistem Manajemen Penyewaan Pakaian (Rental Clothing Management System)  
**Tech Stack:** Next.js 15, TypeScript, Prisma, Supabase, TailwindCSS, React Query, Jest, Playwright  
**Developer:** Ardiansyah Arifin

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
yarn test:coverage          # Run tests with coverage report
```

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
- Clerk for authentication
- Role-based access control (Owner, Producer, Kasir)
- Middleware protection for routes and API endpoints

### File Structure Highlights
- `app/` - Next.js App Router (pages, layouts, API routes)
- `features/` - Feature modules (complete business domains)
- `lib/` - Shared utilities and configurations
- `components/ui/` - Reusable UI components (Radix + TailwindCSS)
- `prisma/` - Database schema and migrations
- `__tests__/` - Testing structure (integration, e2e)

## Architectural References
- Detailed architecture documentation: `/docs/rules/architecture.md`
- Test instruction guidelines: `/docs/rules/test-instruction.md`
- Design failure handling: `/docs/rules/designing-for-failure.md`

## Context Preservation
- Maintain architectural decisions throughout development sessions
- Reference implemented patterns for consistency across features
- Apply learned solutions to similar problems within the codebase
- Keep track of feature implementation status and dependencies