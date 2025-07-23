# 📐 Arsitektur Baru Proyek Rental Baju (Sederhana & Efisien)

---

## 1. Prinsip Utama

- **Modular Monolith** tetap digunakan, namun dengan struktur dan layer yang lebih ringkas.
- **Layer N-tier**: Hanya 3 layer utama (Presentation, Logic, Data), tanpa subdivisi hooks/adapter/service yang berlebihan.
- **Sederhana, maintainable, scalable** untuk tim kecil dan kebutuhan bisnis rental baju.

---

## 2. High Level Architecture

```mermaid
graph TD
    User --> UI[Next.js UI (React)]
    UI --> Logic[Custom Hook/Logic]
    Logic --> API[API Route (Next.js)]
    API --> DB[(Database)]
    UI -->|Static| Public[Public Assets]
```

- **Frontend & Backend** dalam satu codebase (monorepo Next.js)
- **API Routes** untuk backend CRUD sederhana
- **Database**: PostgreSQL/SQLite via Prisma ORM
- **Static Assets**: Gambar produk, dsb di `/public`

---

## 3. Struktur Folder

```
/
├── app/                # Routing, layout, halaman utama (Next.js App Router)
│   ├── api/            # API Routes (backend logic)
│   └── ...             # Halaman (page.tsx), layout, dsb
├── features/           # Modular Feature (per fitur utama)
│   └── [feature]/      # Contoh: manage-product, auth, kasir
│       ├── components/ # Komponen UI
│       ├── hooks/      # Custom hooks (state, logic)
│       ├── services/   # prisma logic CRUD, validasi, dsb
│       ├── api.ts      # API client/fetcher untuk fitur ini
│       ├── types.ts    # TypeScript types untuk fitur ini
├── prisma/             # Skema database & seed
├── public/             # Static files (gambar, dsb)
├── lib/                # Utilitas global
├── styles/             # CSS/SCSS/Tailwind config
└── ...                 # Config, test, dsb
```

---

## 4. Layer N-Tier (3-Tier Saja)

### 1. **Presentation Layer**

- Komponen React (UI), form, tabel, dsb.
- State lokal pakai `useState`/`useReducer`.
- Context hanya jika benar-benar perlu global state (misal: user login).

### 2. **Logic Layer**

- Custom hook per fitur (`useProduct`, `useRental`, dsb).
- Logic fetching, validasi, transformasi data.
- Panggil API via fetcher sederhana (misal: `productApi.ts`).

### 3. **Data Layer**

- API Route Next.js (`app/api/fitur/route.ts`): CRUD, validasi, otentikasi.
- Prisma ORM untuk query ke database.

---

## 5. Alur Data Sederhana

1. **User** berinteraksi di UI (misal: klik "Sewa Baju").
2. **Komponen** memanggil custom hook (misal: `useRental`).
3. **Hook** memanggil API fetcher (`rentalApi.ts`).
4. **API Route** proses request, query ke database via Prisma.
5. **Response** dikirim ke frontend, update state/UI.

---

## 6. Contoh Modularisasi Fitur

```
features/
  manage-product/
    components/
      ProductList.tsx
      ProductForm.tsx
    hooks/
      useProduct.ts
    services/
      ProductService.ts
    api.ts
    types.ts
  kasir/
    components/
      RentalForm.tsx
      RentalTable.tsx
    hooks/
      useRental.ts
    services/
      RentalService.ts
    api.ts
    types.ts
```

- Satu custom hook per fitur, satu file API per fitur, satu file types per fitur.
- Komponen UI langsung konsumsi hook.

---

## 7a. Pembagian Area Kerja FE & BE pada Struktur Folder

### **Frontend Developer (FE)**

- Fokus di:
  - `features/[fitur]/components/` → Membangun komponen UI (React)
  - `features/[fitur]/hooks/` → Membuat custom hook untuk logic fitur (state, data fetching, dsb)
  - `app/` (App Router) → Mengatur routing, layout, dan halaman Next.js

