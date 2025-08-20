Lakukan root cause analysis sistematis untuk issue "status product tidak
berubah menjadi 'dikembalikan'" dengan langkah berikut:

**CONTEXT:**

- Telah mengimplementasikan hasil analisis dari
  `features/kasir/docs/analyze.md`
- Telah melakukan implementasi pada
  `features/kasir/components/detail/ProductDetailCard.tsx`
- Issue masih persisten setelah implementasi
- Referensi visual: `features/kasir/docs/image.png`
- Log files: `services/client-log.log`, `services/server-log.log`

**ANALISIS YANG DIPERLUKAN:**

1. **Code Flow Analysis**: Trace lengkap dari UI action hingga database update
2. **State Management Review**: Periksa React state, context, dan data flow
3. **API Integration Check**: Validasi request/response antara
   frontend-backend
4. **Database Transaction Analysis**: Periksa SQL queries dan transaction
   handling
5. **Log Pattern Analysis**: Identifikasi error patterns atau missing
   operations

**OUTPUT FORMAT:**

- **Root Cause Summary** (1-2 kalimat)
- **Technical Details** (code snippets dengan line numbers)
- **Impact Assessment** (scope dan severity)
- **Action Plan** (prioritized list dengan effort estimation)
- **Validation Steps** (cara memverifikasi fix berhasil)

**SUCCESS CRITERIA:**

- Masalah teridentifikasi dengan confidence level >90%
- Solusi dapat diimplementasikan dalam <2 hours
- Fix dapat diverifikasi melalui testing scenario yang jelas

**DELIVERABLES:**

- Markdown report dengan sections di atas
- Code diffs untuk recommended fixes
- Test scenarios untuk validation

