### Pemahaman Tugas TSK-31: Implementasi SignOut

**Tugas Utama:**

- Menambahkan tombol sign out di halaman dashboard.
- Integrasi dengan Clerk SDK agar user bisa keluar dari aplikasi.
- Setelah sign out, user harus di-redirect ke halaman sign in.
- Pastikan session benar-benar dihapus setelah sign out.
- Tambahkan unit test untuk fitur ini.

**Checklist Detail:**

1. **Tombol Sign Out**
   - Tambahkan tombol sign out yang mudah diakses di dashboard (biasanya di header atau sidebar).
2. **Integrasi Clerk SDK**
   - Gunakan komponen atau hook dari Clerk (`SignOutButton` atau `useClerk().signOut()`).
   - Pastikan tombol benar-benar memanggil proses sign out Clerk.
3. **Redirect ke Sign In**
   - Setelah sign out, user harus otomatis diarahkan ke `/sign-in`.
   - Gunakan prop `afterSignOutUrl` pada komponen Clerk, atau handle redirect manual jika pakai hook.
   - Referensi: [Clerk Custom Redirects](https://clerk.com/docs/guides/custom-redirects)
4. **Unit Test**
   - Test tombol muncul di dashboard.
   - Test klik tombol memanggil sign out dan redirect ke `/sign-in`.
   - Mock Clerk SDK di test.

5. **Evaluasi**
   - Pastikan tidak ada tombol sign out di Navbar landing page (hanya di dashboard).
   - Pastikan session benar-benar dihapus (user tidak bisa akses dashboard tanpa login).

---

### **Langkah Kerja Detail**

1. **Analisis Lokasi Tombol**
   - Berdasarkan file `app/dashboard/page.tsx`, tombol sign out paling natural diletakkan di header dashboard (sebelah kanan, dekat user info).
   - Navbar landing page (`features/homepage/component/Navbar.tsx`) **tidak perlu** tombol sign out.

2. **Implementasi Tombol Sign Out**
   - Gunakan komponen `<SignOutButton afterSignOutUrl='/sign-in' />` dari Clerk, atau gunakan `<UserButton afterSignOutUrl='/sign-in' />` jika ingin menu dropdown.
   - Jika ingin tombol custom, gunakan hook `useClerk()` dan panggil `signOut()` lalu redirect manual.

3. **Integrasi Redirect**
   - Pastikan prop `afterSignOutUrl` diisi `/sign-in` agar user langsung diarahkan ke halaman login setelah sign out.
   - Referensi: [Clerk SignOutButton](https://clerk.com/docs/components/unstyled/sign-out-button), [Custom Redirects](https://clerk.com/docs/guides/custom-redirects)

4. **Unit Test**
   - Test render tombol sign out.
   - Test klik tombol memanggil sign out dan redirect.
   - Mock Clerk context/hook di test.

5. **Validasi Session**
   - Setelah sign out, akses ke `/dashboard` harus redirect ke `/sign-in` (middleware sudah handle, cukup test manual/otomatis).

---

### **Rencana Implementasi**

- [ ] Tambahkan tombol sign out di header dashboard (`app/dashboard/page.tsx`).
- [ ] Pastikan tombol menggunakan Clerk SDK dan prop `afterSignOutUrl`.
- [ ] Pastikan tidak ada tombol sign out di Navbar landing page.
- [ ] Tambahkan unit test untuk tombol sign out di dashboard.
- [ ] Test session benar-benar dihapus (akses dashboard setelah sign out redirect ke sign in).

---

**Saya siap mengerjakan task ini sesuai checklist di atas. Apakah ada preferensi:**

- Tombol sign out berupa button langsung, atau dropdown dari user avatar?
- Jika tidak ada, saya akan gunakan `<UserButton afterSignOutUrl='/sign-in' />` (karena sudah ada di header dashboard), dan/atau tambahkan tombol sign out eksplisit jika diinginkan.

**Konfirmasi: Lanjutkan dengan implementasi seperti di atas?**
