# User Story 22 : TSK-22 Pengambilan Baju 

## Deskripsi

Sebagai kasir, saya ingin memproses pengambilan pakaian berdasarkan kode transaksi untuk memastikan pakaian diserahkan dengan benar.

"feature pengambilan baju, jadi setelah kita melakukan transaksi pada 'create new transkasi' app\(kasir)\dashboard\new\page.tsx , selanjutnya pada transaksi  detail app\(kasir)\dashboard\transaction\[kode]\page.tsx barulah terjaid proses pengambilan, untu  pengurangan kuotanya yang di maksud adalah pada kuota baju di transaksi detailnya, contoh : baju yang dipesan ada 3 baju, 2 baju produk A dan 1 baju produk B, jika kasir mengambil 2 baju produk A dan 1 baju produk B, maka kuota baju yang tersedia pada transaksi detailnya akan berkurang 2 dan 1. atau mungkin user hanya ingin mengambil 2 baju produk A dulu, besok baru mengambil 1 baju produk B."

## Asumsi

- Transaksi penyewaan sudah ada di sistem.
- Kasir sudah terautentikasi.
- Sistem terhubung dengan database inventaris.

## Detail

- Kasir memasukkan kode transaksi untuk mencari detail penyewaan.
- Sistem menampilkan detail transaksi dan pakaian yang akan diambil.
- Kasir mengkonfirmasi pengambilan, dan sistem mengupdate status transaksi menjadi "sudah diambil".
- Sistem juga mengurangi kuota pakaian yang tersedia.

## Kriteria Penerimaan

- Given saya adalah kasir, when saya memasukkan kode transaksi yang valid, then sistem menampilkan detail transaksi dan pakaian.
- Given saya mengkonfirmasi pengambilan, when transaksi valid, then status transaksi diupdate menjadi "sudah diambil" dan kuota pakaian berkurang.

## Flowchart

```
Start ->
[Transaksi Detail] -> [Konfirmasi Pengambilan] ->
[Update Status dan Kuota] ->
End
```

## Evaluasi INVEST

| Kriteria        | Evaluasi                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Independent** | Bergantung pada TSK-01 untuk autentikasi, tetapi dapat diimplementasikan setelah autentikasi selesai. |
| **Negotiable**  | Dapat didiskusikan (misalnya, tambahan verifikasi).                                                   |
| **Valuable**    | Memastikan pakaian diserahkan dengan benar.                                                           |
| **Estimable**   | 5 story points.                                                                                       |
| **Small**       | Dapat diselesaikan dalam satu sprint.                                                                 |
| **Testable**    | Dapat diuji dengan kriteria penerimaan.                                                               |

---

# Tasks untuk TSK-02

## Task 2.1: Desain UI

**Task ID**: T:02.1  
**Kaitan User Story**: US:02

### Deskripsi Detail

Merancang antarmuka untuk pencarian dan konfirmasi pengambilan pakaian.

### Fitur UI yang Termasuk

- Form pencarian berdasarkan kode transaksi.
- Tampilan detail transaksi (penyewa, pakaian, tanggal).
- Tombol konfirmasi pengambilan.

### Estimasi Effort

3 jam

### Owner

[Nama Designer/Developer]

### Definisi Selesai

Mockup atau implementasi desain UI selesai dan disetujui.

### Dependensi

Tidak ada.

### Catatan Tambahan

Pastikan antarmuka pencarian intuitif.

---

## Task 2.2: Implementasi Backend

**Task ID**: T:02.2  
**Kaitan User Story**: US:02

### Deskripsi Detail

Mengembangkan API untuk pencarian transaksi dan pembaruan status pengambilan.

### Dependencies

Clerk Auth (hanya admin yang dapat mengakses).

### Detail Tugas

- Buat API endpoint untuk mencari transaksi berdasarkan kode.
- Buat API endpoint untuk memperbarui status transaksi menjadi "sudah diambil".
- Implementasikan manajemen kuota pakaian (jika diperlukan).
- Tulis unit test untuk API endpoint menggunakan Jest.

### Estimasi Effort

5 jam

### Owner

[Nama Developer]

### Definisi Selesai

API berfungsi, status diperbarui, dan unit test lulus.

### Dependensi

T1.

### Catatan Tambahan

Klarifikasi manajemen kuota dengan Product Owner.

---

## Task 2.3: Implementasi Frontend

**Task ID**: T:02.3  
**Kaitan User Story**: US:02

### Deskripsi Detail

Mengembangkan antarmuka pengguna untuk pencarian dan konfirmasi pengambilan.

### Dependencies

React Query (untuk manajemen state dan fetching data).

### Detail Tugas

- Implementasikan form pencarian transaksi.
- Tampilkan detail transaksi dan pakaian.
- Implementasikan tombol konfirmasi pengambilan.

### Estimasi Effort

5 jam

### Owner

[Nama Developer]

### Definisi Selesai

Antarmuka berfungsi dan terintegrasi dengan backend.

### Dependensi

T2.

### Catatan Tambahan

Pastikan feedback visual saat konfirmasi pengambilan.
