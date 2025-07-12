# User Story RPK-1: Sebagai pengguna, saya ingin dapat mendaftar, masuk, dan keluar dari aplikasi agar dapat menggunakan layanan dengan aman.

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Perbandingan dengan Referensi](mdc:#perbandingan-dengan-referensi)
3. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
4. [Spesifikasi Teknis](mdc:#spesifikasi-teknis)
5. [Implementasi Teknis](mdc:#implementasi-teknis)
6. [Peningkatan UX](mdc:#peningkatan-ux)
7. [Test Plan](mdc:#test-plan)
8. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

User Story ini merupakan fondasi utama untuk sistem autentikasi aplikasi rental software. Tujuan utamanya adalah memberikan pengguna kemampuan untuk mendaftar, masuk, dan keluar dari aplikasi dengan aman menggunakan layanan Clerk. Implementasi ini akan memastikan bahwa hanya pengguna yang terautentikasi yang dapat mengakses fitur-fitur aplikasi, sehingga meningkatkan keamanan dan memberikan pengalaman pengguna yang konsisten.

Nilai bisnis yang dihasilkan meliputi peningkatan keamanan sistem, pengalaman pengguna yang lebih baik, dan fondasi yang solid untuk fitur-fitur otorisasi berbasis peran di masa depan.

## Perbandingan dengan Referensi

| Fitur           | Referensi (Clerk Documentation)              | Project Kita                                          |
| --------------- | -------------------------------------------- | ----------------------------------------------------- |
| Sign Up         | Form dengan email/password + OAuth providers | Implementasi menggunakan Clerk SDK dengan Next.js     |
| Sign In         | Form dengan email/password + OAuth providers | Integrasi dengan komponen Clerk <SignIn />            |
| Sign Out        | API call untuk mengakhiri sesi               | Implementasi dengan useClerk hook                     |
| OAuth Providers | Google, GitHub, dll                          | Google, GitHub, dan provider lain yang didukung Clerk |

## Batasan dan Penyederhanaan Implementasi

1. **Teknologi Autentikasi**:
   - Menggunakan Clerk sebagai provider autentikasi utama
   - Tidak mengimplementasikan sistem autentikasi custom
   - Bergantung pada fitur OAuth yang disediakan Clerk

2. **Provider OAuth**:
   - Fokus pada Google dan GitHub sebagai provider utama
   - Provider lain dapat ditambahkan sesuai kebutuhan di masa depan
   - Tidak mengimplementasikan OAuth custom

3. **UI/UX**:
   - Menggunakan komponen Clerk bawaan untuk konsistensi
   - Custom styling minimal untuk menyesuaikan dengan design system
   - Responsive design untuk mobile dan desktop

## Spesifikasi Teknis

### Struktur Data

```typescript
// User interface dari Clerk
interface User {
  id: string
  emailAddresses: EmailAddress[]
  firstName?: string
  lastName?: string
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

// Session interface
interface Session {
  id: string
  userId: string
  status: 'active' | 'ended'
  lastActiveAt: Date
}
```

### Flow Pengguna

#### Flow Sign Up:

1. Pengguna mengakses halaman sign up
2. Pengguna memilih metode sign up (email/password atau OAuth)
3. Jika email/password: pengguna mengisi form dan submit
4. Jika OAuth: pengguna diarahkan ke provider dan kembali setelah autentikasi
5. Sistem memvalidasi data dan membuat akun
6. Pengguna diarahkan ke dashboard dengan status terautentikasi

**Happy Path**:

- Semua data valid dan akun berhasil dibuat
- Pengguna langsung masuk ke aplikasi

**Error Paths**:

- Email sudah terdaftar
- Password tidak memenuhi kriteria
- Koneksi ke OAuth provider gagal
- Validasi form gagal

#### Flow Sign In:

1. Pengguna mengakses halaman sign in
2. Pengguna memilih metode sign in (email/password atau OAuth)
3. Jika email/password: pengguna mengisi form dan submit
4. Jika OAuth: pengguna diarahkan ke provider dan kembali setelah autentikasi
5. Sistem memvalidasi credential
6. Pengguna diarahkan ke dashboard dengan status terautentikasi

**Happy Path**:

- Credential valid dan pengguna berhasil masuk
- Pengguna diarahkan ke halaman yang dimaksudkan

**Error Paths**:

- Email tidak terdaftar
- Password salah
- Akun dinonaktifkan
- Terlalu banyak percobaan login

#### Flow Sign Out:

1. Pengguna mengklik tombol sign out
2. Sistem mengakhiri sesi pengguna
3. Data sesi dihapus dari storage
4. Pengguna diarahkan ke halaman sign in

**Happy Path**:

- Sesi berhasil diakhiri
- Pengguna diarahkan ke halaman sign in
- Tidak ada data sisa yang dapat diakses

**Error Paths**:

- Gagal mengakhiri sesi
- Redirect gagal

## Implementasi Teknis

### Arsitektur Autentikasi

Implementasi akan menggunakan Clerk sebagai service autentikasi utama dengan integrasi Next.js. Clerk akan menangani semua aspek autentikasi termasuk OAuth, session management, dan security best practices.

### Komponen Utama

1. **ClerkProvider**: Wrapper untuk menyediakan context autentikasi
2. **SignIn Component**: Komponen untuk halaman sign in
3. **SignUp Component**: Komponen untuk halaman sign up
4. **UserButton**: Komponen untuk menampilkan user menu dan sign out
5. **Protected Routes**: Middleware untuk melindungi rute yang memerlukan autentikasi

### API Endpoints

1. `GET /api/auth/session` - Mendapatkan informasi sesi pengguna
   - **Response**: `{ user: User | null, session: Session | null }`
   - **Status Codes**: 200 OK, 401 Unauthorized

2. `POST /api/auth/sign-out` - Mengakhiri sesi pengguna
   - **Response**: `{ success: boolean }`
   - **Status Codes**: 200 OK, 401 Unauthorized

## Peningkatan UX

### Aspek UX 1: Loading States

- Menampilkan loading spinner saat proses autentikasi
- Disable form selama proses untuk mencegah multiple submission
- Feedback visual yang jelas untuk setiap tahap proses

### Aspek UX 2: Error Handling

- Pesan error yang jelas dan informatif
- Validasi real-time pada form
- Retry mechanism untuk kegagalan jaringan
- Graceful fallback untuk OAuth provider yang tidak tersedia

### Aspek UX 3: Responsive Design

- Layout yang optimal untuk mobile dan desktop
- Touch-friendly buttons untuk mobile
- Consistent styling dengan design system aplikasi

## Test Plan

### Unit Testing

- Test komponen SignIn dan SignUp
- Test custom hooks untuk autentikasi
- Test utility functions untuk validasi

### Integration Testing

- Test integrasi dengan Clerk API
- Test flow autentikasi end-to-end
- Test error handling dan edge cases

### E2E Testing

- Test sign up dengan email/password
- Test sign up dengan OAuth providers
- Test sign in dengan berbagai skenario
- Test sign out dan session cleanup

## Pertanyaan untuk Diklarifikasi

1. Apakah perlu implementasi custom styling untuk komponen Clerk atau menggunakan default?
2. Provider OAuth mana yang harus diaktifkan selain Google dan GitHub?
3. Bagaimana menangani kasus user yang sudah terdaftar dengan email yang sama melalui OAuth berbeda?
4. Apakah perlu implementasi "Remember Me" functionality?
5. Bagaimana menangani kasus user yang lupa password?

## Task Breakdown

- **RPK-5**: Menyiapkan Clerk proyek (4 jam)
- **RPK-6**: Mengimplementasikan Halaman dan Alur Sign-Up (8 jam)
- **RPK-7**: Mengimplementasikan Halaman dan Alur Sign-In (6 jam)
- **RPK-8**: Mengimplementasikan Fungsi Sign Out (2 jam)
- **RPK-15**: Mengintegrasikan Playwright dengan aplikasi (3 jam)
- **RPK-16**: Menulis test case untuk Sign Up, Sign In, Sign Out (6 jam)

**Total Estimasi**: 29 jam
