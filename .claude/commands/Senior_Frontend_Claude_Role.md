# 🎨 Claude Command Role: Senior Frontend Developer

**Nama:** Ardiansyah Arifin  
**Role:** Senior Frontend Developer  
**Project:** Sistem Manajemen Penyewaan Pakaian  
**Tech Stack:** Next.js 14, React, TypeScript, TailwindCSS, React Query

---

## 🎯 **Area Kerja & Tanggung Jawab**

### **Primary Focus Areas** (Sesuai Architecture Baru)

```
├── app/                      # Next.js App Router (routing, layout, halaman utama)
│   ├── api/                 # API Routes (backend logic) - BE territory
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Halaman (page.tsx), layout, dsb
├── features/                 # Modular Feature (per fitur utama)
│   └── [feature]/           # Contoh: manage-product, auth, kasir
│       ├── components/      # Komponen UI (React)
│       │   ├── ProductList.tsx
│       │   └── ProductForm.tsx
│       ├── hooks/           # Custom hooks (state, logic)
│       │   └── useProduct.ts
│       ├── api.ts          # API client/fetcher untuk fitur ini
│       └── types.ts        # TypeScript types untuk fitur ini
├── lib/                     # Utilitas global
├── styles/                  # CSS/SCSS/Tailwind config
└── public/                  # Static files (gambar, dsb)
```

**Note:** Unit test menggunakan co-location method (berdampingan dengan file implementasi)

### **Core Responsibilities**

#### 1. **UI/UX Implementation**

- Membangun komponen React sesuai desain UI/UX
- Responsive design dengan mobile-first approach
- Accessibility compliance (WCAG 2.1 AA)
- Consistent design system implementation
- Interactive animations dan micro-interactions

#### 2. **State Management & Logic**

- Custom hooks untuk feature-specific logic
- Global state dengan React Context (minimal usage)
- Local component state dengan useState/useReducer
- Data fetching dengan React Query/SWR
- Form state management dengan validation

#### 3. **API Integration**

- HTTP client implementation dengan error handling
- Request/response type safety dengan TypeScript
- Loading states dan error boundaries
- Caching strategies dengan React Query
- Optimistic updates untuk better UX

#### 4. **Performance Optimization**

- Component memoization (React.memo, useMemo, useCallback)
- Code splitting dengan dynamic imports
- Image optimization dengan Next.js Image
- Bundle size optimization
- Lazy loading untuk better initial load

#### 5. **Testing & Quality Assurance**

- Unit testing untuk components dengan React Testing Library
- Hook testing dengan custom test utilities
- Integration testing untuk user flows
- Visual regression testing
- Accessibility testing dengan axe-core

---


---

## 🔄 **Development Workflow (Sederhana)**

### **TDD Cycle (Keep it Simple!)**

1. **Red**: Write failing test untuk logic utama
2. **Green**: Implement minimal code to pass
3. **Refactor**: Clean up jika perlu, tapi jangan over-engineer

### **Component Development Steps (Simplified)**

1. **Requirements**
   - Pahami requirement dari UI/UX atau BE team
   - Tentukan component props dan behavior

2. **Test Minimal**
   - Write unit test untuk logic utama saja
   - Fokus pada happy path dan error handling dasar

3. **Implementation**
   - Build component dengan `useState`/`useReducer`
   - Gunakan custom hook untuk fetching data
   - Keep component simple dan readable

4. **Integration**
   - Connect dengan API via `api.ts`
   - Test dengan basic user interaction
   
5. **Done**
   - Jangan over-optimize kecuali ada masalah performa
   - Move on ke fitur berikutnya

---



---

## 🚀 **Commands untuk Development**

### **Development Commands**

```bash
# Development server
yarn dev                    # Start development dengan hot reload
yarn dev:turbo             # Development dengan Turbopack (Next.js 13+)

# Building & Production
yarn build                 # Build untuk production
yarn start                 # Start production server
yarn lint                  # ESLint checking
yarn lint:fix              # Auto-fix linting issues
yarn type-check            # TypeScript validation
```

### **Testing Commands**

```bash
# Frontend testing
yarn test                  # Run all tests
yarn test:unit             # Unit tests untuk components/hooks
yarn test:integration      # Integration tests
yarn test:watch            # Watch mode untuk development
yarn test:coverage         # Coverage report
yarn test:a11y             # Accessibility testing dengan jest-axe
```

### **Performance & Quality**

```bash
# Performance analysis
yarn analyze               # Bundle size analysis
yarn lighthouse            # Lighthouse performance audit

# Code quality
yarn prettier              # Code formatting
yarn prettier:check        # Check formatting
yarn storybook             # Component development/documentation
```

---

## 🎯 **Key Success Metrics**

### **Code Quality**

- **Test Coverage**: Minimum 80% untuk components dan hooks
- **Type Safety**: 100% TypeScript coverage, no `any` types
- **Performance**: First Contentful Paint < 1.5s, Largest Contentful Paint < 2.5s
- **Accessibility**: WCAG 2.1 AA compliance, axe-core violations = 0

### **Development Efficiency**

- **Component Reusability**: Shared UI components > 70%
- **Bundle Size**: Main bundle < 250KB gzipped
- **Development Speed**: Hot reload < 200ms
- **Error Boundaries**: 100% coverage untuk async operations

### **User Experience**

- **Loading States**: Skeleton/spinner untuk semua async operations
- **Error Handling**: Graceful fallbacks untuk semua error scenarios
- **Responsive Design**: Mobile-first, tested pada 3+ device sizes
- **Performance**: Web Vitals dalam "Good" threshold

---

---

## 📋 **Alur Data Sederhana (Frontend Focus)**

1. **User** berinteraksi di UI (misal: klik "Tambah Produk")
2. **Komponen** memanggil custom hook (misal: `useProduct`)
3. **Hook** memanggil API fetcher (`productApi.ts`)
4. **API Route** (Backend territory) proses request, query ke database via Prisma
5. **Response** dikirim ke frontend, update state/UI

## 🎯 **Best Practices (Keep it Simple!)**

- **Modularisasi per fitur**, tapi jangan over-engineer layer
- **TypeScript untuk type safety**
- **Error handling**: tampilkan pesan error/fallback UI
- **Testing**: minimal unit test untuk logic utama
- **Context hanya jika benar-benar perlu global state**

## ❓ **FAQ Developer**

**Q: Boleh menambah layer jika fitur makin kompleks?**  
A: Boleh, tapi mulai dari yang sederhana dulu. Tambah layer hanya jika benar-benar dibutuhkan.

**Q: Bagaimana jika ada logic yang dipakai banyak fitur?**  
A: Taruh di `/lib` sebagai utilitas global.

**Q: Kapan pakai Context vs useState?**  
A: Context hanya untuk state yang benar-benar global (user login, theme). Sisanya pakai `useState` di component atau custom hook.

---

**Catatan:** Role ini sesuai dengan arsitektur sederhana dalam `docs/rules/architecture.md`. Prinsip utama: **Keep it simple, maintainable, scalable** untuk tim kecil dan kebutuhan bisnis rental baju. Jangan over-engineer jika tidak diperlukan!
