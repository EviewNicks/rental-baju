# Task TSK-36: Setup Environment Variables untuk Dev, Staging, dan Production

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](#spesifikasi-teknis)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Test Plan](#test-plan)

## Pendahuluan

Task ini bertujuan untuk menyiapkan struktur environment variables yang terorganisir dan aman untuk tiga environment utama: development, staging, dan production. Setup yang proper akan memastikan isolation antar environment, keamanan data sensitif, dan kemudahan deployment process.

Konteks dalam sprint: Bagian dari user story TSK-21 untuk membangun environment testing yang lengkap dan mendukung automated testing dengan konfigurasi yang tepat.

## Batasan dan Penyederhanaan

1. **Environment Scope**:
   - Fokus pada 3 environment utama: dev, staging, production
   - Environment variables terbatas pada kebutuhan autentikasi dan database
   - Tidak mencakup third-party integrations yang kompleks

2. **Security Constraints**:
   - Production secrets tidak boleh bocor ke environment lain
   - Testing data tidak boleh menggunakan production database
   - API keys memiliki scope sesuai environment masing-masing

## Spesifikasi Teknis

### Environment File Structure

```
project-root/
├── .env.local              # Development (git ignored)
├── .env.staging.example    # Staging template (tracked)
├── .env.production.example # Production template (tracked)
├── .env.example           # General template (tracked)
└── scripts/
    └── setup-env.sh       # Environment setup script
```

### Required Variables per Environment

```bash
# Core Application
NODE_ENV=development|staging|production
APP_ENV=dev|staging|prod
NEXT_PUBLIC_APP_URL=

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=
DIRECT_URL=

# Testing (dev/staging only)
CLERK_TESTING_TOKEN=
```

## Implementasi Teknis

### Step-by-Step Implementation

#### 1. Create Environment Files

```
BEGIN Create_Environment_Files
  CREATE .env.local untuk development
  CREATE .env.staging.example sebagai template
  CREATE .env.production.example sebagai template
  CREATE .env.example sebagai general template
  ADD semua files ke .gitignore except *.example
END
```

#### 2. Configure Development Environment

```
BEGIN Configure_Development
  SET NODE_ENV=development
  SET APP_ENV=dev
  SET NEXT_PUBLIC_APP_URL=http://localhost:3000
  SET DATABASE_URL=postgresql://localhost:5432/maguru_dev
  SET CLERK keys untuk development
  ENABLE testing features:
    - CLERK_TESTING_TOKEN=test_xxx
END
```

#### 3. Configure Staging Environment

```
BEGIN Configure_Staging
  SET NODE_ENV=staging
  SET APP_ENV=staging
  SET NEXT_PUBLIC_APP_URL=https://staging.maguru.com
  SET DATABASE_URL=postgresql://staging-db:5432/maguru_staging
  SET CLERK keys untuk staging
  ENABLE limited testing features
END
```

#### 4. Configure Production Environment

```
BEGIN Configure_Production
  SET NODE_ENV=production
  SET APP_ENV=prod
  SET NEXT_PUBLIC_APP_URL=https://maguru.com
  SET DATABASE_URL=postgresql://prod-db:5432/maguru_prod
  SET CLERK production keys
  DISABLE all testing features
  ENABLE enhanced security settings
END
```

### Environment Variables Validation

```typescript
// lib/env-validation.ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  APP_ENV: z.enum(['dev', 'staging', 'prod']),
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
})

export const validateEnv = () => {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`)
  }
  return result.data
}
```

### Flow Pengguna

#### Environment Setup Flow:

1. Developer clone repository
2. Copy .env.example ke .env.local
3. Fill in development-specific values
4. Run validation script untuk verify configuration
5. Start development server
6. Verify all environment variables terbaca dengan benar

**Happy Path**:

- Environment files terbuat dengan struktur yang benar
- Variables terbaca sesuai environment yang aktif
- Validation pass untuk semua required variables

**Error Paths**:

- Missing environment file → Copy dari template
- Invalid variable format → Fix sesuai validation schema
- Wrong environment detected → Check NODE_ENV setting


## Acceptance Criteria

- [ ] Environment files terbuat untuk dev, staging, production
- [ ] API keys terkonfigurasi sesuai environment masing-masing
- [ ] Environment variables terbaca dengan benar oleh aplikasi
- [ ] Validation system mendeteksi konfigurasi yang salah
- [ ] Documentation setup tersedia untuk tim development
- [ ] Security guidelines diimplementasikan untuk protect production secrets

## Security Checklist

- [ ] Production secrets tidak tersimpan di development environment
- [ ] .env files (except \*.example) ada di .gitignore
- [ ] Testing tokens hanya di development/staging
- [ ] Database isolation antar environment
- [ ] API keys memiliki scope minimal yang diperlukan

## Setup Script

```bash
#!/bin/bash
# scripts/setup-env.sh

echo "Setting up environment variables..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local from template..."
    cp .env.example .env.local
    echo "Please fill in the values in .env.local"
fi

# Validate environment
echo "Validating environment variables..."
npm run validate-env

echo "Environment setup complete!"
```

## Referensi

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Clerk Environment Setup](https://clerk.com/docs/deployments/overview)
- [Prisma Database URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
