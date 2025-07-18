# My name is Ardiansyah

# CLAUDE.md - Rental Software Project

## Project Overview

**Nama:** Sistem Manajemen Penyewaan Pakaian  
**Tech Stack:** Next.js 14, TypeScript, Prisma, Supabase, TailwindCSS, React Query, Jest, Playwright
**Developer:** Ardiansyah Arifin

## Arsitektur Utama

- **Feature-First:** Kode diorganisir di `/features/[feature-name]/`
- **3-Tier:** Presentation → Business Logic -> api layer -> service layer → Data Access
- **State Management:** Feature Context (global Feature) + Custom Hooks (feature) + useState (component)

## Struktur Folder

```

├── app/ # Next.js pages & API routes
├── features/           # Feature Modules (Modular Monolith - Semua layer per fitur)
│   └── [feature-name]/ # Contoh: manage-module
│       ├── components/ # Presentation Layer (UI Components)
│       ├── context/    # Global State Layer (Cross-component state, app-wide settings)
│       ├── hooks/      # Business Logic Layer (Client-side Orchestration, Feature State)
│       ├── adapters/   # Data Access Layer (Client-side interface to API)
│       ├── services/   # Business Logic Layer (Server-side Services)
│       ├── lib/        # Feature-specific Utilities
│       └── types/      # Feature-specific Types & Schemas
├── lib/ # Shared utilities Global
└── prisma/ # Database schema
└── __tests__/
    └── integration/
            └── Feature/
                └── Feature.integration.test.ts
    ├── playwright/
            └── Feature/
                └── Feature.spec.ts

```

## Coding Standards

- **Files:** kebab-case (`product-form.tsx`)
- **Components:** PascalCase (`ProductForm.tsx`)
- **Hooks:** `use` + CamelCase (`useProductData.ts`)
- **Services:** Entity + `Service.ts` (`productService.ts`)

## Testing Strategy

- **Unit:** Co-location dengan file implementasi
- **Integration:** `/__tests__/integration/` Pendekatan 2 Layer Integration 
- **E2E:** Playwright dengan BDD approach pada `/__tests__/palywright/`

**TDD Instruction** : TDD (Test Driven Development) adalah metode pengembangan perangkat lunak yang melibatkan pengujian secara terstruktur dan berurutan. TDD bertujuan untuk memastikan bahwa perangkat lunak yang dibuat dapat berjalan dengan baik tanpa menimbulkan kesalahan. Membuat Unit tets dan integration test sebelum menulis kode yang akan dibuat.

## Error Handling

- Graceful fallbacks untuk semua async operations
- Comprehensive logging
- Retry mechanisms untuk API calls

## File Access Rules

**✅ Allowed:** `/features/**/*`, `/app/**/*`, `/lib/**/*`, `/prisma/**/*`  
**❌ Restricted:** `node_modules/`, `.env*`, build artifacts

## Common Commands

```bash
yarn app          # Development
yarn build        # Build
yarn test         # All tests
yarn test:unit    # Unit tests only
yarn test:int     # Integration tests only
yarn test:e2e     # E2E tests
```

## Error Resolution

1. Check application logs
2. Verify database schema/migrations
3. Check API requests/responses
4. Review component props/state

## Context Preservation

### Session Continuity

- Maintain context across multiple file edits
- Preserve architectural decisions throughout session
- Remember previous error resolutions
- Keep track of implemented features and their status

### Knowledge Base

- Reference implemented patterns for consistency
- Apply learned solutions to similar problems
- Maintain awareness of project constraints and requirements

## Architecture Documentation

- Referensi arsitektur project tersimpan di `/docs/rules/architecture.md`
- Dokumentasi menjelaskan detail arsitektur, struktur folder, dan aturan pengembangan