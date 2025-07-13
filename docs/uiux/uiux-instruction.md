# UI/UX Design System – Rental Software (v2)

## Pendahuluan

Dokumen ini mendefinisikan sistem desain UI/UX baru untuk aplikasi rental software, mengadopsi pendekatan visual dan teknik modern yang terinspirasi dari desain pada gambar referensi (component-style.png). Sistem ini bertujuan menciptakan pengalaman pengguna yang lebih hidup, profesional, dan mudah diakses, dengan tetap menjaga konsistensi, modularitas, dan kemudahan scaling.

---

## Rules & Instruksi Utama

**Tugas:**

- Mendefinisikan sistem desain UI/UX utama untuk aplikasi rental software berbasis gaya Flat Modern Minimalist dengan sentuhan soft neumorphism dan aksen lime/yellow.
- Menjadi acuan utama seluruh tim dalam pengembangan, review, dan evaluasi UI/UX.
- Menjamin konsistensi, aksesibilitas, dan kemudahan scaling di seluruh aplikasi.

**Instruksi Penggunaan:**

- Selalu rujuk dokumen ini sebelum membuat, mengubah, atau mereview komponen UI/UX.
- Semua token warna, radius, shadow, dan font WAJIB didefinisikan di Tailwind config.
- Gunakan Shadcn UI sebagai basis, custom hanya jika tidak tersedia.
- Lakukan review berkala dan dokumentasikan perubahan besar di dokumen ini.

---

## Filosofi & Gaya Visual

- **Flat Modern Minimalist dengan Sentuhan Soft Neumorphism**
  - Flat, tanpa efek 3D/glass, namun dengan shadow subtle untuk depth minimal.
  - Banyak whitespace, layout bersih, dan informasi ringkas.
  - Card dan komponen dengan sudut membulat (rounded corners) dan outline tipis.
  - Visual hierarchy jelas: judul besar, subjudul kecil, data/statistik menonjol.
  - Penggunaan warna aksen cerah (lime/yellow) untuk highlight dan CTA, bukan hanya biru/abu-abu.
  - Ikon dan avatar minimalis, micro-interaction implied (hover, active, badge).

## A. Prinsip Umum

- **Gaya Visual:** Flat Modern Minimalist dengan sentuhan soft neumorphism, card-based, modular, dan banyak whitespace.
- **Aksen Warna:** Lime/yellow sebagai highlight utama, netral untuk background, hitam untuk teks utama.
- **Komponen Modular:** Semua UI dibangun dari card, button, grid, chart, dsb, dengan konsistensi tinggi.
- **Usability & Aksesibilitas:** Fokus pada kemudahan penggunaan, kontras tinggi, touch target besar, dan aksesibilitas ARIA.
- **Responsif:** Layout grid modular, adaptif untuk desktop dan mobile.
- **Token Design:** Semua warna, radius, shadow, dan font didefinisikan di Tailwind config.
- **Shadcn UI First:** Gunakan Shadcn UI sebagai basis, custom hanya jika tidak tersedia.

---

## B. Palet Warna

| Warna         | Hex Contoh      | Penggunaan Utama                |
| ------------- | --------------- | ------------------------------- |
| Lime/Yelow    | #EFFF6B         | Highlight, CTA, progress, badge |
| Putih         | #FFFFFF         | Background utama, card          |
| Abu-abu muda  | #F8FAFC         | Background sekunder, card       |
| Abu kehijauan | #E2E8F0         | Background grid, panel          |
| Hitam         | #111827         | Teks utama, angka, tombol       |
| Biru/Olive    | #3B82F6/#84CC16 | Status sekunder, badge          |

- Semua warna didefinisikan sebagai token di Tailwind config.
- Gunakan lime/yellow sebagai aksen utama, biru/olive hanya untuk status sekunder.

## C. Usage Guidelines

