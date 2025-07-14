# Task RPK-10: Mengambil "role" dari Session Claims di Aplikasi

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

Task ini fokus pada implementasi pengambilan informasi peran pengguna dari session claims yang disediakan oleh Clerk. Implementasi ini akan memungkinkan aplikasi untuk mengakses dan memvalidasi peran pengguna untuk digunakan dalam logika otorisasi.

Setelah custom claims dikonfigurasi di Clerk Dashboard (RPK-9), aplikasi perlu dapat membaca dan memproses informasi peran tersebut untuk mengontrol akses fitur berdasarkan peran pengguna.

## Perbandingan dengan Referensi

| Fitur              | Referensi (Clerk SDK)  | Project Kita                        |
| ------------------ | ---------------------- | ----------------------------------- |
| Session Management | Clerk session hooks    | Custom hooks untuk role management  |
| Claims Access      | Clerk session claims   | Role extraction dan validation      |
| Type Safety        | Clerk TypeScript types | Custom type definitions untuk roles |

## Batasan dan Penyederhanaan Implementasi

1. **Batasan Role**:
   - Hanya 3 peran yang didukung: Kasir, Producer, Owner
   - Role disimpan sebagai string dalam custom claims
   - Validasi role dilakukan di client-side

2. **Batasan Teknis**:
   - Menggunakan Clerk SDK untuk akses session
   - Implementasi terbatas pada client-side
   - Belum ada server-side role validation

3. **Batasan Error Handling**:
   - Fallback ke role default jika claims tidak ada
   - Error handling untuk invalid role values

## Spesifikasi Teknis

### Struktur Data

```typescript
// User Role Types
type UserRole = 'kasir' | 'producer' | 'owner'

// Session Claims Interface
interface SessionClaims {
  role: UserRole
  userId: string
  email: string
  exp: number
}

// Role Validation Result
interface RoleValidationResult {
  isValid: boolean
  role: UserRole | null
  error?: string
}
```

### Flow Pengguna

#### Flow Pengambilan Role:

1. Pengguna login dan session aktif
2. Aplikasi mengambil session claims dari Clerk
3. Sistem mengekstrak informasi role dari claims
4. Role divalidasi dan disimpan dalam state
5. Aplikasi menggunakan role untuk kontrol akses

**Happy Path**:

- Session claims berhasil diambil
- Role valid dan dapat digunakan
- State management berfungsi dengan baik

**Error Paths**:

- Session tidak ada atau expired
- Claims tidak memiliki role
- Role value tidak valid

## Implementasi Teknis

### Custom Hook untuk Role Management

Implementasi akan membuat custom hook `useUserRole` yang mengelola pengambilan dan validasi role dari session claims.

### Utility Functions

Fungsi utilitas untuk validasi role dan error handling.

### API Endpoints

1. `GET /api/user/role` - Mengambil informasi peran pengguna
   - **Response**: `{ role: UserRole, userId: string, isValid: boolean }`
   - **Status Codes**: 200 OK, 401 Unauthorized, 400 Bad Request

## Peningkatan UX

### Loading States

- Tampilkan loading indicator saat mengambil role
- Skeleton UI untuk komponen yang bergantung pada role

### Error Handling

- Pesan error yang jelas untuk invalid role
- Fallback UI untuk kasus error
- Retry mechanism untuk session issues

## Test Plan

### Unit Testing

- Test custom hook `useUserRole`
- Test utility functions untuk role validation
- Test error handling scenarios

### Integration Testing

- Test dengan session yang valid
- Test dengan session yang expired
- Test dengan claims yang tidak lengkap

### Manual Testing

- [ ] Login dengan user Kasir dan verifikasi role
- [ ] Login dengan user Producer dan verifikasi role
- [ ] Login dengan user Owner dan verifikasi role
- [ ] Test dengan session expired
- [ ] Test dengan invalid role value

## Pertanyaan untuk Diklarifikasi

1. Bagaimana menangani kasus user tanpa role yang valid?
2. Apakah perlu caching role untuk performa?
3. Bagaimana menangani perubahan role real-time?
4. Apakah perlu server-side validation tambahan?

## Definition of Done

- [ ] Custom hook `useUserRole` berhasil dibuat
- [ ] Role dapat diambil dari session claims
- [ ] Validasi role berfungsi dengan benar
- [ ] Error handling untuk berbagai skenario
- [ ] Unit tests berhasil dijalankan
- [ ] Integration tests berhasil dijalankan
- [ ] Manual testing dengan semua role berhasil

## Estimasi Effort

**Total**: 3 jam

- Implementasi custom hook: 1 jam
- Utility functions dan validation: 1 jam
- Testing dan debugging: 1 jam

## Dependensi

- RPK-9: Custom claims sudah dikonfigurasi di Clerk Dashboard
- Clerk SDK sudah terintegrasi
- TypeScript setup sudah siap

## Catatan Tambahan

- Pastikan type safety untuk role values
- Implementasikan proper error boundaries
- Dokumentasikan semua edge cases
- Siapkan fallback strategy untuk error scenarios

## Referensi

- [Clerk Custom Claims Documentation](https://clerk.com/docs/guides/authorization-checks)
- [Clerk Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Clerk Session Management](https://clerk.com/docs/guides/authorization-checks)
