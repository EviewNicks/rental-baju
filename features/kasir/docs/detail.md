# User Story 23: TSK-23 Pengembalian Baju

## Deskripsi

Sebagai kasir, saya ingin memproses pengembalian pakaian, menghitung denda, dan mencatat status pakaian untuk menutup transaksi.

## Asumsi

- Transaksi penyewaan sudah ada dan statusnya "sudah diambil"
- Kasir sudah terautentikasi
- Sistem memiliki aturan perhitungan denda

## Detail

- Kasir memasukkan kode transaksi untuk mencari transaksi yang akan dikembalikan
- Sistem menghitung denda berdasarkan tanggal pengembalian
- Kasir mencatat status pakaian (misalnya, "perlu dicuci")
- Sistem mengupdate status transaksi menjadi "dikembalikan" dan menambah kuota pakaian

## Kriteria Penerimaan

[Kriteria penerimaan akan ditambahkan di sini]

## Flowchart

info :
( ) = mulai akhir
-> = panah
[ ] = action item
< > = decision item

[Flowchart akan ditambahkan di sini]

## Evaluasi INVEST

### Independent

Ya

### Negotiable

Dapat didiskusikan (misalnya, tambahan fitur denda)

### Valuable

Menutup transaksi dengan benar

### Estimable

8 story points

### Small

Dapat diselesaikan dalam satu sprint

### Testable

Dapat diuji dengan kriteria penerimaan