- **Primary:** Lime/yellow untuk tombol utama, highlight, dan progress.
- **Secondary:** Biru/olive untuk status sekunder, badge, atau notifikasi.
- **Background:** Putih/abu-abu muda untuk latar utama dan card.
- **Accent:** Gunakan warna aksen hanya untuk elemen penting, jangan berlebihan.
- **Kontras:** Pastikan teks hitam di atas warna terang, dan sebaliknya.

---

## D. Font Family

- **Sans-serif utama:** Inter, Poppins, Graphik (untuk heading, body, label)
- **Monospace:** Fira Code (khusus data/angka jika diperlukan)
- Semua font didefinisikan di Tailwind config.

## E. Border Radius & Shadow

- **Radius:**
  - `rounded-lg` untuk card/panel utama
  - `rounded-full` untuk avatar, icon, dan button bulat
- **Shadow:**
  - `shadow-md` untuk card utama (subtle, soft neumorphism)
  - `shadow-sm`/`shadow-none` untuk data card atau elemen sekunder
- Semua radius dan shadow didefinisikan sebagai token di Tailwind config.

---

## H. Interactive States

- **Hover:**
  - Button: bg-lime-400, scale(1.02), shadow-lg
  - Card: shadow-xl, border-lime-100
- **Focus:** Outline 2px solid lime/olive, offset 2px
- **Active:** scale(0.98), bg-lime-600
- **Disabled:** opacity-50, cursor-not-allowed
- Semua state diatur di Tailwind config dan utility class.

## I. Visual Hierarchy & Typography

- **H1:** `text-4xl font-bold text-gray-900`
- **H2:** `text-3xl font-semibold text-gray-800`
- **H3:** `text-2xl font-medium text-gray-700`
- **Body:** `text-base text-gray-800`
- **Caption:** `text-sm text-gray-500`
- **Angka/statistik:** `text-3xl font-bold text-black`
- Gunakan hierarchy ini secara konsisten di seluruh aplikasi.

---

## J. Komponen Utama

- **Card:** Rounded, shadow, padding, grid/list, modular.
- **Button:** Solid, outline, ghost, icon button, bulat.
- **Table:** Responsive, zebra, sortable.
- **Navbar/Sidebar:** Sticky, minimalis, icon + label.
- **Form/Input:** Large touch target, clear label, error state.
- **Chart:** Bar, line, pie, status color, minimalis.
- **Badge/Status:** Lime, olive, kuning, biru, merah.
- Semua komponen diusahakan reusable dan konsisten.

## K. Responsive & Accessibility

- **Breakpoints:**
  - Mobile: < 768px (stacked layout)
  - Tablet: 768-1024px (2 kolom)
  - Desktop: > 1024px (grid, sidebar)
- **Touch Target:** Min 44x44px
- **Contrast:** Min 4.5:1 untuk teks utama
- **Focus Ring:** Selalu visible
- **ARIA:** Untuk komponen interaktif

## L. Performance & Utility

- **Use Transform:** Untuk animasi
- **Lazy Loading:** Untuk gambar dan komponen berat
- **Skeleton:** Untuk loading state
- **Critical Path:** Prioritaskan konten utama

---

## Inspirasi & Referensi

- **Aplikasi SaaS Modern:** Notion, Asana, Linear, Monday.com (untuk modular card, grid, dan warna aksen).
- **Google Material Design (versi minimal):** Penggunaan card, shadow subtle, dan icon minimalis.
- **Apple iOS Dashboard:** Rounded card, modular grid, dan tipografi besar.
- **Tren Dribbble/Behance 2022-2024:** Flat, soft color, modular dashboard, micro-interaction, dan AI assistant card.

## Ringkasan Akhir

Desain baru ini mengadopsi gaya Flat Modern Minimalist dengan sentuhan soft neumorphism, palet warna netral dengan aksen lime/yellow, tipografi sans-serif besar, layout grid modular, dan komponen card-based yang sangat clean dan profesional. Pendekatan ini sangat sesuai untuk aplikasi bisnis modern, SaaS dashboard, dan rental management yang membutuhkan visual yang hidup, profesional, dan mudah di-scale.

---
