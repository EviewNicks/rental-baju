# Thermal Printer Selection Guide

**Dibuat untuk:** Maguru Rental System
**Library:** node-thermal-printer v4.5.0
**Target:** Pemula yang mudah dipahami

---

## =% Apa itu Thermal Printer?

Thermal printer itu seperti printer kasir di supermarket atau cafe.
Printer ini menggunakan kertas khusus yang tidak pakai tinta, tapi pakai panas.

**Keuntungan:**
- Tidak perlu beli tinta
- Cepat mencetak
- Kertas murah
- Hasilnya tahan lama

---

##  Rekomendasi Printer untuk node-thermal-printer

### 1. EPSON TM-T82IIIL PPPPP

**Paling Direkomendasikan!**

**Kelebihan:**
- **Sangat Kompatibel**: Sudah dicoba dan berhasil dengan node-thermal-printer
- **Mudah Setup**: Colok USB langsung bisa pakai
- **Banyak Dijual**: Gampang cari di Indonesia
- **Awet**: Tahan dipakai bertahun-tahun
- **Support Bagus**: Banyak tutorial dan bantuan

**L Kekurangan:**
- Harga sedikit lebih mahal dari merek China

** Harga:** Rp 1.5 - 2.5 juta
** Cocok untuk:** Utama untuk produksi dan development

---

### 2. EPSON TM-T88V PPPP

**Versi Lebih Canggih**

**Kelebihan:**
- **Lebih Cepat**: Cetaknya 2x lebih cepat dari T82
- **Lebih Awet**: Body lebih kuat
- **Fitur Lengkap**: Ada fitur tambahan untuk bisnis besar

**L Kekurangan:**
- **Harga Mahal**: Rp 3 - 4 juta
- Mungkin terlalu canggih untuk kebutuhan kita

** Harga:** Rp 3 - 4 juta
** Cocok untuk:** Bisnis yang sudah besar dan ramai

---

### 3. RONGTA RP326-USE PPP

**Pilihan Hemat**

**Kelebihan:**
- **Harga Murah**: Cuma Rp 600k - 1 juta
- **Kompatibel**: Bisa dipakai dengan node-thermal-printer
- **Fungsional**: Cukup untuk kebutuhan dasar

**L Kekurangan:**
- **Kurang Awet**: Body lebih plastik
- **Support Kurang**: Sedikit yang jual dan service
- **Resiko**: Kadang error tidak jelas penyebabnya

** Harga:** Rp 600k - 1 juta
** Cocok untuk:** Belajar development & testing dulu

---

### 4. STAR TSP700 PPP

**Alternatif Bagus**

**Kelebihan:**
- **Kualitas Bagus**: Setara Epson
- **Bisa Network**: Bisa dipakai banyak komputer
- **Support Baik**: Ada service resmi di Indonesia

**L Kekurangan:**
- **Harga Sedang**: Rp 2 - 3 juta
- **Jarang Dijual**: Lebih sulit cari daripada Epson

** Harga:** Rp 2 - 3 juta
** Cocok untuk:** Butuh printer networking (banyak kasir)

---

### 5. CUSTOM TG2480-H PP

**Merek Lokal**

**Kelebihan:**
- **Harga Sangat Murah**: Rp 500k - 800k
- **Tersedia Lokal**: Mudah dicari di toko komputer

**L Kekurangan:**
- **Support Minimal**: Jarang ada driver yang bagus
- **Risk Tinggi**: Bisa tidak compatible dengan node-thermal-printer
- **Kualitas Rendah**: Mudah rusak

** Harga:** Rp 500k - 800k
** Cocok untuk:** Budget sangat terbatas (tidak direkomendasikan)

---

##  Rekomendasi Pemilihan

**Pilih EPSON TM-T82IIIL**
- Paling aman dan sudah terbukti
- Support bagus kalau ada masalah
- Awet untuk jangka panjang
- Investasi yang worth it

---

##  Rencana Budget

