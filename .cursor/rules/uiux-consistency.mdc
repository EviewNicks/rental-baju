## **Instruksi Rules UI/UX Theme & Consistency Maguru**

### **A. Prinsip Umum**

- **Theme:** Game UI Ancient Fantasy Asia dengan Whimsical (penuh imajinasi) dan cartoonish (bergaya kartun), dengan elemen-elemen alam seperti tanaman, bunga, dan lanskap hijau. Desainnya terasa hand-drawn (seperti digambar tangan), memberikan kesan playful namun detail, cocok untuk pengalaman game yang imersif.
- **Komponen:** Gunakan Shadcn UI terlebih dahulu, custom hanya jika tidak tersedia.
- **Token:** Semua warna, radius, shadow, font didefinisikan di Tailwind config.
- **Prinsip Dasar:** Fokus pada pengguna, responsif, minimalis, dan konsistensi.

### **B. Palet Warna (Ancient Fantasy Asia)**

#### **Primary Colors**

- **Beige (Background):** `#F5EDE0` (50) - `#7B5B2C` (900)
- **Kuning-Orange (Accent):** `#FFE8C4` (50) - `#B96500` (900)
- **Hijau Alam (Nature):** `#C8E6D0` (50) - `#02B052` (900)
- **Merah Aksi (Action):** `#FFCCCB` (50) - `#B22424` (900)

#### **Usage Guidelines**

- **Primary:** Merah aksi 500 (`#FF4D4D`) untuk tombol aksi utama
- **Secondary:** Kuning-orange 400 (`#FFB148`) untuk highlight dan elemen dekoratif
- **Background:** Beige 50-200 (`#F5EDE0` - `#E8D9C6`) untuk latar belakang utama
- **Accent:** Hijau alam 300-500 (`#86D4A6` - `#5AC88A`) untuk elemen alam dan progress

### **C. Font Family**

- **Sans-serif:** Poppins (utama, heading, body)
- **Serif:** Playfair Display (opsional, heading/quotes)
- **Monospace:** Fira Code (code/data)

### **D. Border Radius & Shadow**

- **Radius:** Default Tailwind, gunakan `rounded-lg` untuk card/panel, `rounded-full` untuk elemen bulat.
- **Shadow:**
  - `shadow-glass` untuk panel utama (0 4px 20px rgba(0,0,0,0.1))
  - `shadow-neu` untuk tombol/form (dual shadow neumorphic)
  - `shadow-sm`/`shadow-none` untuk data card

### **E. Spacing & Layout**

- **Gunakan scale 4px:** `space-4`, `space-8`, dst.
- **Padding/gap:** Ikuti skala Tailwind, gunakan `p-4`, `gap-4`, dst.

### **F. Animasi & Transisi**

- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)`
- **Durasi:** 150ms (micro), 300ms (modal/panel), 500ms (complex animations)
- **Properti:** `opacity`, `transform` (hindari width/height)

### **G. Interactive States**

#### **Hover States**

- **Buttons (Primary):**
  - Background: Merah aksi 600 (`#FF3333`)
  - Transform: `scale(1.02)`
  - Shadow: `shadow-lg` dengan `shadow-red-500/25`
  - Transition: `duration-200 ease-out`

- **Buttons (Secondary):**
  - Background: Kuning-orange 500 (`#FFA329`)
  - Transform: `scale(1.02)`
  - Shadow: `shadow-lg` dengan `shadow-orange-500/25`
  - Transition: `duration-200 ease-out`

- **Cards:**
  - Transform: `translateY(-2px)`
  - Shadow: `shadow-xl` dengan `shadow-beige-900/10`
  - Border: `border-2 border-kuning-orange-300`
  - Transition: `duration-300 ease-out`

- **Links:**
  - Color: Merah aksi 600 (`#FF3333`)
  - Text decoration: `underline decoration-2`
  - Transition: `duration-150 ease-out`

#### **Focus States**

- **Global Focus:** Outline 2px solid `#8C4FFF`, offset 2px
- **Input Focus:**
  - Border: `border-2 border-red-aksi-500`
  - Box shadow: `shadow-inner shadow-red-aksi-500/20`
  - Background: `bg-beige-100`
- **Button Focus:**
  - Outline: `outline-2 outline-red-aksi-500 outline-offset-2`
  - Ring: `ring-2 ring-red-aksi-500/50`

#### **Active States**

- **Buttons:**
  - Transform: `scale(0.98)`
  - Background: Merah aksi 700 (`#E62E2E`)
  - Transition: `duration-100 ease-in`

#### **Disabled States**

- **Opacity:** `opacity-50`
- **Cursor:** `cursor-not-allowed`
- **Pointer events:** `pointer-events-none`

### **H. Scroll Behavior**

