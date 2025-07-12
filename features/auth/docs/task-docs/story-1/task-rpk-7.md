# Task RPK-7: Mengimplementasikan Halaman dan Alur Sign-In

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](mdc:#spesifikasi-teknis)
4. [Implementasi Teknis](mdc:#implementasi-teknis)
5. [Peningkatan UX](mdc:#peningkatan-ux)
6. [Test Plan](mdc:#test-plan)
7. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi)
8. [File Referensi](mdc:#file-referensi)

## Pendahuluan

Task ini bertujuan untuk mengimplementasikan halaman sign-in yang memungkinkan pengguna yang sudah terdaftar masuk ke aplikasi. Implementasi akan menggunakan komponen Clerk untuk memastikan keamanan dan konsistensi, sambil memberikan pengalaman pengguna yang optimal.

Halaman sign-in akan mendukung dua metode autentikasi: email/password tradisional dan OAuth providers (Google, GitHub). Implementasi ini akan menjadi komponen utama sistem autentikasi yang aman dan user-friendly.

## Batasan dan Penyederhanaan Implementasi

1. **UI/UX**:
   - Menggunakan komponen Clerk bawaan sebagai dasar
   - Custom styling minimal untuk menyesuaikan dengan design system
   - Responsive design untuk mobile dan desktop

2. **OAuth Providers**:
   - Fokus pada Google dan GitHub sebagai provider utama
   - Provider lain dapat ditambahkan di masa depan
   - Tidak mengimplementasikan OAuth custom

3. **Validasi**:
   - Menggunakan validasi bawaan Clerk
   - Custom validation hanya untuk field tambahan jika diperlukan
   - Error handling menggunakan Clerk error messages

## Spesifikasi Teknis

### Struktur Data

```typescript
// Sign-in form data
interface SignInFormData {
  email: string
  password: string
}

// Sign-in response
interface SignInResponse {
  success: boolean
  userId?: string
  error?: string
}

// Session data
interface SessionData {
  id: string
  userId: string
  status: 'active' | 'ended'
  lastActiveAt: Date
}
```

### Flow Pengguna

1. Pengguna mengakses halaman sign-in
2. Pengguna memilih metode sign-in (email/password atau OAuth)
3. Jika email/password:
   - Pengguna mengisi form dengan email dan password
   - Sistem memvalidasi credential
   - Jika valid, sesi dibuat dan pengguna diarahkan ke dashboard
4. Jika OAuth:
   - Pengguna diklik tombol provider (Google/GitHub)
   - Diarahkan ke halaman autentikasi provider
   - Setelah berhasil, kembali ke aplikasi dan diarahkan ke dashboard

**Happy Path**:

- Credential valid dan pengguna berhasil masuk
- Sesi aktif dibuat
- Pengguna diarahkan ke halaman yang dimaksudkan
- Redirect ke dashboard berhasil

**Error Paths**:

- Email tidak terdaftar
- Password salah
- Akun dinonaktifkan
- Terlalu banyak percobaan login
- Koneksi ke OAuth provider gagal

## Implementasi Teknis

### Komponen Utama

1. **SignInPage**: Halaman utama sign-in
2. **SignInForm**: Form komponen untuk email/password
3. **OAuthButtons**: Komponen untuk OAuth providers
4. **SignInSuccess**: Komponen untuk menampilkan sukses
5. **SignInError**: Komponen untuk menampilkan error
6. **ForgotPassword**: Komponen untuk reset password

### Struktur File

```
app/
└── sign-in/
    ├── page.tsx (SignInPage)
    └── loading.tsx

components/
└── auth/
    ├── SignInForm.tsx
    ├── OAuthButtons.tsx
    ├── SignInSuccess.tsx
    ├── SignInError.tsx
    └── ForgotPassword.tsx

hooks/
└── useSignIn.ts

types/
└── auth.ts
```

### API Endpoints

1. `POST /api/auth/sign-in` - Endpoint untuk sign-in dengan email/password
   - **Request Body**: `{ email: string, password: string }`
   - **Response**: `{ success: boolean, userId?: string, error?: string }`
   - **Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized

2. `GET /api/auth/oauth/[provider]` - Endpoint untuk OAuth redirect
   - **Response**: Redirect ke OAuth provider
   - **Status Codes**: 302 Found

3. `POST /api/auth/forgot-password` - Endpoint untuk reset password
   - **Request Body**: `{ email: string }`
   - **Response**: `{ success: boolean, error?: string }`
   - **Status Codes**: 200 OK, 400 Bad Request

## Peningkatan UX

### Aspek UX 1: Loading States

- Menampilkan loading spinner saat proses sign-in
- Disable form selama proses untuk mencegah multiple submission
- Progress indicator untuk OAuth flow

### Aspek UX 2: Error Handling

- Pesan error yang jelas dan informatif
- Validasi real-time pada form
- Retry mechanism untuk kegagalan jaringan
- Graceful fallback untuk OAuth provider yang tidak tersedia
- Rate limiting feedback untuk terlalu banyak percobaan

### Aspek UX 3: Success Feedback

- Konfirmasi visual saat sign-in berhasil
- Auto-redirect ke dashboard dengan delay
- Welcome back message untuk user yang kembali

### Aspek UX 4: Forgot Password

- Link "Lupa Password" yang mudah diakses
- Form reset password yang sederhana
- Konfirmasi email reset password

## Test Plan

### Unit Testing

- Test komponen SignInForm
- Test validasi form
- Test OAuth button interactions
- Test error handling
- Test forgot password flow

### Integration Testing

- Test sign-in flow dengan email/password
- Test sign-in flow dengan OAuth
- Test error scenarios
- Test redirect behavior
- Test session management

### E2E Testing

- Test complete sign-in flow
- Test OAuth provider integration
- Test error handling scenarios
- Test forgot password flow
- Test responsive design

## Pertanyaan untuk Diklarifikasi

1. Apakah perlu implementasi "Remember Me" functionality?
2. Bagaimana menangani kasus user yang lupa password?
3. Apakah perlu rate limiting untuk percobaan login?
4. Bagaimana menangani kasus OAuth provider yang tidak tersedia?

## Definition of Done

- [ ] Halaman sign-in dibuat dengan form email/password
- [ ] OAuth buttons untuk Google dan GitHub terintegrasi
- [ ] Validasi form berfungsi dengan benar
- [ ] Error handling diimplementasikan
- [ ] Loading states ditampilkan selama proses
- [ ] Success feedback ditampilkan setelah sign-in berhasil
- [ ] Redirect ke dashboard berfungsi
- [ ] Forgot password functionality diimplementasikan
- [ ] Session management berfungsi dengan benar
- [ ] Responsive design untuk mobile dan desktop
- [ ] Unit tests untuk semua komponen
- [ ] Integration tests untuk sign-in flow
- [ ] E2E tests untuk complete flow

## Estimasi Effort: 6 jam

## Dependencies: RPK-5 (Clerk sudah terpasang)

## Owner: [Nama Pengembang]

## File Referensi

- [Clerk Custom Sign In Page](https://clerk.com/docs/references/nextjs/custom-sign-in-or-up-page) - Panduan membuat halaman sign-in custom
- [Clerk SignIn Component](https://clerk.com/docs/components/overview) - Dokumentasi komponen SignIn Clerk
- [Clerk Session Management](https://clerk.com/docs/references/nextjs/read-session-data) - Cara mengelola session setelah sign-in
- [Clerk Forgot Password](https://clerk.com/docs/components/overview) - Implementasi forgot password dengan Clerk
