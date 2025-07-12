---
description: 
globs: 
alwaysApply: false
---
# Pull Request Template - Maguru

## 📋 Deskripsi Fitur

### Task Information

- **Task ID**: [TSK-XXX]
- **Task Title**: [Judul Task]
- **Sprint**: [Sprint Number/Name]
- **Story Points**: [1/2/3/5/8/13]

### Ringkasan Perubahan

[Jelaskan secara singkat apa yang diimplementasikan dalam PR ini]

### Tujuan Bisnis

[Jelaskan nilai bisnis dan dampak perubahan ini terhadap pengguna]

### Jenis Perubahan

- [ ] 🆕 Fitur baru (non-breaking change yang menambahkan fungsionalitas)
- [ ] 🐛 Bug fix (non-breaking change yang memperbaiki masalah)
- [ ] 💥 Breaking change (fix atau fitur yang menyebabkan fungsionalitas existing tidak bekerja seperti expected)
- [ ] 📚 Dokumentasi (perubahan dokumentasi saja)
- [ ] 🎨 Style (formatting, missing semi colons, dll; tidak ada perubahan logic kode)
- [ ] ♻️ Refactoring (perubahan kode yang tidak memperbaiki bug atau menambah fitur)
- [ ] ⚡ Performance (perubahan kode yang meningkatkan performance)
- [ ] ✅ Test (menambahkan missing tests atau memperbaiki existing tests)
- [ ] 🔧 Chore (perubahan build process, auxiliary tools, libraries)

---

## 🧪 Testing & Quality Assurance

### Testing Checklist

- [ ] **Unit Tests**: Semua unit tests pass (`yarn test:unit`)
- [ ] **Integration Tests**: Integration tests pass (`yarn test:integration`)
- [ ] **E2E Tests**: E2E tests pass (`yarn test:e2e`)
- [ ] **Performance Tests**: Performance tests pass (jika applicable)
- [ ] **Manual Testing**: Fitur telah ditest secara manual
- [ ] **Cross-browser Testing**: Ditest di Chrome, Firefox, Safari (jika applicable)
- [ ] **Mobile Responsive**: Ditest di device mobile (jika applicable)

### Code Quality

- [ ] **Linting**: ESLint pass tanpa error (`yarn lint`)
- [ ] **Type Checking**: TypeScript compile tanpa error (`yarn type-check`)
- [ ] **Code Coverage**: Coverage minimal 80% untuk kode baru
- [ ] **No Console Logs**: Tidak ada console.log yang tertinggal
- [ ] **Error Handling**: Proper error handling diimplementasikan

### Security & Performance

- [ ] **Security Review**: Tidak ada vulnerability baru
- [ ] **Performance Impact**: Tidak ada performance regression
- [ ] **Bundle Size**: Bundle size tidak bertambah signifikan
- [ ] **Accessibility**: Memenuhi standar accessibility (WCAG 2.1)

---

## 📸 Screenshots/Proof

### Before vs After

[Sertakan screenshot sebelum dan sesudah perubahan, terutama untuk perubahan UI]

### Desktop View

[Screenshot desktop view]

### Mobile View

[Screenshot mobile view jika applicable]

### Test Results

[Screenshot atau paste hasil test execution]

```bash
# Contoh hasil test
 PASS  features/homepage/component/Navbars.test.tsx
  ✓ renders logo and brand name (68ms)
  ✓ renders desktop menu items (18ms)
  ✓ renders sign out button when user is signed in (8ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        4.88 s
```

---

## 🔗 Issue Reference

### Related Issues

- Closes #[issue-number]
- Fixes #[issue-number]
- Related to #[issue-number]

### Documentation Links

- **Task Documentation**: `features/[feature-name]/docs/task-docs/task-ops-XXX.md`
- **Result Documentation**: `features/[feature-name]/docs/result-docs/result-ops-XXX.md`
- **Test Report**: `features/[feature-name]/docs/report-test/[test-type]-report-ops-XXX.md`

---

## 🏗️ Technical Implementation

### Architecture Changes

[Jelaskan perubahan arsitektur jika ada]

### API Changes

[List API endpoints yang ditambah/diubah/dihapus]

#### New Endpoints

- `GET /api/new-endpoint` - [Description]
- `POST /api/another-endpoint` - [Description]

#### Modified Endpoints

- `PUT /api/existing-endpoint` - [Changes made]

#### Deprecated Endpoints

- `DELETE /api/old-endpoint` - [Deprecation timeline]

### Database Changes

[Jelaskan perubahan schema database jika ada]

```sql
-- Contoh migration
ALTER TABLE users ADD COLUMN last_sign_out TIMESTAMP;
```

### Dependencies

[List dependency baru yang ditambahkan]

```json
{
  "new-package": "^1.0.0",
  "updated-package": "^2.0.0"
}
```

---

## 📝 Catatan Tambahan

### Breaking Changes

[Jelaskan breaking changes dan migration guide jika ada]

### Performance Considerations

[Jelaskan dampak performance dan optimasi yang dilakukan]

### Future Improvements

[List improvement yang bisa dilakukan di masa depan]

### Known Issues

[List known issues yang belum resolved]

---

## 👥 Review Checklist (untuk Reviewer)

### Code Review

- [ ] **Logic**: Implementasi logic sudah benar
- [ ] **Security**: Tidak ada security vulnerability
- [ ] **Performance**: Tidak ada performance issue
- [ ] **Style**: Mengikuti coding standards project
- [ ] **Readability**: Kode mudah dibaca dan dipahami
- [ ] **Maintainability**: Kode mudah dimaintain

### Architecture Review

- [ ] **Design Patterns**: Mengikuti design patterns yang established
- [ ] **Separation of Concerns**: Proper separation antara layers
- [ ] **Error Handling**: Proper error handling dan fallbacks
- [ ] **Type Safety**: Proper TypeScript usage

### Documentation Review

- [ ] **Code Comments**: Adequate code comments untuk complex logic
- [ ] **API Documentation**: API changes terdokumentasi
- [ ] **README Updates**: README diupdate jika diperlukan
- [ ] **Changelog**: Changelog diupdate untuk user-facing changes

---

## 🚀 Deployment Notes

### Environment Variables

[List environment variables baru yang diperlukan]

```env
NEW_FEATURE_ENABLED=true
API_TIMEOUT=5000
```

### Migration Steps

[Jelaskan langkah-langkah deployment jika ada]

1. Run database migration
2. Update environment variables
3. Deploy application
4. Run post-deployment tests

### Rollback Plan

[Jelaskan rencana rollback jika terjadi masalah]

---

**Template Version**: v1.0  
**Last Updated**: [Date]  
**Created by**: DevOps Team Maguru
