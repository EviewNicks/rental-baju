---
description: 
globs: 
alwaysApply: false
---
# GitHub Actions Workflows - Maguru

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Struktur Workflows](mdc:#struktur-workflows)
3. [Rules dan Best Practices](mdc:#rules-dan-best-practices)
4. [Setup Secret dan Environment](mdc:#setup-secret-dan-environment)
5. [Troubleshooting](mdc:#troubleshooting)

## Pendahuluan

Dokumen ini menjelaskan pengaturan CI/CD menggunakan GitHub Actions untuk proyek Maguru. Workflow didesain untuk memastikan kualitas kode dengan lint, test, build, dan deployment otomatis ke lingkungan staging dan production.

## Struktur Workflows

Proyek ini menggunakan multiple workflows dengan filosofi "single responsibility" untuk memudahkan pemeliharaan dan pemahaman:

### 1. CI Pipeline (`ci.yml`)

- **Trigger**: Push/PR ke branch `develop`, `main`, dan `feature/*`; cron schedule setiap hari jam 00:00 UTC
- **Jobs**:
  - **Lint**: Menjalankan ESLint untuk memeriksa kualitas kode
  - **Test**: Menjalankan Jest tests dan menghasilkan laporan coverage

### 2. Build Pipeline (`build.yml`)

- **Trigger**: Push/PR ke branch `develop`, `main`, dan `feature/*`
- **Jobs**:
  - **Build**: Membangun aplikasi dan menyimpan artifact untuk deployment

### 3. Deploy to Staging (`deploy-staging.yml`)

- **Trigger**: Push ke branch `develop`; atau saat CI dan Build Pipeline selesai
- **Jobs**:
  - **Deploy**: Men-deploy aplikasi ke lingkungan staging (Vercel)

### 4. Deploy to Production (`deploy-production.yml`)

- **Trigger**: Push ke branch `main`; atau saat CI dan Build Pipeline selesai
- **Jobs**:
  - **Deploy**: Men-deploy aplikasi ke lingkungan production (Vercel)

## Rules dan Best Practices

### Versioning dan Dependencies

1. **Pinned Versions**: Selalu gunakan versi spesifik untuk actions, bukan `master` atau `latest`

   ```yaml
   uses: actions/checkout@v4  # BAIK ✓
   uses: actions/checkout@master  # BURUK ✗
   ```

2. **Dependency Management**: Gunakan Dependabot untuk memastikan dependencies tetap up-to-date

   ```yaml
   # .github/dependabot.yml sudah dikonfigurasi untuk:
   # - GitHub Actions dependencies
   # - NPM/Yarn dependencies
   ```

3. **Caching**: Selalu gunakan caching untuk mempercepat build
   ```yaml
   - name: Setup Node.js
     uses: actions/setup-node@v4
     with:
       node-version: '20'
       cache: 'yarn' # Caching dependencies
   ```

### Workflow Structure

1. **Job Dependencies**: Gunakan `needs` untuk menentukan dependensi antar jobs

   ```yaml
   test:
     needs: lint # Test berjalan setelah lint selesai
   ```

2. **Conditional Execution**: Gunakan `if` untuk kontrol eksekusi kondisional

   ```yaml
   if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'push' }}
   ```

3. **Error Handling**: Gunakan `continue-on-error` dan retries untuk operasi yang tidak stabil

   ```yaml
   - name: Deploy to Vercel (staging)
     id: deploy
     uses: amondnet/vercel-action@v25
     continue-on-error: true # Tidak berhenti jika gagal

   - name: Retry deployment if failed
     if: steps.deploy.outcome == 'failure'
     uses: amondnet/vercel-action@v25
   ```

### Artifacts dan Reporting

1. **Upload Artifacts**: Selalu upload artifacts untuk debugging dan analisis

   ```yaml
   - name: Upload test coverage
     uses: actions/upload-artifact@v4
     with:
       name: coverage-report
       path: coverage/
   ```

2. **Step Summaries**: Gunakan step summaries untuk memudahkan membaca hasil

   ```yaml
   - name: Create test summary
     run: |
       echo "### Test Results 📊" >> $GITHUB_STEP_SUMMARY
       echo "✅ Passed: ${{ steps.test.outputs.test_passed }}" >> $GITHUB_STEP_SUMMARY
   ```

3. **Custom Reporters**: Gunakan custom reporter untuk format output yang lebih baik
   ```javascript
   // Jest Reporter untuk Github Actions
   module.exports = class DetailedJsonReporter {
     /* ... */
   };
   ```

## Setup Secret dan Environment

### Required Secrets

Untuk deployment ke Vercel, tambahkan secrets berikut di GitHub Repository Settings:

1. `VERCEL_TOKEN`: API token dari Vercel
2. `VERCEL_ORG_ID`: ID organisasi di Vercel
3. `VERCEL_PROJECT_ID`: ID proyek di Vercel

### Environment Protections

Untuk environment production, tambahkan protection rules di GitHub:

1. Buka repository Settings > Environments
2. Buat environment baru "production"
3. Enable "Required reviewers" dan tambahkan team yang berwenang mereview

## Troubleshooting

### Common Issues and Solutions

1. **Deploy Failure**:
   - Periksa apakah secrets sudah terkonfigurasi dengan benar
   - Periksa apakah build artifact valid

2. **Test Failure**:
   - Lihat artifacts test coverage untuk detail
   - Cek summary dari detailedJsonReporter

3. **Build Errors**:
   - Cek error di log build
   - Periksa kompatibilitas dependencies

### Getting Help

Jika menemui masalah dengan workflows, hubungi:

- **DevOps Team**: Untuk masalah infrastructure dan deployment
- **Development Team Lead**: Untuk masalah terkait build dan test