### Opsi 1: Hemat (Total Rp 1.5 juta)
1. **Development**: Rongta RP326 (Rp 800k)
2. **Production**: Upgrade ke Epson T82 (Rp 1.5 juta)
3. **Total**: Rp 2.3 juta

### Opsi 2: Langsung Production (Total Rp 2 juta)
1. **Development**: Epson T82 (Rp 1.8 juta)
2. **Backup**: Tidak perlu beli lagi
3. **Total**: Rp 1.8 juta

---

##  Beli Dimana?

### Online:
- **Tokopedia**: Search "Epson TM-T82IIIL"
- **Shopee**: Search "Thermal Printer 58mm"
- **Bhinneka**: Lebih mahal tapi original

### Offline:
- **Harco Mangga Dua**: Jakarta (harga grosir)
- **Toko Komputer**: Di kota Anda biasanya ada
- **Supplier POS**: Cari "toko mesin kasir" di Google Maps

---

## =
 Cara Cek Kualitas Printer

### Saat Beli (Test di Toko):
1. **Coba Print**: Minta toko test print
2. **Cek Kertas**: Pastikan kertas masuk dengan benar
3. **Cek Cutter**: Pastikan pemotong kertas jalan
4. **Cek Driver**: Tanya apakah ada driver untuk Windows

### Pertanyaan ke Penjual:
- "Apakah ini compatible dengan Node.js?"
- "Apakah ada garansi?"
- "Apakah include kertas thermal?"
- "Apakah sudah ada driver di dalam box?"

---

##  Spesifikasi Minimal yang Diperlukan

### Harus Punya:
**USB Port** (untuk connect ke laptop)
**Auto Cutter** (pemotong kertas otomatis)
**58mm Paper** (ukuran kertas standar)
**Driver Support** (bisa diinstall di Windows/Linux)

### Optional (Tambahan):
=6 **Ethernet Port** (kalau mau pakai network)
=6 **80mm Support** (kalau mau kertas lebih lebar)
=6 **Bluetooth** (kalau mau wireless)

---

##  Hal yang Harus Dihindari

### JANGAN BELI:
L Printer tanpa merk jelas
L Printer yang tidak ada auto cutter
L Printer dengan harga di bawah Rp 500k
L Printer bekas tanpa test
L Printer yang tidak ada driver Windows

### RED FLAGS:
- Harga terlalu murah (biasanya kualitas buruk)
- Tidak ada garansi
- Tidak bisa test sebelum beli
- Penjual tidak paham teknis

---

##  Cara Pakai dengan node-thermal-printer

### Step 1: Install Driver
- Colok printer ke laptop
- Install driver yang ada di CD
- Test print dari Windows dulu

### Step 2: Setup di Code
```javascript
// Ini contoh code sederhana
const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: 'printer:EPSON TM-T82IIIL', // Nama printer di Windows
});

// Test print
printer.println('Hello Maguru!');
printer.cut();
await printer.execute();
```

### Step 3: Test Connection
- Jalankan code di atas
- Jika printer cetak tulisan "Hello Maguru!"
- Berarti setup sudah berhasil!

---

##  Tips Tambahan

### Untuk Development:
- Beli kertas thermal yang banyak (minimal 5 roll)
- Simpan box dan kartu garansi
- Backup driver di flashdisk
- Catat nomor seri printer

### Untuk Production:
- Punya 2 printer (1 utama, 1 backup)
- Service rutin setiap 6 bulan
- Simpan kontak service center
- Punya stok kertas thermal

---

## Kesimpulan

**Pilihan Terbaik untuk Maguru Rental:**

1. **Mulai dengan Rongta** (Rp 800k) - untuk development
2. **Upgrade ke Epson T82** (Rp 1.8juta) - untuk production

**Total investasi: Rp 2.6juta untuk setup lengkap**

Dengan setup ini, Anda:
- Hemat budget saat development
- Dapat printer yang reliable untuk production
- Punya backup untuk business continuity
- Bisa fokus coding tanpa khawatir hardware

---

**Happy Coding! Semoga sukses implementasi receipt printingnya! **