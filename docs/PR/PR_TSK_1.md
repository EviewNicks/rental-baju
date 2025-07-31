# Pull Request Template - Maguru

## 📋 Deskripsi Fitur

### Task Information

- **Task ID**: RPK-1 (story-1)
- **Task Title**: Autentikasi Pengguna (Sign Up, Sign In, Sign Out) dengan Clerk
- **Sprint**: Sprint 1
- **Story Points**: 29

### Ringkasan Perubahan

Implementasi sistem autentikasi lengkap menggunakan Clerk di Next.js, meliputi:

- Setup Clerk SDK, environment, dan middleware
- Halaman sign up (email/password & OAuth Google, GitHub)
- Halaman sign in (email/password & OAuth Google, GitHub)
- Fungsi sign out aman (user menu, session cleanup)
- Integrasi role-based context & protected routes
- E2E test Playwright untuk seluruh flow autentikasi (sign up, sign in, sign out)
- Dokumentasi hasil implementasi & test coverage

### Tujuan Bisnis

- Menyediakan fondasi autentikasi yang aman, scalable, dan user-friendly
- Memastikan hanya user terautentikasi yang dapat mengakses fitur utama
- Mendukung pengembangan fitur otorisasi berbasis peran di masa depan
- Meningkatkan kepercayaan dan pengalaman pengguna

### Jenis Perubahan

- [x] 🆕 Fitur baru (autentikasi Clerk)
- [x] ✅ Test (E2E Playwright, manual, coverage)
- [x] 📚 Dokumentasi (task, hasil, test)
- [x] ♻️ Refactoring (struktur auth, context, hooks)
- [ ] 🐛 Bug fix
- [ ] 💥 Breaking change
- [ ] 🎨 Style
- [ ] ⚡ Performance
- [ ] 🔧 Chore

---

## 🧪 Testing & Quality Assurance

### Testing Checklist

- [x] **Unit Tests**: Komponen utama diverifikasi (manual & visual)
- [x] **Integration Tests**: Integrasi Clerk & context diuji
- [x] **E2E Tests**: Playwright test sign up, sign in, sign out (100% pass)
- [ ] **Performance Tests**: Tidak relevan untuk auth dasar
- [x] **Manual Testing**: Semua flow diuji manual
- [x] **Cross-browser Testing**: Chromium (Playwright), Chrome
- [x] **Mobile Responsive**: Sudah diuji di viewport mobile

### Code Quality

- [x] **Linting**: ESLint pass
- [x] **Type Checking**: TypeScript pass
- [x] **Code Coverage**: E2E coverage 100% flow utama
- [x] **No Console Logs**: Sudah dibersihkan
- [x] **Error Handling**: Mengandalkan Clerk & fallback UI

### Security & Performance

- [x] **Security Review**: Clerk best practice, session cleanup
- [x] **Performance Impact**: Tidak ada regresi
- [x] **Bundle Size**: Tidak bertambah signifikan
- [x] **Accessibility**: Komponen Clerk accessible

---

## 📸 Screenshots/Proof

### Before vs After

[Sertakan screenshot sebelum dan sesudah perubahan, terutama untuk perubahan UI]

### Desktop View

[Screenshot desktop view]

### Mobile View

[Screenshot mobile view jika applicable]

### Test Results

Lihat [Test Summary Report E2E](features/auth/docs/test-docs/e2e-auth.md)

---

## 🔗 Issue Reference

### Related Issues

- Closes #RPK-1
- Related to #RPK-5, #RPK-6, #RPK-7, #RPK-8, #RPK-15, #RPK-16

### Documentation Links

- **Task Documentation**: features/auth/docs/task-docs/story-1.md
- **Result Documentation**: features/auth/docs/result-docs/result-rpk-5.md, result-rpk-6.md, result-rpk-7.md, result-rpk-8.md, result-rpk-16.md
- **Test Report**: features/auth/docs/test-docs/e2e-auth.md

---
