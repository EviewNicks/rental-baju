# Task Plan: Perbaikan Styling UI Product Management (Revisi)

## Tugas Saya

Memperbaiki styling UI pada komponen Product Management (`SearchFilterBar.tsx`, `ProductTable.tsx`, `ProductGrid.tsx`) agar sesuai dengan design system yang telah didefinisikan dalam `uiux-consistency.md` dan `product-management.json`.

## Hasil Evaluasi Ulang (Revisi)

### ✅ Konfigurasi Tailwind v4 dan Shadcn UI Sudah Benar

Setelah membaca dokumentasi Tailwind v4 dan Shadcn UI, saya perlu membetulkan evaluasi sebelumnya:

**Tailwind Config (`tailwind.config.ts`)**:

- ✅ Konfigurasi minimal sudah sesuai dengan Tailwind v4
- ✅ Tidak perlu menambahkan `theme.extend` karena Tailwind v4 menggunakan CSS variables di `globals.css`
- ✅ Content paths sudah benar

**Globals CSS (`styles/globals.css`)**:

- ✅ Menggunakan `@theme` directive yang benar untuk Tailwind v4
- ✅ CSS variables sudah didefinisikan dengan benar
- ✅ Custom colors (gold, olive, dll) sudah tersedia
- ✅ Font family sudah dikonfigurasi

**Components JSON (`components.json`)**:

- ✅ Konfigurasi Shadcn UI sudah benar
- ✅ `cssVariables: true` sudah diaktifkan
- ✅ Base color "gray" sudah sesuai

### ❌ Masalah Sebenarnya

Masalah styling UI Product Management **BUKAN** disebabkan oleh konfigurasi Tailwind yang salah, melainkan:

1. **Komponen Custom Tidak Menggunakan CSS Variables yang Sudah Tersedia**
   - `SearchFilterBar.tsx`, `ProductTable.tsx`, `ProductGrid.tsx` menggunakan warna hardcoded
   - Tidak memanfaatkan custom colors (gold, olive, dll) yang sudah didefinisikan

2. **Shadcn UI Components Perlu Diupdate untuk Menggunakan Custom Colors**
   - Button component masih menggunakan default colors
   - Badge component tidak memiliki variants untuk status dan kategori

3. **Perlu Menambahkan CSS Variables untuk Shadcn UI Semantic Tokens**
   - Shadcn UI menggunakan semantic tokens (`primary`, `secondary`, dll)
   - Perlu mendefinisikan mapping dari custom colors ke semantic tokens

## Planning yang Perlu Dikerjakan (Revisi)

### Phase 1: Tambahkan Shadcn UI Semantic Tokens (Priority: HIGH)

#### 1.1 Update Globals CSS untuk Shadcn UI

**File**: `styles/globals.css`
**Tujuan**: Menambahkan CSS variables untuk Shadcn UI semantic tokens

**Tasks**:

- [ ] Tambahkan CSS variables untuk semantic tokens (primary, secondary, accent, dll)
- [ ] Map custom colors ke semantic tokens sesuai design system
- [ ] Pastikan dark mode support

**Expected Output**:

```css
:root {
  /* Shadcn UI Semantic Tokens */
  --background: var(--color-neutral-50);
  --foreground: var(--color-neutral-900);
  --card: var(--color-neutral-50);
  --card-foreground: var(--color-neutral-900);
  --popover: var(--color-neutral-50);
  --popover-foreground: var(--color-neutral-900);
  --primary: var(--color-gold-500);
  --primary-foreground: var(--color-neutral-900);
  --secondary: var(--color-blue-500);
  --secondary-foreground: var(--color-neutral-50);
  --muted: var(--color-neutral-100);
  --muted-foreground: var(--color-neutral-600);
  --accent: var(--color-olive-500);
  --accent-foreground: var(--color-neutral-900);
  --destructive: var(--color-red-500);
  --destructive-foreground: var(--color-neutral-50);
  --border: var(--color-neutral-200);
  --input: var(--color-neutral-200);
  --ring: var(--color-gold-500);
  --radius: var(--radius-lg);
}
```

### Phase 2: Update Shadcn UI Components (Priority: HIGH)

#### 2.1 Update Button Component

**File**: `components/ui/button.tsx`
**Tujuan**: Memastikan button menggunakan semantic tokens yang sudah didefinisikan

**Tasks**:

- [ ] Pastikan button variants menggunakan semantic tokens
- [ ] Test semua button variants dengan custom colors
- [ ] Validasi hover dan focus states

#### 2.2 Update Badge Component

**File**: `components/ui/badge.tsx`
**Tujuan**: Menambahkan variants untuk status dan kategori

**Tasks**:

- [ ] Tambahkan status badge variants (Tersedia, Disewa, Maintenance)
- [ ] Tambahkan category badge variants dengan warna yang sesuai
- [ ] Pastikan contrast ratio memenuhi accessibility standards