### **Backend Developer (BE)**

- Fokus di:
  - `features/[fitur]/api.ts` → Membuat API client/fetcher (opsional, biasanya dibuat FE, tapi BE bisa bantu jika logic fetch kompleks)
  - `app/api/[fitur]/route.ts` → Membangun API Route Next.js (validasi, otentikasi)
  - `services/` → handler CRUD prisma yang digunakan di API route
  - `prisma/` → Mendesain dan memelihara schema database, migration, dan query

### **Alur Kolaborasi**

- **FE** membangun UI dan logic fitur, konsumsi API dari backend.
- **BE** menyediakan endpoint API dan logic backend, serta database.

**Kesimpulan:**

- **FE**: `components/`, `hooks/`, `app/`
- **BE**: `api.ts` (opsional), `app/api/`, `prisma/`

---

## 7. Best Practice

- **Keep it simple!**
- Modularisasi per fitur, tapi jangan over-engineer layer.
- Gunakan TypeScript untuk type safety.
- Error handling: tampilkan pesan error/fallback UI.
- Testing: minimal unit test untuk logic utama.
- Context hanya jika benar-benar perlu global state.

---

## 8. FAQ Developer

**Q: Apakah boleh menambah layer jika fitur makin kompleks?**
A: Boleh, tapi mulai dari yang sederhana dulu. Tambah layer hanya jika benar-benar dibutuhkan.

**Q: Bagaimana jika ada logic yang dipakai banyak fitur?**
A: Taruh di `/lib` sebagai utilitas global.

**Q: Apakah tetap bisa scaling ke project menengah?**
A: Ya, karena modularisasi per fitur tetap dipertahankan. Tinggal tambah layer jika aplikasi berkembang.

---

## 9. Penutup

Dengan arsitektur ini, tim dapat:

- Mudah menambah fitur baru (tinggal tambah folder di `features/`)
- Menjaga codebase tetap rapi & scalable
- Memanfaatkan kekuatan Next.js untuk SSR/SSG/API dalam satu tempat

---

**Jika ada pertanyaan atau butuh contoh implementasi, silakan diskusi di tim!**

---

## 10. Pembagian Tugas Developer

### 1. **UI/UX Designer**

- Bertanggung jawab pada desain tampilan, wireframe, dan user flow.
- Hasil utama: file desain (Figma/Sketch), guideline komponen, dan dokumentasi style.
- Kolaborasi:
  - Memberikan aset, wireframe, dan prototype ke FE Developer.
  - Review implementasi UI agar sesuai desain.

### 2. **Frontend Developer (FE)**

- Fokus pada folder `features/[fitur]/components/`, `hooks/`, dan integrasi API.
- Tugas utama:
  - Membangun komponen React sesuai desain UI/UX.
  - Membuat custom hook untuk logic fitur.
  - Menghubungkan UI dengan API (fetcher di `api.ts`).
  - Menulis unit test untuk komponen/hook.
- Kolaborasi:
  - Diskusi dengan UI/UX untuk validasi tampilan.
  - Diskusi dengan BE untuk kontrak API dan data.

### 3. **Backend Developer (BE)**

- Fokus pada folder `app/api/`, `prisma/`, dan query database.
- Tugas utama:
  - Membuat API Route Next.js untuk CRUD, validasi, otentikasi.
  - Menulis logic query di API Route (atau utilitas di `/lib` jika reusable).
  - Mendesain dan memelihara schema database (Prisma).
  - Menulis unit test untuk API dan logic backend.
- Kolaborasi:
  - Diskusi dengan FE untuk kontrak API (request/response).
  - Diskusi dengan UI/UX jika ada kebutuhan data khusus untuk tampilan.

### 4. **Kolaborasi & Alur Kerja**

- UI/UX → FE: Handover desain, review implementasi.
- FE ↔ BE: Sepakati kontrak API (endpoint, request, response, error).
- Semua developer: Review code, testing, dan dokumentasi.

---
