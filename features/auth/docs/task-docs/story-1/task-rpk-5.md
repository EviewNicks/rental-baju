# Task RPK-5: Menyiapkan Clerk Proyek

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](mdc:#spesifikasi-teknis)
4. [Implementasi Teknis](mdc:#implementasi-teknis)
5. [Test Plan](mdc:#test-plan)
6. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi)
7. [File Referensi](mdc:#file-referensi)

## Pendahuluan

Task ini merupakan langkah awal untuk mengimplementasikan sistem autentikasi menggunakan Clerk. Tujuan utamanya adalah menginstall dan mengkonfigurasi Clerk SDK di proyek Next.js, serta memastikan bahwa semua environment variables dan konfigurasi dasar sudah siap untuk digunakan oleh task-task selanjutnya.

Implementasi ini akan memberikan fondasi yang solid untuk fitur autentikasi yang akan dikembangkan dalam task RPK-6, RPK-7, dan RPK-8.

## Batasan dan Penyederhanaan Implementasi

1. **Versi Clerk**:
   - Menggunakan Clerk versi terbaru yang stabil
   - Tidak mengimplementasikan fitur beta atau experimental
   - Fokus pada fitur autentikasi dasar

2. **Environment Setup**:
   - Menggunakan environment variables untuk konfigurasi
   - Tidak menyimpan API keys di code repository
   - Menggunakan .env.local untuk development

3. **Integrasi**:
   - Integrasi dengan Next.js App Router
   - Tidak mengimplementasikan custom authentication logic
   - Menggunakan komponen dan hooks bawaan Clerk

## Spesifikasi Teknis

### Dependencies yang Diperlukan

```json
{
  "@clerk/nextjs": "^4.29.0",
  "@clerk/themes": "^1.7.9"
}
```

### Environment Variables

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Struktur File

```
app/
├── layout.tsx (ClerkProvider wrapper)
├── middleware.ts (Clerk middleware)
└── globals.css (Clerk theme imports)

lib/
└── clerk.ts (Clerk configuration)

types/
└── clerk.d.ts (Type definitions)
```

## Implementasi Teknis

### 1. Instalasi Dependencies

```bash
npm install @clerk/nextjs @clerk/themes
# atau
yarn add @clerk/nextjs @clerk/themes
```

### 2. Konfigurasi Environment Variables

Membuat file `.env.local` dengan konfigurasi Clerk yang diperlukan untuk development environment.

### 3. Setup ClerkProvider

Mengintegrasikan ClerkProvider di root layout aplikasi untuk menyediakan context autentikasi ke seluruh aplikasi.

### 4. Konfigurasi Middleware

Membuat middleware untuk melindungi rute yang memerlukan autentikasi dan menangani redirect.

### 5. Setup Type Definitions

Menambahkan type definitions untuk Clerk untuk mendukung TypeScript.

### API Endpoints

1. `GET /api/auth/session` - Endpoint untuk mendapatkan informasi sesi
   - **Response**: `{ user: User | null, session: Session | null }`
   - **Status Codes**: 200 OK, 401 Unauthorized

2. `POST /api/auth/webhook` - Webhook endpoint untuk Clerk events
   - **Response**: `{ success: boolean }`
   - **Status Codes**: 200 OK, 400 Bad Request

## Test Plan

### Manual Testing

- Verifikasi Clerk dashboard connection
- Test environment variables di development
- Verifikasi komponen Clerk dapat diimport

## Pertanyaan untuk Diklarifikasi

1. Apakah perlu setup Clerk untuk production environment juga?
2. Provider OAuth mana yang harus dikonfigurasi di Clerk dashboard?
3. Apakah perlu custom domain untuk Clerk?
4. Bagaimana menangani environment variables di CI/CD pipeline?

## Definition of Done

- [ ] Clerk SDK terinstall dan dapat diimport
- [ ] Environment variables terkonfigurasi dengan benar
- [ ] ClerkProvider terintegrasi di root layout
- [ ] Middleware terkonfigurasi untuk protected routes
- [ ] Type definitions tersedia untuk TypeScript
- [ ] Webhook endpoint tersedia untuk Clerk events
- [ ] Manual testing berhasil di development environment
- [ ] Dokumentasi setup tersedia untuk tim

## Estimasi Effort: 4 jam

## Dependencies: Tidak ada

## Owner: [Nama Pengembang]

## File Referensi

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs) - Panduan lengkap setup Clerk dengan Next.js App Router
- [Clerk Next.js Overview](https://clerk.com/docs/references/nextjs/overview) - Referensi lengkap SDK Clerk untuk Next.js
- [Clerk Components Overview](https://clerk.com/docs/components/overview) - Dokumentasi komponen UI Clerk yang tersedia
- [Clerk Read Session Data](https://clerk.com/docs/references/nextjs/read-session-data) - Cara membaca data user dan session
