# Professional Receipt Multi-Page Support

## Masalah yang Diperbaiki
Sebelumnya, PDF receipt dengan format 14x20cm (landscape) hanya menggunakan 1 halaman tetap. Ketika transaksi memiliki banyak item, konten tabel akan terpotong dan tidak tercetak lengkap.

## Solusi yang Diterapkan

### 1. Konstanta Batas Halaman
```typescript
private readonly BOTTOM_MARGIN = 10 // Space reserved at bottom of page
private readonly MAX_Y = 130 // Maximum Y position before adding new page
```

### 2. Fungsi Baru: `createBorderedTableWithPagination()`
Fungsi ini menggantikan `createBorderedTable()` untuk tabel items dengan fitur:
- **Automatic Page Detection**: Memonitor posisi Y saat menggambar setiap baris
- **Smart Page Break**: Menambah halaman baru ketika `currentY + rowHeight > MAX_Y`
- **Header Repetition**: Mengulangi header tabel di setiap halaman baru
- **Border Management**: Menggambar border tabel yang benar di setiap halaman

### 3. Alur Kerja Multi-Page
```
1. Mulai menggambar tabel di halaman 1
2. Untuk setiap baris data:
   - Cek apakah baris berikutnya akan melewati MAX_Y
   - Jika YA:
     * Gambar border untuk tabel di halaman saat ini
     * Tambah halaman baru dengan doc.addPage()
     * Reset posisi Y ke MARGIN
     * Gambar ulang header tabel
   - Jika TIDAK:
     * Lanjutkan menggambar baris di halaman saat ini
3. Setelah semua baris selesai, gambar border final
```

## Hasil
- ✅ Tabel items dapat meluas ke multiple pages secara otomatis
- ✅ Header tabel diulang di setiap halaman untuk kemudahan membaca
- ✅ Border tabel digambar dengan benar di setiap halaman
- ✅ Tidak ada konten yang terpotong
- ✅ Log menampilkan jumlah halaman yang dihasilkan

## Testing
Untuk menguji fitur ini:
1. Buat transaksi dengan banyak item (>10 grouped items)
2. Generate professional receipt
3. Periksa PDF output - harus memiliki multiple pages
4. Verifikasi header tabel muncul di setiap halaman
5. Pastikan semua item tercetak lengkap tanpa terpotong

## Catatan Teknis
- Fungsi `createBorderedTable()` tetap dipertahankan untuk backward compatibility
- Hanya tabel items yang menggunakan pagination (financial summary dan keterangan tetap di halaman terakhir)
- MAX_Y = 130mm memberikan margin 10mm dari batas bawah (140mm - 10mm)
