# Task OPS-32: Konfigurasi Custom Claims di Clerk Dashboard

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)
6. [Pertanyaan untuk Diklarifikasi](#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Task ini bertujuan untuk mengkonfigurasi custom claim "role" di Clerk Dashboard sebagai fondasi sistem Role-Based Access Control (RBAC) dalam aplikasi Maguru. Custom claim ini akan menyimpan informasi peran pengguna (admin, creator, user) yang dapat diakses oleh aplikasi melalui session claims.

Task ini merupakan bagian dari User Story TSK-15 dan menjadi prerequisite untuk TSK-33 (Ambil Role dari Session Claims) dan TSK-34 (Implementasi Middleware Otorisasi). Dengan konfigurasi ini, aplikasi dapat melakukan otorisasi akses berdasarkan peran pengguna secara aman dan efisien.

**Nilai Bisnis**: Memungkinkan kontrol akses yang granular dan meningkatkan keamanan aplikasi dengan memastikan pengguna hanya dapat mengakses fitur sesuai dengan peran mereka.

## Batasan dan Penyederhanaan

1. **Batasan Platform**:
   - Hanya menggunakan Clerk Dashboard untuk konfigurasi (tidak menggunakan Clerk API)
   - Custom claim terbatas pada satu field "role" dengan nilai string sederhana
   - Tidak mengimplementasikan hierarchical roles atau complex permissions

2. **Batasan Data**:
   - Role values terbatas pada: "admin", "creator", "user" (lowercase)
   - Tidak mendukung multiple roles per user pada fase ini
   - Tidak ada expiration time untuk role assignments

3. **Batasan Pengujian**:
   - Verifikasi manual melalui Clerk Dashboard dan browser developer tools
   - Tidak ada automated testing untuk konfigurasi Dashboard pada tahap ini

## Spesifikasi Teknis

### Struktur Custom Claim

```typescript
// Custom Claim Structure
interface UserRole {
  role: "admin" | "creator" | "user";
}

// JWT Payload akan terlihat seperti:
{
  "sub": "user_123456789",
  "role": "admin",
  "iss": "https://clerk.dev",
  // ... other standard claims
}
```

### Flow Konfigurasi

#### Konfigurasi Custom Claims:

1. Administrator login ke Clerk Dashboard
2. Navigasi ke Settings → Sessions
3. Tambahkan custom claim "role"
4. Konfigurasi default value dan validation rules
5. Verifikasi konfigurasi berhasil

**Happy Path**:

- Custom claim berhasil ditambahkan
- Default value "user" terset dengan benar
- Validation rules berfungsi untuk mencegah invalid values

**Error Paths**:

- Gagal menyimpan konfigurasi → retry dan cek network connection
- Invalid claim name → gunakan nama yang sesuai convention
- Permission denied → pastikan akses admin ke Clerk Dashboard

## Implementasi Teknis


**Pengaturan Custom Claim**:

```json
{
  "name": "role",
  "default_value": "user",
  "description": "User role for RBAC (admin, creator, user)",
  "validation": {
    "type": "string",
    "enum": ["admin", "creator", "user"]
  }
}
```

### Langkah-langkah Konfigurasi

#### 1. Akses Clerk Dashboard

**Lokasi**: [https://dashboard.clerk.com](https://dashboard.clerk.com)

**Kredensial**:

- Gunakan akun admin project Maguru
- Pastikan memiliki akses ke environment yang benar (development/production)

#### 2. Navigasi ke Session Settings

```
Dashboard → [Select Maguru Project] → Settings → Sessions
```

#### 3. Pengaturan Session Template

**Location**: Settings → Sessions → Customize session token

**Template Configuration**:

```json
{
  "role": "{{user.public_metadata.role || 'user'}}"
}
```

### Verifikasi Konfigurasi

#### 1. Verifikasi di Dashboard

- Cek bahwa custom claim "role" muncul di Sessions settings
- Pastikan default value adalah "user"
- Verifikasi validation rules sudah terset

#### 2. Verifikasi di Browser

```javascript
// Di browser console setelah login
console.log(await window.Clerk.session.getToken())
// Should show JWT with "role" claim
```

#### 3. Verifikasi User Assignment

- Buat test user baru → role default "user"
- Update public_metadata user untuk testing → role berubah sesuai assignment

## Test Plan

### 1. Unit Testing (Manual Verification)

#### Pendekatan:

- Manual testing melalui Clerk Dashboard interface
- Verifikasi melalui JWT token inspection
- Testing dengan different user roles

#### Test Cases:

1. **Konfigurasi Custom Claim**:
   - Test case: Tambah custom claim "role" di Dashboard
   - Expected: Claim berhasil disimpan dan muncul di session template
   - Edge cases: Invalid claim names, duplicate claims

2. **Default Value Assignment**:
   - Test case: User baru signup tanpa explicit role assignment
   - Expected: JWT token contains "role": "user"
   - Edge cases: Empty metadata, null values

3. **Role Assignment**:
   - Test case: Update user public_metadata dengan role "admin"
   - Expected: JWT token contains "role": "admin"
   - Edge cases: Invalid role values, special characters


## Pertanyaan untuk Diklarifikasi

1. **Environment Management**: Apakah konfigurasi custom claims perlu dilakukan di kedua environment (development dan production) secara terpisah?

2. **Role Assignment Workflow**: Bagaimana workflow untuk assign role ke user yang sudah existing? Apakah melalui Dashboard manual atau perlu API integration?

3. **Default Role Handling**: Jika user signup dan tidak ada role yang di-assign, apakah default "user" sudah cukup atau perlu approval workflow?

4. **Migration Strategy**: Bagaimana menangani users yang sudah ada sebelum custom claims dikonfigurasi? Apakah perlu data migration?

5. **Monitoring & Logging**: Apakah perlu logging untuk role changes dan claim assignments untuk audit purposes?

---

## Checklist Implementasi

### Pre-Implementation

- [ ] Verifikasi akses admin ke Clerk Dashboard
- [ ] Backup current session configuration
- [ ] Koordinasi dengan team tentang testing timeline

### Implementation Steps

- [ ] Login ke Clerk Dashboard
- [ ] Navigasi ke Sessions settings
- [ ] Tambahkan custom claim "role"
- [ ] Konfigurasi default value "user"
- [ ] Set validation rules untuk role values
- [ ] Update session template dengan role claim
- [ ] Save dan aktivasi konfigurasi

### Post-Implementation

- [ ] Verifikasi custom claim muncul di Dashboard
- [ ] Test JWT token generation dengan role claim
- [ ] Test default role assignment untuk new users
- [ ] Test role update melalui public_metadata
- [ ] Dokumentasi hasil konfigurasi
- [ ] Koordinasi dengan team untuk TSK-33

### Definition of Done

- [ ] Custom claim "role" terkonfigurasi di Clerk Dashboard
- [ ] Default value "user" berfungsi dengan benar
- [ ] Validation rules untuk role values aktif
- [ ] JWT tokens mengandung role claim
- [ ] Verifikasi manual berhasil
- [ ] Dokumentasi konfigurasi lengkap
- [ ] Team notified bahwa TSK-33 dapat dimulai

**Owner**: Bob  
**Story Points**: 1  
**Priority**: High (Prerequisite untuk TSK-33 dan TSK-34)