#### **Smooth Scrolling**

```css
html {
  scroll-behavior: smooth;
}
```

#### **Scroll Indicators**

- **Progress Bar:** Gunakan hijau alam 400 (`#70CE98`) untuk progress
- **Scroll to Top:** Button dengan animasi fade-in/out
- **Lazy Loading:** Skeleton dengan animasi pulse menggunakan beige colors

#### **Parallax Effects**

- **Subtle Parallax:** Gunakan untuk background elements dengan `transform: translateZ(-1px)`
- **Performance:** Batasi parallax pada elemen dekoratif saja

### **I. Microinteractions**

#### **Loading States**

- **Spinner:** Gunakan hijau alam 500 (`#5AC88A`) dengan animasi `spin`
- **Skeleton:** Gradient dari beige 200 ke beige 300 dengan animasi `pulse`
- **Progress:** Bar dengan gradient dari hijau alam 300 ke 500

#### **Feedback Visual**

- **Success:** Background hijau alam 100, border hijau alam 500, icon check
- **Error:** Background merah aksi 100, border merah aksi 500, icon x
- **Warning:** Background kuning-orange 100, border kuning-orange 500, icon warning
- **Info:** Background beige 100, border beige 500, icon info

### **J. Visual Hierarchy**

#### **Typography Scale**

- **H1:** `text-4xl font-bold text-beige-900`
- **H2:** `text-3xl font-semibold text-beige-800`
- **H3:** `text-2xl font-medium text-beige-700`
- **H4:** `text-xl font-medium text-beige-700`
- **Body:** `text-base text-beige-800`
- **Caption:** `text-sm text-beige-600`

#### **Color Hierarchy**

- **Primary Text:** Beige 900 (`#7B5B2C`)
- **Secondary Text:** Beige 700 (`#A9916E`)
- **Muted Text:** Beige 500 (`#C9B59A`)
- **Links:** Merah aksi 600 (`#FF3333`)

### **K. Accessibility**

#### **Contrast Ratios**

- **Minimum:** 4.5:1 untuk text normal
- **Large Text:** 3:1 untuk text 18px+ atau bold 14px+
- **Interactive Elements:** 3:1 minimum

#### **Focus Management**

- **Visible Focus:** Selalu terlihat dengan outline merah aksi
- **Skip Links:** Implementasi untuk keyboard navigation
- **ARIA Labels:** Tambahkan untuk screen readers

#### **Keyboard Navigation**

- **Tab Order:** Logis dan intuitif
- **Enter/Space:** Untuk button activation
- **Arrow Keys:** Untuk dropdown dan select components

### **L. Responsive Design**

#### **Breakpoints**

- **Mobile:** `< 768px` - Stack layout, larger touch targets
- **Tablet:** `768px - 1024px` - Side-by-side layout
- **Desktop:** `> 1024px` - Full layout dengan hover states

#### **Touch Targets**

- **Minimum Size:** 44px x 44px untuk touch devices
- **Spacing:** 8px minimum antara touch targets

### **M. Ikon**

- **Heroicons:** Install via `@heroicons/react`, gunakan sebagai React component
- **Size Consistency:**
  - Small: 16px
  - Medium: 20px
  - Large: 24px
  - Extra Large: 32px
- **Color:** Inherit dari parent atau gunakan beige-700 untuk default

### **N. Gestures & Touch**

#### **Swipe Gestures**

- **Card Swipe:** Implementasi untuk mobile dengan haptic feedback
- **Pull to Refresh:** Gunakan animasi dengan hijau alam colors
- **Pinch to Zoom:** Untuk image galleries

#### **Haptic Feedback**

- **Success:** Light haptic
- **Error:** Medium haptic
- **Warning:** Light haptic

### **O. Performance Guidelines**

#### **Animation Performance**

- **Use Transform:** Untuk animasi, hindari width/height
- **GPU Acceleration:** Gunakan `transform3d` untuk hardware acceleration
- **Reduce Motion:** Respect `prefers-reduced-motion`

#### **Loading Optimization**

- **Lazy Loading:** Untuk images dan heavy components
- **Progressive Loading:** Skeleton → Content → Enhancements
- **Critical Path:** Prioritaskan above-the-fold content

---

## **Kesimpulan**

Dengan aturan di atas, seluruh tim Maguru dapat:

- Mengimplementasikan UI yang konsisten, modern, dan mudah di-scale
- Menggunakan token yang sudah didefinisikan di Tailwind config
- Mengikuti prinsip "Shadcn UI first", dan hanya custom jika perlu
- Menciptakan pengalaman pengguna yang immersive dengan tema Ancient Fantasy Asia
- Memastikan aksesibilitas dan performa yang optimal
- Memberikan feedback visual yang jelas dan konsisten
