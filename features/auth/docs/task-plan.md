# Task Plan: Implementasi Otorisasi Role (RPK-10 & RPK-11)

## Tujuan

Menyusun rencana implementasi teknis untuk otorisasi role berbasis Clerk pada aplikasi, mencakup pengambilan role dari session claims (RPK-10) dan middleware otorisasi (RPK-11), agar sesuai dengan kebutuhan bisnis dan arsitektur pada @story-2.md.

---

## Ringkasan Tugas

- **RPK-10:** Implementasi pengambilan dan validasi role dari session claims Clerk setelah sign-in, serta integrasi ke state management React (context/hook).
- **RPK-11:** Implementasi middleware otorisasi Next.js untuk membatasi akses route berdasarkan role, dengan hierarchy: owner > producer > kasir.

---

## Task Breakdown

### 1. RPK-10: Pengambilan & Validasi Role dari Session Claims

#### a. Integrasi Clerk Session ke State Management

- Gunakan Clerk SDK untuk mengambil session claims setelah sign-in.
- Implementasi custom hook `useUserRole` untuk expose role, loading, error, dan helper (isOwner, isProducer, isKasir).
- Update context provider (`UserRoleContext.tsx`) untuk fetch role dari JWT session, handle error, dan caching.
- Pastikan role diambil dari custom claim Clerk (`role` di session JWT).

#### b. Validasi & Error Handling

- Validasi role: hanya 'kasir', 'producer', 'owner' yang valid.
- Jika role tidak valid, fallback ke role default ('kasir') dan tampilkan error.
- Implementasi loading state dan error boundary pada komponen yang membutuhkan role.

#### c. Integrasi ke UI

- Setelah sign-in, redirect user ke halaman sesuai role:
  - Kasir: `/kasir/page.tsx`
  - Producer: `/producer/page.tsx`
  - Owner: `/owner/page.tsx`
- Tampilkan role aktif di UI (misal, lewat komponen `RoleDisplay`).
- Pastikan owner dapat mengakses fitur kasir & producer (role hierarchy).

#### d. Testing

- Unit test untuk hook dan context (mock session Clerk).
- Manual test: login dengan user test untuk setiap role, cek redirect dan akses fitur.

---

### 2. RPK-11: Middleware Otorisasi Role

#### a. Middleware Next.js

- Update `middleware.ts` untuk:
  - Melindungi semua route yang membutuhkan autentikasi.
  - Mengecek role dari session claims Clerk.
  - Implementasi hierarchy:
    - Owner: akses semua fitur (kasir dan producer)
    - Producer: akses fitur producer & kasir
    - Kasir: hanya akses fitur kasir
- Redirect ke `/unauthorized` jika akses ditolak.

#### b. Route Mapping

- Setelah sign-in, redirect user ke halaman sesuai role:
  - Kasir: `/kasir/page.tsx`
  - Producer: `/producer/page.tsx`
  - Owner: `/owner/page.tsx`

- Route protection:
  - `/owner/*` → hanya owner
  - `/producer/*` → owner & producer
  - `/kasir/*` → owner & kasir

#### c. Error Handling & UX

- Jika session expired atau role tidak valid, redirect ke `/sign-in` atau `/unauthorized`.
- Tampilkan halaman unauthorized yang informatif.

#### d. Testing

- Integration test: akses route dengan berbagai role, pastikan redirect & akses sesuai.
- Manual test: login sebagai owner, producer, kasir, cek akses ke semua fitur.

---

## Evaluasi & Update Komponen

### 1. .env.local

- Update variabel redirect Clerk agar sesuai role:
  - Hapus/override default `/dashboard` jika ingin redirect dinamis berdasarkan role.
  - Implementasikan redirect logic di client/server setelah sign-in (lihat komponen page.tsx).

### 2. Komponen Utama yang Perlu Diupdate

#### a. `middleware.ts`

- Ganti semua referensi role lama (admin, creator, user) ke owner, producer, kasir.
- Update logic role check:
  - `/owner/*`: hanya owner
  - `/producer/*`: owner & producer
  - `/kasir/*`: owner & kasir
- Pastikan session claims mengambil `role` dari JWT Clerk.
- Tambahkan fallback redirect ke `/unauthorized` jika role tidak valid.

#### b. `app/owner/page.tsx`, `app/producer/page.tsx`, `app/(kasir)/page.tsx`

- Pastikan setiap page hanya bisa diakses oleh role yang sesuai (client-side check juga, selain middleware).
- Implementasi redirect setelah sign-in ke page sesuai role (bisa di custom \_app atau useEffect setelah sign-in).
- Tampilkan role aktif di UI.

#### c. `features/auth/hooks/useUserRole.ts`

- Update type dan helper agar hanya mengenal owner, producer, kasir.
- Pastikan validasi role dan fallback ke kasir jika tidak valid.
- Tambahkan helper: isOwner, isProducer, isKasir.

#### d. `features/auth/context/UserRoleContext.tsx`

- Update context agar role diambil dari session JWT Clerk (custom claim `role`).
- Implementasi error boundary dan loading state.
- Pastikan context konsisten dengan role baru.

#### e. `features/auth/lib/roleUtils.ts`

- Update validasi dan parsing JWT agar hanya mengenal owner, producer, kasir.
- Tambahkan error handling jika role tidak valid.

#### f. `features/auth/components/RoleDisplay.tsx`

- Update tampilan dan logic agar hanya menampilkan owner, producer, kasir.
- Tampilkan badge/label sesuai role.

#### g. `features/auth/types/index.ts`

- Update type UserRole menjadi 'owner' | 'producer' | 'kasir'.
- Update semua type terkait role.

#### h. `app/page.tsx` (landing/home)

- Pastikan tidak ada logic role lama.
- Jika perlu, tambahkan logic redirect jika user sudah login dan punya role.

#### i. `features/auth/docs/result-docs/stoy-2/result-rpk-9.md`

- Update dokumentasi jika ada perubahan pada implementasi role.

---

## Referensi File

- `features/auth/docs/story-2.md`
- `features/auth/hooks/useUserRole.ts`
- `features/auth/context/UserRoleContext.tsx`
- `features/auth/lib/roleUtils.ts`
- `features/auth/components/RoleDisplay.tsx`
- `features/auth/types/index.ts`
- `middleware.ts`
- `app/(kasir)/page.tsx`
- `app/producer/page.tsx`
- `app/owner/page.tsx`
- `features/auth/docs/result-docs/stoy-2/result-rpk-9.md`

---

## Catatan Penting

- Owner dapat mengakses semua fitur (kasir & producer).
- Pastikan role diambil dari session JWT, bukan dari client-side saja.
- Semua error handling harus user-friendly dan terintegrasi dengan UX.
- Dokumentasikan setiap perubahan dan testing di result docs.
- Terminologi role di seluruh project harus konsisten: owner, producer, kasir (bukan admin, creator, user).

---

## Referensi Clerk

- [Clerk Sign In Component](https://clerk.com/docs/components/authentication/sign-in)
- [Clerk Glossary](https://clerk.com/glossary)
- [Clerk Account Portal](https://clerk.com/docs/account-portal/overview)
- [Clerk Sign Up Component](https://clerk.com/docs/components/authentication/sign-up)
- [Clerk Sign In JS Reference](https://clerk.com/docs/references/javascript/sign-in)
