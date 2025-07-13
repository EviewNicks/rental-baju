## **Instruksi Rules UI/UX Theme & Consistency Rental Software**

### **A. Prinsip Umum**

- **Theme:** Flat Modern profesional, dan e-commerce/dashboard modern. Banyak whitespace, layout grid rapi, komponen card, dan visual hierarchy yang jelas. Tidak ada efek 3D, glass, atau emboss.
- **Komponen:** Gunakan Shadcn UI terlebih dahulu, custom hanya jika tidak tersedia. Prioritaskan card, grid, table, button, input, navbar, sidebar, chart, dsb.
- **Token:** Semua warna, radius, shadow, font didefinisikan di Tailwind config.
- **Prinsip Dasar:** Fokus pada usability, responsif, minimalis, dan konsistensi.

### **B. Palet Warna (Flat Modern Minimalist)**

#### **Primary Colors**

- **Putih/Netral:** `#FFFFFF` (50) - `#1E293B` (900)
- **Abu-abu:** `#F9FAFB` (50) - `#111827` (900)
- **Aksen Biru:** `#EFF6FF` (50) - `#1E3A8A` (900)
- **Aksen Hijau:** `#ECFDF5` (50) - `#064E3B` (900)
- **Aksen Olive:** `#F7FEE7` (50) - `#365314` (900)
- **Aksen Kuning:** `#FEFCE8` (50) - `#713F12` (900)
- **Aksen Merah:** `#FEF2F2` (50) - `#7F1D1D` (900)

#### **Usage Guidelines**

- **Primary:** Biru 500 (`#3B82F6`) untuk tombol aksi utama
- **Secondary:** Hijau 500 (`#10B981`) atau Olive 500 (`#84CC16`) untuk status/aksi sekunder
- **Background:** Putih/abu-abu 50-200 untuk latar utama
- **Accent:** Olive, kuning, atau merah untuk badge/status

### **C. Font Family**

- **Sans-serif:** Poppins/Inter/Graphik (utama, heading, body)
- **Monospace:** Fira Code (data/angka)

### **D. Border Radius & Shadow**

- **Radius:** Default Tailwind, gunakan `rounded-lg` untuk card/panel, `rounded-full` untuk elemen bulat.
- **Shadow:**
  - `shadow-md` untuk card utama
  - `shadow-sm`/`shadow-none` untuk data card

### **E. Spacing & Layout**

- **Gunakan scale 4px:** `space-4`, `space-8`, dst.
- **Padding/gap:** Ikuti skala Tailwind, gunakan `p-4`, `gap-4`, dst.
- **Grid:** Responsive grid, 2-4 kolom di desktop, 1 kolom di mobile.

### **F. Animasi & Transisi**

- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)`
- **Durasi:** 150ms (micro), 300ms (modal/panel)
- **Properti:** `opacity`, `transform` (hindari width/height)

### **G. Interactive States**

- **Hover:**
  - Button: bg-blue-600, scale(1.02), shadow-lg
  - Card: shadow-xl, border-blue-100
- **Focus:** Outline 2px solid biru/olive, offset 2px
- **Active:** scale(0.98), bg-blue-700
- **Disabled:** opacity-50, cursor-not-allowed

### **H. Visual Hierarchy & Typography**

- **H1:** `text-4xl font-bold text-gray-900`
- **H2:** `text-3xl font-semibold text-gray-800`
- **H3:** `text-2xl font-medium text-gray-700`
- **Body:** `text-base text-gray-800`
- **Caption:** `text-sm text-gray-500`

### **I. Komponen Utama**

- **Card:** Rounded, shadow, padding, grid/list
- **Button:** Solid, outline, ghost, icon button
- **Table:** Responsive, zebra, sortable
- **Navbar/Sidebar:** Sticky, minimalis, icon + label
- **Form/Input:** Large touch target, clear label, error state
- **Chart:** Bar, line, pie, status color
- **Badge/Status:** Olive, kuning, merah, biru

### **J. Responsive & Accessibility**

- **Breakpoints:**
  - Mobile: < 768px (stacked layout)
  - Tablet: 768-1024px (2 kolom)
  - Desktop: > 1024px (grid, sidebar)
- **Touch Target:** Min 44x44px
- **Contrast:** Min 4.5:1 untuk teks utama
- **Focus Ring:** Selalu visible
- **ARIA:** Untuk komponen interaktif

### **K. Performance & Utility**

- **Use Transform:** Untuk animasi
- **Lazy Loading:** Untuk gambar dan komponen berat
- **Skeleton:** Untuk loading state
- **Critical Path:** Prioritaskan konten utama

---

## **Kesimpulan**

Dengan aturan di atas, seluruh tim dapat:

- Mengimplementasikan UI yang konsisten, modern, dan mudah di-scale
- Menggunakan token yang sudah didefinisikan di Tailwind config
- Mengikuti prinsip "Shadcn UI first", dan hanya custom jika perlu
- Menciptakan pengalaman pengguna yang profesional, efisien, dan mudah digunakan
- Memastikan aksesibilitas dan performa yang optimal
- Memberikan feedback visual yang jelas dan konsisten
