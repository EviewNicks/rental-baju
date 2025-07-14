# Task RPK-9: Mengonfigurasi Custom Claims di Clerk Dashboard

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

Task ini fokus pada konfigurasi custom claims di Clerk Dashboard untuk menyimpan informasi peran pengguna (Kasir, Producer, Owner). Custom claims ini akan digunakan untuk mengontrol akses fitur berdasarkan peran pengguna dalam aplikasi rental software.

Implementasi ini merupakan langkah awal dalam sistem otorisasi berbasis peran yang akan memungkinkan aplikasi untuk mengidentifikasi dan memvalidasi peran pengguna melalui session claims.

## Perbandingan dengan Referensi

| Fitur               | Referensi (Clerk Docs)        | Project Kita                                   |
| ------------------- | ----------------------------- | ---------------------------------------------- |
| Custom Claims Setup | Clerk Dashboard configuration | Role-based claims untuk Kasir, Producer, Owner |
| Claims Structure    | JSON-based metadata           | Structured role claims dengan validasi         |
| User Management     | Clerk User Dashboard          | Role assignment melalui custom claims          |

## Batasan dan Penyederhanaan Implementasi

1. **Batasan Role**:
   - Hanya 3 peran yang didukung: Kasir, Producer, Owner
   - Role disimpan sebagai string dalam custom claims
   - Tidak ada role Admin (diganti dengan Kasir)

2. **Batasan Teknis**:
   - Konfigurasi dilakukan manual melalui Clerk Dashboard
   - Belum ada UI untuk manajemen peran otomatis
   - Claims disimpan dalam format JSON sederhana

3. **Batasan Akses**:
   - Hanya admin Clerk yang dapat mengubah custom claims
   - Tidak ada self-service role management

## Spesifikasi Teknis

### Struktur Custom Claims

```json
{
  "role": "kasir|producer|owner",
  "assignedAt": "2024-01-01T00:00:00Z",
  "assignedBy": "admin-user-id"
}
```

### Role Hierarchy

- **Owner**: Akses penuh ke semua fitur
- **Producer**: Akses ke fitur Producer dan Kasir
- **Kasir**: Akses terbatas hanya ke fitur Kasir

## Implementasi Teknis

### Step-by-Step Setup Clerk Dashboard

#### Langkah 1: Akses Clerk Dashboard

1. Buka [Clerk Dashboard](https://dashboard.clerk.com)
2. Login dengan akun admin
3. Pilih project rental software

#### Langkah 2: Konfigurasi Custom Claims

1. Navigasi ke **Users** > **Custom Claims**
2. Klik **Add Custom Claim**
3. Konfigurasi claim dengan detail:
   - **Name**: `role`
   - **Type**: `String`
   - **Required**: `true`
   - **Default Value**: `kasir`

#### Langkah 3: Buat User Test dengan Role Berbeda

1. Navigasi ke **Users** > **All Users**
2. Klik **Add User** untuk setiap role
3. Set custom claim `role` untuk setiap user:
   - User 1: `role = "kasir"`
   - User 2: `role = "producer"`
   - User 3: `role = "owner"`

#### Langkah 4: Verifikasi Konfigurasi

1. Test login dengan setiap user
2. Periksa session claims melalui browser dev tools
3. Pastikan role tersimpan dengan benar

#### Langkah 5: Dokumentasi Konfigurasi

1. Catat struktur claims yang digunakan
2. Dokumentasikan user test dan role mereka
3. Simpan screenshot konfigurasi untuk referensi

### API Endpoints

Tidak ada API endpoints yang perlu dibuat untuk task ini karena konfigurasi dilakukan melalui Clerk Dashboard.

## Peningkatan UX

### Dokumentasi yang Jelas

- Buat panduan setup untuk developer lain
- Dokumentasikan troubleshooting common issues
- Sertakan screenshot untuk setiap langkah

### Testing Environment

- Setup environment testing terpisah
- Buat user test untuk setiap role
- Dokumentasikan credentials test

## Test Plan

### Manual Testing

- [ ] Login dengan user Kasir dan verifikasi claims
- [ ] Login dengan user Producer dan verifikasi claims
- [ ] Login dengan user Owner dan verifikasi claims
- [ ] Test dengan user tanpa role (error handling)

### Verification Steps

- [ ] Periksa session claims di browser
- [ ] Verifikasi struktur JSON claims
- [ ] Test dengan invalid role values
- [ ] Dokumentasikan hasil testing

## Pertanyaan untuk Diklarifikasi

1. Apakah perlu environment testing terpisah untuk development?
2. Bagaimana menangani user yang sudah ada tanpa role?
3. Apakah perlu backup strategy untuk custom claims?
4. Bagaimana prosedur rollback jika ada masalah?

## Definition of Done

- [ ] Custom claims `role` dikonfigurasi di Clerk Dashboard
- [ ] User test untuk setiap role (Kasir, Producer, Owner) dibuat
- [ ] Verifikasi login dan session claims berhasil
- [ ] Dokumentasi setup lengkap dengan screenshot
- [ ] Testing manual berhasil untuk semua role
- [ ] Panduan troubleshooting dibuat

## Estimasi Effort

**Total**: 2 jam

- Setup Clerk Dashboard: 30 menit
- Konfigurasi Custom Claims: 30 menit
- Buat User Test: 30 menit
- Testing dan Verifikasi: 30 menit

## Dependensi

- TSK-01: Autentikasi Clerk sudah diimplementasikan
- Akses admin ke Clerk Dashboard
- Pemahaman struktur role hierarchy

## Catatan Tambahan

- Simpan screenshot setiap langkah konfigurasi
- Dokumentasikan user test credentials dengan aman
- Buat checklist untuk verifikasi setup
- Siapkan rollback plan jika diperlukan

## Referensi

- [Clerk Custom Claims Documentation](https://clerk.com/docs/guides/authorization-checks)
- [Clerk Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Clerk Session Management](https://clerk.com/docs/guides/authorization-checks)
