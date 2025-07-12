# Task TSK-35: Setup Test Mode di Clerk Dashboard

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)

## Pendahuluan

Task ini bertujuan untuk mengaktifkan Test Mode di Clerk Dashboard yang memungkinkan penggunaan fake email dan phone numbers dengan fixed verification code untuk automated testing. Berdasarkan dokumentasi resmi Clerk, Test Mode adalah cara paling sederhana untuk setup testing environment tanpa perlu kompleksitas tambahan.

Konteks dalam sprint: Bagian dari user story TSK-21 untuk membangun environment testing yang lengkap dan terisolasi.

## Batasan dan Penyederhanaan

1. **Scope Penggunaan**:
   - Testing tokens hanya untuk environment development dan staging
   - Tidak boleh digunakan di production environment
   - Akses terbatas pada tim development saja

2. **Security Limitations**:
   - Bot protection dinonaktifkan hanya selama automated testing
   - Testing tokens memiliki expiration time yang lebih pendek
   - Rate limiting tetap berlaku dengan threshold yang lebih tinggi

## Spesifikasi Teknis

### Test Mode Configuration

Berdasarkan [dokumentasi Clerk Test Mode](https://clerk.com/docs/testing/test-emails-and-phones):

```bash
# .env.local - Environment Variables untuk Development
NODE_ENV=development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
```

### Test Credentials (Otomatis tersedia saat Test Mode aktif)

- **Test Email Format**: `username+clerk_test@example.com`
- **Test Phone Format**: `+1 (XXX) 555-0100` to `+1 (XXX) 555-0199`
- **Fixed Verification Code**: `424242`

### Dashboard Access Requirements

- Clerk Dashboard admin access
- Development instance (pk*test*\* keys)

## Implementasi Teknis

### Step-by-Step Implementation (Sesuai Dokumentasi Resmi)

#### 1. Enable Test Mode di Dashboard

```
BEGIN Enable_Test_Mode
  ACCESS https://dashboard.clerk.com
  LOGIN dengan admin credentials
  NAVIGATE TO Settings → General
  FIND "Enable test mode" section
  TOGGLE switch ke posisi ON
  SAVE configuration
END
```

#### 2. Verify Test Mode Active

```
BEGIN Verify_Test_Mode
  CHECK test mode toggle dalam status ON
  VERIFY test email format: your_email+clerk_test@example.com
  VERIFY test verification code: 424242
  VERIFY test phone range: +1 (XXX) 555-0100 to +1 (XXX) 555-0199
END
```

#### 3. Setup Environment Variables

```
BEGIN Setup_Environment
  CREATE .env.local file
  ADD NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY dari dashboard
  ADD CLERK_SECRET_KEY dari dashboard
  SET NODE_ENV=development
END
```

### Flow Pengguna

#### Test Mode Setup Flow:

1. Developer akses Clerk Dashboard
2. Navigate ke Settings → General
3. Enable "Test mode" toggle
4. Copy API keys ke .env.local
5. Verify dengan test email/phone menggunakan code 424242

**Happy Path**:

- Test mode berhasil diaktifkan
- Test email dan phone dapat digunakan dengan fixed code 424242
- Automated tests dapat berjalan tanpa hambatan email/SMS

**Error Paths**:

- Insufficient permissions → Request admin access
- Test mode tidak active → Verify toggle position
- Environment variables tidak terbaca → Check .env.local format

## Test Plan

### 1. Unit Testing

#### Test Cases:

1. **Token Validation**:
   - Test case: Validate testing token dapat authenticate
   - Expected: Token valid dan return success response
   - Edge cases: Expired token, invalid scope, wrong environment

2. **Bot Protection Status**:
   - Test case: Verify bot protection disabled untuk testing
   - Expected: No bot challenge muncul saat automated testing
   - Edge cases: Protection accidentally enabled, rate limit exceeded

### 2. Integration Testing

#### Test Cases:

1. **Environment Token Integration**:
   - Skenario: Load testing token di development environment
   - Components: Environment config, Clerk provider, Auth middleware
   - Expected: Token terbaca dan digunakan untuk authentication

### 3. E2E Testing

#### Test Scenarios:

1. **Automated Test Suite Execution**:
   - **Given**: Testing environment dengan bot protection disabled
   - **When**: Menjalankan full test suite dengan authentication flows
   - **Then**: All tests pass tanpa bot protection interference

## Acceptance Criteria

- [ ] Test mode berhasil diaktifkan di Clerk Dashboard
- [ ] Test email format (+clerk_test) dapat digunakan
- [ ] Test phone numbers (555-0100 range) dapat digunakan
- [ ] Fixed verification code 424242 berfungsi untuk semua test
- [ ] Environment variables development terkonfigurasi dengan benar

## Security Checklist

- [ ] Test mode hanya aktif di development environment
- [ ] Production keys terpisah dari development keys
- [ ] Test credentials tidak digunakan di production
- [ ] .env.local tidak di-commit ke repository
- [ ] API keys development memiliki scope yang sesuai

## Referensi

- [Clerk Testing Documentation](https://clerk.com/docs/testing/overview)
- [Clerk API Keys Management](https://clerk.com/docs/reference/api-keys)
- [Bot Protection Configuration](https://clerk.com/docs/security/bot-protection)
