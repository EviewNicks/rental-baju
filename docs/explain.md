**Update Product List Table dengan Kolom Total Pendapatan**

**KONTEKS:**

- File Target: `app/producer/manage-product/page.tsx`
- Sudah ada implementasi di: `@features/manage-product/components/product-detail/PricingCard.tsx`
- Fitur: Menampilkan total pendapatan dari riwayat transaksi pada tabel product list

**TASK YANG DIMINTA:**

1. **Analisis Current Table**: Review struktur tabel existing di manage-product page
2. **Add Pendapatan Column**: Tambahkan kolom "Total Pendapatan" ke tabel product list
3. **Data Integration**: Integrasikan financial data dari transaction history
4. **Format Currency**: Gunakan formatCurrency utility yang sudah ada
5. **Responsive Design**: Pastikan kolom baru responsive di mobile/tablet

**SPESIFIKASI IMPLEMENTASI:**

- **Column Header**: "Total Pendapatan"
- **Data Source**: `financialData.totalRevenue` (seperti di PricingCard)
- **Format**: Currency format Indonesia (Rp 1.234.567)
- **Fallback**: "Rp 0" jika tidak ada data transaksi
- **Position**: Setelah kolom "Harga Sewa", sebelum kolom "Actions"

**TECHNICAL REQUIREMENTS:**

- Gunakan `formatCurrency` utility dari `@/features/manage-product/lib/utils/product`
- Import `FinancialSummary` type jika diperlukan
- Maintain existing table sorting/filtering functionality
- Ensure proper TypeScript typing

**UI/UX REQUIREMENTS:**

- Align right untuk nilai currency
- Warna hijau untuk pendapatan positif (#10B981)
- Font weight: semibold
- Mobile: Hide pada screen < 768px (gunakan responsive classes)

**ACCEPTANCE CRITERIA:**

- [ ] Kolom pendapatan muncul di semua product rows
- [ ] Format currency konsisten dengan PricingCard
- [ ] Table sorting berfungsi untuk kolom pendapatan
- [ ] Responsive behavior sesuai requirement
- [ ] TypeScript compilation sukses tanpa error
- [ ] Existing functionality tidak terpengaruh

**TESTING CHECKLIST:**

- [ ] Test dengan product yang punya transaksi
- [ ] Test dengan product tanpa transaksi (fallback)
- [ ] Test responsive behavior di mobile
- [ ] Test table sorting functionality