### Phase 3: Update Custom Components (Priority: MEDIUM)

#### 3.1 Update SearchFilterBar

**File**: `features/manage-product/components/products/SearchFilterBar.tsx`
**Tujuan**: Menggunakan semantic tokens dan custom colors

**Tasks**:

- [ ] Ganti warna hardcoded dengan semantic tokens
- [ ] Gunakan custom colors untuk accent elements
- [ ] Terapkan soft neumorphism effect pada card
- [ ] Update hover states dan focus states

#### 3.2 Update ProductTable

**File**: `features/manage-product/components/products/ProductTable.tsx`
**Tujuan**: Menerapkan design system pada tabel

**Tasks**:

- [ ] Update table styling dengan semantic tokens
- [ ] Terapkan soft neumorphism pada card container
- [ ] Update badge styling untuk status dan kategori
- [ ] Perbaiki hover states pada table rows

#### 3.3 Update ProductGrid

**File**: `features/manage-product/components/products/ProductGrid.tsx`
**Tujuan**: Menerapkan design system pada grid view

**Tasks**:

- [ ] Update card styling dengan semantic tokens
- [ ] Terapkan soft neumorphism effect
- [ ] Update badge styling
- [ ] Perbaiki hover states dan transitions

### Phase 4: Testing dan Validation (Priority: MEDIUM)

#### 4.1 Visual Testing

**Tujuan**: Memastikan UI sesuai dengan design system

**Tasks**:

- [ ] Test semua komponen di berbagai screen sizes
- [ ] Validasi color contrast untuk accessibility
- [ ] Test hover dan focus states
- [ ] Bandingkan dengan mockup/design reference

#### 4.2 Component Testing

**Tujuan**: Memastikan fungsionalitas tetap berjalan

**Tasks**:

- [ ] Test semua interactive elements
- [ ] Validasi responsive behavior
- [ ] Test dengan data real dan mock data

### Phase 5: Documentation Update (Priority: LOW)

#### 5.1 Update Component Documentation

**Tujuan**: Mendokumentasikan perubahan styling

**Tasks**:

- [ ] Update component documentation dengan styling guidelines
- [ ] Dokumentasikan color usage patterns
- [ ] Buat style guide untuk developer lain

## Acceptance Criteria (Revisi)

### Phase 1 - Shadcn UI Semantic Tokens

- [ ] CSS variables untuk semantic tokens terdefinisi dengan benar
- [ ] Custom colors ter-mapping ke semantic tokens
- [ ] Dark mode support berfungsi
- [ ] Shadcn UI components menggunakan semantic tokens

### Phase 2 - Shadcn UI Components

- [ ] Button component menggunakan primary color (gold)
- [ ] Badge component memiliki variants untuk status dan kategori
- [ ] Semua hover dan focus states berfungsi dengan benar
- [ ] Color contrast memenuhi accessibility standards

### Phase 3 - Custom Components

- [ ] SearchFilterBar menggunakan semantic tokens
- [ ] ProductTable memiliki styling yang konsisten
- [ ] ProductGrid menerapkan soft neumorphism effect
- [ ] Semua komponen responsive dan accessible

### Phase 4 - Testing

- [ ] UI sesuai dengan design system dan mockup
- [ ] Semua interactive elements berfungsi dengan benar
- [ ] Responsive design bekerja di semua screen sizes
- [ ] Accessibility requirements terpenuhi

## Timeline Estimation (Revisi)

- **Phase 1**: 1-2 jam (Shadcn UI semantic tokens)
- **Phase 2**: 1-2 jam (Shadcn UI components)
- **Phase 3**: 2-3 jam (Custom components styling)
- **Phase 4**: 1-2 jam (Testing dan validation)
- **Phase 5**: 1 jam (Documentation)

**Total Estimated Time**: 6-10 jam (lebih singkat dari estimasi sebelumnya)

## Risk Assessment (Revisi)

### Low Risk

- Perubahan hanya pada CSS variables dan component styling
- Tidak ada perubahan pada Tailwind config
- Shadcn UI components tetap kompatibel

### Medium Risk

- Custom styling mungkin memerlukan penyesuaian
- Responsive design mungkin terpengaruh

### Mitigation

- Test thoroughly setelah setiap phase
- Implement changes incrementally
- Test di berbagai browser dan devices

## Success Metrics

1. **Visual Consistency**: UI sesuai dengan design system (90%+ match)
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Performance**: Tidak ada regression pada loading time
4. **Responsiveness**: Berfungsi dengan baik di semua screen sizes
5. **Developer Experience**: Mudah untuk maintain dan extend

## Key Learning

- **Tailwind v4 menggunakan CSS variables di `globals.css`**, bukan di `tailwind.config.ts`
- **Shadcn UI membutuhkan semantic tokens** yang terdefinisi di CSS variables
- **Konfigurasi saat ini sudah benar**, masalahnya ada di penggunaan colors yang tidak konsisten
