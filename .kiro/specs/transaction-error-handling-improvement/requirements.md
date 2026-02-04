# Requirements Document

## Introduction

Perbaikan sistem error handling dan performance pada fitur create transaksi untuk memberikan pengalaman yang lebih baik bagi kasir toko dengan pesan error yang jelas, spesifik, dan actionable dalam bahasa Indonesia formal.

## Glossary

- **Kasir**: Pengguna sistem yang bertugas membuat transaksi penyewaan
- **Error_Handler**: Sistem yang menangani dan menampilkan pesan error
- **Transaction_Service**: Service layer yang menangani logika bisnis transaksi
- **Validation_System**: Sistem validasi data transaksi
- **Performance_Monitor**: Sistem monitoring performa transaksi
- **Error_Category**: Klasifikasi error berdasarkan tingkat keparahan (critical, warning, info)

## Requirements

### Requirement 1: User-Friendly Error Messages

**User Story:** Sebagai kasir toko, saya ingin mendapat pesan error yang jelas dan mudah dipahami dalam bahasa Indonesia, sehingga saya dapat mengetahui masalah yang terjadi dan cara mengatasinya.

#### Acceptance Criteria

1. WHEN sistem mendeteksi error validasi THEN Error_Handler SHALL menampilkan pesan error dalam bahasa Indonesia formal yang spesifik
2. WHEN terjadi error stok tidak mencukupi THEN Error_Handler SHALL menampilkan nama produk, ukuran, stok tersedia, dan jumlah yang diminta
3. WHEN terjadi error koneksi database THEN Error_Handler SHALL menampilkan pesan "Koneksi ke sistem bermasalah, silakan coba lagi dalam beberapa saat"
4. WHEN terjadi error data customer tidak ditemukan THEN Error_Handler SHALL menampilkan "Data pelanggan tidak ditemukan, silakan pilih pelanggan yang valid"
5. WHEN terjadi error konflik tanggal rental THEN Error_Handler SHALL menampilkan periode konflik dan kode transaksi yang bentrok

### Requirement 2: Visual Error Categorization

**User Story:** Sebagai kasir toko, saya ingin dapat membedakan tingkat keparahan error melalui visual yang jelas, sehingga saya dapat memprioritaskan tindakan yang perlu dilakukan.

#### Acceptance Criteria

1. WHEN terjadi critical error THEN Error_Handler SHALL menampilkan notifikasi dengan warna merah dan ikon peringatan
2. WHEN terjadi warning error THEN Error_Handler SHALL menampilkan notifikasi dengan warna kuning dan ikon perhatian  
3. WHEN terjadi informational error THEN Error_Handler SHALL menampilkan notifikasi dengan warna biru dan ikon informasi
4. THE Error_Handler SHALL menggunakan kontras warna yang memenuhi standar aksesibilitas WCAG 2.1
5. THE Error_Handler SHALL menampilkan durasi notifikasi yang berbeda berdasarkan kategori error

### Requirement 3: Specific Error Context

**User Story:** Sebagai kasir toko, saya ingin mendapat informasi konteks yang lengkap saat terjadi error, sehingga saya dapat memahami penyebab masalah dan mengambil tindakan yang tepat.

#### Acceptance Criteria

1. WHEN error terjadi pada validasi produk THEN Error_Handler SHALL menampilkan nama produk, ukuran, dan kategori yang bermasalah
2. WHEN error terjadi pada validasi stok THEN Error_Handler SHALL menampilkan jumlah stok tersedia dan jumlah yang diminta
3. WHEN error terjadi pada validasi tanggal THEN Error_Handler SHALL menampilkan tanggal yang konflik dan rentang tanggal yang valid
4. WHEN error terjadi pada pairing jas-sarung THEN Error_Handler SHALL menampilkan produk jas dan sarung yang bermasalah
5. THE Error_Handler SHALL menyimpan context error untuk keperluan debugging tanpa menampilkan informasi teknis ke user

### Requirement 4: Database Query Optimization

**User Story:** Sebagai kasir toko, saya ingin proses pembuatan transaksi berjalan cepat dan responsif, sehingga saya dapat melayani pelanggan dengan efisien.

#### Acceptance Criteria

1. WHEN membuat transaksi baru THEN Transaction_Service SHALL menyelesaikan proses dengan target **p95 < 10 detik**
2. WHEN melakukan validasi stok THEN Validation_System SHALL menggunakan query yang dioptimasi untuk mengurangi waktu response
3. WHEN mengambil data produk dan ukuran THEN Transaction_Service SHALL menggunakan single query dengan proper joins
4. WHEN validasi date-aware availability THEN Transaction_Service SHALL menggunakan indexed query untuk performa optimal
5. THE Transaction_Service SHALL menggunakan database transaction timeout **20 detik** (backend) & frontend timeout **30 detik**

#### Performance Targets

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| p50 latency | ~5s | <3s | P1 |
| p95 latency | ~15s | **<10s** | P0 |
| p99 latency | ~20s | <15s | P1 |
| Backend timeout | 20s | 20s (unchanged) | - |
| Frontend timeout | None | **30s** | P0 |

### Requirement 5: Error Recovery Mechanisms

**User Story:** Sebagai kasir toko, saya ingin sistem dapat pulih secara otomatis dari error sementara, sehingga saya tidak perlu melakukan tindakan manual berulang kali.

#### Acceptance Criteria

1. WHEN terjadi network error THEN Error_Handler SHALL melakukan retry otomatis maksimal 3 kali dengan exponential backoff
2. WHEN circuit breaker terbuka THEN Error_Handler SHALL menampilkan estimasi waktu recovery dan status sistem
3. WHEN terjadi database timeout THEN Error_Handler SHALL memberikan opsi untuk mencoba lagi dengan pesan yang informatif
4. WHEN retry berhasil THEN Error_Handler SHALL menampilkan notifikasi sukses dan menghilangkan pesan error sebelumnya
5. THE Error_Handler SHALL mencatat semua attempt retry untuk monitoring performa sistem

### Requirement 6: Form Validation Enhancement

**User Story:** Sebagai kasir toko, saya ingin mendapat feedback validasi yang jelas saat mengisi form transaksi, sehingga saya dapat memperbaiki kesalahan sebelum submit.

#### Acceptance Criteria

1. WHEN field customer kosong saat submit THEN Validation_System SHALL menampilkan "Silakan pilih pelanggan terlebih dahulu"
2. WHEN tidak ada produk yang dipilih THEN Validation_System SHALL menampilkan "Silakan pilih minimal satu produk untuk disewa"
3. WHEN quantity produk melebihi stok THEN Validation_System SHALL menampilkan "Jumlah [nama produk] melebihi stok tersedia ([jumlah stok])"
4. WHEN tanggal mulai tidak valid THEN Validation_System SHALL menampilkan "Tanggal mulai sewa tidak valid, silakan pilih tanggal yang benar"
5. THE Validation_System SHALL menampilkan semua error validasi secara bersamaan dalam satu notifikasi

### Requirement 7: Performance Monitoring

**User Story:** Sebagai sistem administrator, saya ingin dapat memantau performa pembuatan transaksi, sehingga dapat mengidentifikasi bottleneck dan melakukan optimasi.

#### Acceptance Criteria

1. THE Performance_Monitor SHALL mencatat waktu response untuk setiap tahap pembuatan transaksi
2. THE Performance_Monitor SHALL mencatat success rate dan failure rate transaksi
3. THE Performance_Monitor SHALL mencatat jenis error yang paling sering terjadi
4. THE Performance_Monitor SHALL mencatat waktu database query dan transaction duration
5. THE Performance_Monitor SHALL menyediakan metrics untuk evaluasi performa sistem

### Requirement 8: Accessibility Compliance

**User Story:** Sebagai kasir toko dengan kebutuhan aksesibilitas, saya ingin dapat menggunakan sistem dengan mudah menggunakan screen reader atau keyboard navigation.

#### Acceptance Criteria

1. THE Error_Handler SHALL menyediakan aria-labels yang descriptive untuk semua elemen error
2. THE Error_Handler SHALL mendukung keyboard navigation untuk menutup notifikasi error
3. THE Error_Handler SHALL menggunakan semantic HTML untuk struktur error messages
4. THE Error_Handler SHALL menyediakan alternative text untuk ikon error
5. THE Error_Handler SHALL memenuhi standar WCAG 2.1 Level AA untuk kontras warna dan ukuran font

---

## Requirement 9: Error Message Templates

**User Story:** Sebagai kasir toko, saya ingin mendapat pesan error dengan format konsisten, sehingga saya dapat dengan cepat memahami dan mengambil tindakan.

#### Acceptance Criteria

1. THE Error_Handler SHALL menggunakan format pesan: `[Kategori] [Deskripsi Masalah] [Detail Konteks] [Saran Tindakan]`
2. THE Error_Handler SHALL menggunakan bahasa Indonesia formal yang jelas & langsung
3. THE Error_Handler SHALL menyertakan variabel dinamis (nama produk, jumlah, tanggal) dalam pesan
4. THE Error_Handler SHALL menampilkan pesan satu baris untuk error sederhana
5. THE Error_Handler SHALL menampilkan pesan multi-baris untuk error kompleks dengan detail

#### Message Template Specification

| Kode Error | Kategori | Template Pesan | Variabel | Contoh Output |
|------------|----------|----------------|----------|---------------|
| `ERR_VAL_001` | CRITICAL | "Validasi gagal: {field} tidak boleh kosong" | field | "Validasi gagal: Pelanggan tidak boleh kosong" |
| `ERR_VAL_002` | CRITICAL | "Silakan pilih minimal satu produk untuk disewa" | - | "Silakan pilih minimal satu produk untuk disewa" |
| `ERR_STK_001` | CRITICAL | "Stok {productName} (Ukuran: {size}) tidak mencukupi. Tersedia: {available}, Diminta: {requested}" | productName, size, available, requested | "Stok Jas M (Ukuran: L) tidak mencukupi. Tersedia: 2, Diminta: 5" |
| `ERR_STK_002` | WARNING | "{productName} (Ukuran: {size}) hanya tersedia {available} unit. Jumlah dikurangi otomatis." | productName, size, available | "Jas M (Ukuran: L) hanya tersedia 2 unit. Jumlah dikurangi otomatis." |
| `ERR_CUST_001` | CRITICAL | "Data pelanggan tidak ditemukan. Silakan pilih pelanggan yang valid" | - | "Data pelanggan tidak ditemukan. Silakan pilih pelanggan yang valid" |
| `ERR_PROD_001` | CRITICAL | "Produk {productName} tidak ditemukan atau tidak aktif" | productName | "Produk Jas M tidak ditemukan atau tidak aktif" |
| `ERR_SIZE_001` | CRITICAL | "Ukuran {size} tidak tersedia untuk produk {productName}" | size, productName | "Ukuran XXL tidak tersedia untuk produk Jas M" |
| `ERR_DATE_001` | CRITICAL | "Tanggal sewa tidak valid. Tanggal mulai harus {minDate} atau setelahnya" | minDate | "Tanggal sewa tidak valid. Tanggal mulai harus hari ini atau setelahnya" |
| `ERR_DATE_002` | WARNING | "Konflik tanggal dengan transaksi {transactionCode}. Periode: {startDate} s/d {endDate} sudah dipesan" | transactionCode, startDate, endDate | "Konflik tanggal dengan transaksi TRX-001. Periode: 01/08/2025 s/d 05/08/2025 sudah dipesan" |
| `ERR_PAIR_001` | CRITICAL | "Pairing jas-sarung tidak valid. {jasName} membutuhkan {sarungName}" | jasName, sarungName | "Pairing jas-sarung tidak valid. Jas M Hitam membutuhkan Sarung Hitam" |
| `ERR_DB_001` | CRITICAL | "Koneksi ke sistem bermasalah. Silakan coba lagi dalam beberapa saat" | - | "Koneksi ke sistem bermasalah. Silakan coba lagi dalam beberapa saat" |
| `ERR_DB_002` | CRITICAL | "Waktu pemrosesan habis (timeout). Silakan coba lagi" | - | "Waktu pemrosesan habis (timeout). Silakan coba lagi" |
| `ERR_PAY_001` | CRITICAL | "Pembayaran gagal: {reason}. Transaksi dibatalkan secara otomatis" | reason | "Pembayaran gagal: Saldo tidak mencukupi. Transaksi dibatalkan secara otomatis" |
| `ERR_SYS_001` | WARNING | "Sistem sedang sibuk. Permintaan Anda diproses dalam antrian" | - | "Sistem sedang sibuk. Permintaan Anda diproses dalam antrian" |
| `ERR_NET_001` | WARNING | "Koneksi internet terputus. Memeriksa koneksi..." | - | "Koneksi internet terputus. Memeriksa koneksi..." |
| `ERR_AUTH_001` | CRITICAL | "Sesi Anda telah berakhir. Silakan login kembali" | - | "Sesi Anda telah berakhir. Silakan login kembali" |

---

## Requirement 10: Specific Error Scenarios

**User Story:** Sebagai kasir toko, saya ingin mendapatkan informasi yang lengkap saat terjadi error, sehingga saya dapat mengetahui penyebab pasti dan solusinya.

#### Acceptance Criteria

1. WHEN terjadi error THEN Error_Handler SHALL memberikan respons dengan detail yang lengkap
2. THE Error_Handler SHALL mengelompokkan error berdasarkan kategori penyebab
3. THE Error_Handler SHALL menyediakan informasi debugging untuk developer (tidak ditampilkan ke user)

#### Error Scenarios Specification

| Scenario | Trigger | Expected Output | User Action |
|----------|---------|-----------------|-------------|
| **SC-001: Stok Tidak Mencukupi** | User memilih jumlah > stok tersedia | - Nama produk: "Jas M Hitam"<br>- Ukuran: "L"<br>- Tersedia: 2 unit<br>- Diminta: 5 unit<br>- Pesan: ERR_STK_001 | Kurangi jumlah atau pilih produk lain |
| **SC-002: Customer Tidak Ditemukan** | Customer ID tidak valid atau terhapus | - Customer ID: "CUST-001"<br>- Status: "Not Found"<br>- Pesan: ERR_CUST_001 | Pilih customer yang valid dari dropdown |
| **SC-003: Produk/Size Tidak Ditemukan** | Produk tidak aktif atau ukuran tidak tersedia | - Produk: "Jas M Hitam"<br>- Ukuran: "XXL"<br>- Status: "Unavailable"<br>- Pesan: ERR_SIZE_001 | Pilih ukuran yang tersedia |
| **SC-004: Konflik Tanggal** | Tanggal rental bentrok dengan transaksi aktif | - Produk: "Jas M Hitam (L)"<br>- Tanggal bentrok: "01/08/2025 - 05/08/2025"<br>- Transaksi bentrok: "TRX-001"<br>- Pesan: ERR_DATE_002 | Pilih tanggal lain atau konfirmasi override |
| **SC-005: Database Timeout** | Query > 20 detik | - Operation: "Create Transaction"<br>- Duration: "22s"<br>- Status: "Timeout"<br>- Pesan: ERR_DB_002 | Coba lagi atau periksa koneksi |
| **SC-006: Payment Failure** | Pembayaran gagal setelah stok dikurangi | - Payment method: "QRIS"<br>- Reason: "Timeout"<br>- Status: "Rollback"<br>- Pesan: ERR_PAY_001 | Coba metode pembayaran lain |
| **SC-007: Network Error** | Koneksi internet terputus | - Status: "Offline"<br>- Retry attempt: "1/3"<br>- Pesan: ERR_NET_001 | Tunggu sistem reconnect otomatis |
| **SC-008: Validation Multiple Errors** | Beberapa field tidak valid saat submit | - Field kosong: "Customer"<br>- Produk kosong: true<br>- Stok insufficient: "Jas M (L)"<br>- Pesan: Gabungan semua error | Perbaiki semua error yang terdaftar |
| **SC-009: Jas-Sarung Pairing** | Jas dan sarung tidak sesuai kategori/brand | - Jas: "Jas M Hitam (Formal)"<br>- Sarung: "Sarung Batik (Casual)"<br>- Pesan: ERR_PAIR_001 | Pilih sarung yang sesuai kategori |
| **SC-010: Session Expired** | Token JWT expired | - Status: "Unauthorized"<br>- Redirect: "/login"<br>- Pesan: ERR_AUTH_001 | Login kembali |

---

## Requirement 11: Circuit Breaker Requirements

**User Story:** Sebagai kasir toko, saya ingin sistem memberikan feedback yang jelas saat sedang bermasalah, sehingga saya tidak melakukan percobaan ulang yang sia-sia.

#### Acceptance Criteria

1. WHEN terjadi 3 kegagalan berturut-turut THEN Circuit_Breaker SHALL berpindah ke state OPEN
2. WHEN circuit breaker OPEN THEN Error_Handler SHALL menampilkan pesan ERR_SYS_001
3. AFTER 15 detik dalam state OPEN THEN Circuit_Breaker SHALL berpindah ke HALF_OPEN
4. WHEN request berhasil di HALF_OPEN THEN Circuit_Breaker SHALL kembali ke CLOSED
5. THE Circuit_Breaker SHALL menampilkan estimasi waktu recovery ke user

#### Circuit Breaker States

| State | Kondisi | Behavior | Pesan ke User |
|-------|---------|----------|---------------|
| **CLOSED** | Normal operation | Request diproses normally | - |
| **OPEN** | 3 failures berturut-turut | Request ditolak langsung | "Sistem sedang sibuk. Coba lagi dalam {recoveryTime} detik" |
| **HALF_OPEN** | 15s setelah OPEN | 1 test request diperbolehkan | "Memeriksa status sistem..." |

#### Circuit Breaker Parameters

```yaml
threshold: 3              # Jumlah failure untuk trigger OPEN
timeout: 15s              # Waktu sebelum HALF_OPEN
half_open_max_calls: 1    # Jumlah test request di HALF_OPEN
success_threshold: 1      # Jumlah success untuk kembali ke CLOSED
monitor_window: 60s       # Window monitoring untuk rate calculation
```

---

## Requirement 12: Frontend Timeout Handling

**User Story:** Sebagai kasir toko, saya ingin mendapat feedback visual saat proses memakan waktu lama, sehingga saya tahu sistem masih bekerja.

#### Acceptance Criteria

1. WHILE memproses transaksi (0-30s) UI SHALL menampilkan loading spinner dengan animasi
2. AFTER 5 detik UI SHALL menampilkan pesan "Memproses transaksi..."
3. AFTER 15 detik UI SHALL menampilkan pesan "Mohon tunggu, proses memakan waktu lebih lama dari biasanya"
4. AT 30 detik UI SHALL menampilkan error timeout dengan opsi retry
5. THE Frontend timeout SHALL di-set ke 30 detik (lebih besar dari backend 20 detik)

#### Loading State Specification

| Waktu | Visual | Pesan | Action |
|-------|--------|-------|--------|
| 0-5s | Spinner saja | - | Normal processing |
| 5-15s | Spinner + text | "Memproses transaksi..." | User aware |
| 15-30s | Spinner + warning text | "Mohon tunggu, proses memakan waktu lebih lama" | User informed |
| 30s+ | Error modal | "Waktu habis. Coba lagi?" | User action required |

#### UI Component Structure

```
┌─────────────────────────────────────┐
│  [Spinner] Memproses transaksi...   │ ← 5-15s
└─────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  ⚠️ Mohon tunggu, proses memakan waktu lebih   │ ← 15-30s
│     lama dari biasanya                          │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  ❌ Waktu habis (30s)                           │ ← 30s+ timeout
│                                                │
│  Transaksi tidak dapat diproses.               │
│                                                │
│  [Coba Lagi]  [Batalkan]                       │
└────────────────────────────────────────────────┘
```

---

## Requirement 13: Error Response Format Standardization

**User Story:** Sebagai developer, saya ingin format respons error yang konsisten dari backend, sehingga frontend dapat menangani error dengan standar yang sama.

#### Acceptance Criteria

1. WHEN terjadi error THEN API SHALL mengembalikan respons dengan format standar
2. THE Error response SHALL menyertakan error code untuk identifikasi
3. THE Error response SHALL menyertakan user message dan technical message terpisah
4. THE Error response SHALL menyertakan context object untuk detail dinamis
5. THE Error response SHALL menyertakan category untuk visual styling

#### API Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    // Internal error code untuk mapping
    code: string;           // e.g., "STOCK_INSUFFICIENT", "CUSTOMER_NOT_FOUND"

    // User-friendly message (Indonesia formal)
    message: string;        // e.g., "Stok Jas M (L) tidak mencukupi..."

    // Technical details (hanya untuk development logging)
    technical?: string;     // e.g., "Query timeout after 20000ms"

    // Dynamic context variables
    context: {
      [key: string]: any;   // e.g., { productName: "Jas M", size: "L", available: 2, requested: 5 }
    };

    // Error category untuk frontend styling
    category: "CRITICAL" | "WARNING" | "INFO";

    // Suggested actions untuk user
    actions?: string[];     // e.g., ["Kurangi jumlah", "Pilih produk lain"]

    // Transaction ID untuk tracking
    transactionId?: string;

    // Timestamp untuk debugging
    timestamp: string;      // ISO 8601 format
  };
}
```

#### Error Response Examples

```json
// Example 1: Stok tidak mencukupi
{
  "success": false,
  "error": {
    "code": "STOCK_INSUFFICIENT",
    "message": "Stok Jas M (Ukuran: L) tidak mencukupi. Tersedia: 2, Diminta: 5",
    "technical": "Product inventory check failed: requested=5, available=2",
    "context": {
      "productId": "prod-001",
      "productName": "Jas M Hitam",
      "size": "L",
      "available": 2,
      "requested": 5
    },
    "category": "CRITICAL",
    "actions": ["Kurangi jumlah menjadi 2", "Pilih produk lain"],
    "transactionId": "tx-temp-12345",
    "timestamp": "2025-08-01T10:30:00.000Z"
  }
}

// Example 2: Database timeout
{
  "success": false,
  "error": {
    "code": "DATABASE_TIMEOUT",
    "message": "Waktu pemrosesan habis (timeout). Silakan coba lagi",
    "technical": "Database transaction timeout after 20000ms",
    "context": {
      "operation": "createTransaction",
      "duration": "20000ms",
      "timeout": "20000ms"
    },
    "category": "CRITICAL",
    "actions": ["Coba lagi", "Periksa koneksi internet"],
    "timestamp": "2025-08-01T10:30:00.000Z"
  }
}
```

---

## Requirement 14: Visual Component Specification

**User Story:** Sebagai kasir toko, saya ingin notifikasi error yang mudah dibaca dan diakses, sehingga saya dapat dengan cepat memahami dan mengatasi masalah.

#### Acceptance Criteria

1. THE Error notification SHALL muncul di pojok kanan atas (top-right toast)
2. THE Error notification SHALL menggunakan icon sesuai kategori error
3. THE Error notification SHALL menggunakan warna sesuai kategori (merah/kuning/biru)
4. THE Error notification SHALL dapat di-close dengan tombol X atau klik area
5. THE Error notification SHALL memiliki durasi tampil yang berbeda per kategori

#### Component Structure

```
┌─────────────────────────────────────────────────────────┐
│  ┌─ Error Notification Toast ───────────────────────┐  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │ 🔴 [CRITICAL] Stok tidak mencukupi         │ │  │ ← CRITICAL (Merah)
│  │  │                                             │ │  │
│  │  │ Stok Jas M (Ukuran: L) tidak mencukupi.    │ │  │
│  │  │ Tersedia: 2, Diminta: 5                    │ │  │
│  │  │                                             │ │  │
│  │  │ [Kurangi Jumlah] [Pilih Produk Lain] [✕]   │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Warning Notification Toast ──────────────────────┐  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │ 🟡 [WARNING] Konflik tanggal                │ │  │ ← WARNING (Kuning)
│  │  │                                             │ │  │
│  │  │ Tanggal 01/08-05/08 sudah dipesan (TRX-001)│ │  │
│  │  │                                             │ │  │
│  │  │ [Pilih Tanggal Lain] [Override] [✕]        │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Visual Specification

| Element | Critical | Warning | Info |
|---------|----------|---------|------|
| **Background** | `#DC2626` (red-600) | `#F59E0B` (amber-500) | `#3B82F6` (blue-500) |
| **Text** | `#FFFFFF` (white) | `#1F2937` (gray-800) | `#FFFFFF` (white) |
| **Icon** | ❌ / 🚫 / ⛔ | ⚠️ / ⚡ | ℹ️ / 📝 |
| **Border** | 2px solid `#B91C1C` | 2px solid `#D97706` | 2px solid `#2563EB` |
| **Duration** | 10s (auto-dismiss) | 7s | 5s |
| **Position** | Top-right, 50px from edge | Top-right, 50px from edge | Top-right, 50px from edge |
| **Width** | Max 480px | Max 480px | Max 480px |
| **Animation** | Slide-in from right + fade | Slide-in from right + fade | Slide-in from right + fade |

#### Icon Mapping

| Error Code | Icon | Variant |
|------------|------|---------|
| ERR_VAL_* | ❌ | XCircle / AlertCircle |
| ERR_STK_001 | 📦 | Package - inventory issue |
| ERR_STK_002 | ⚠️ | AlertTriangle - low stock |
| ERR_CUST_* | 👤 | User - customer issue |
| ERR_PROD_* | 🏷️ | Tag - product issue |
| ERR_SIZE_* | 📏 | Ruler - size issue |
| ERR_DATE_* | 📅 | Calendar - date issue |
| ERR_PAIR_* | 🔗 | Link - pairing issue |
| ERR_DB_* | 🗄️ | Database - database issue |
| ERR_PAY_* | 💳 | CreditCard - payment issue |
| ERR_NET_* | 📡 | Wifi - network issue |
| ERR_SYS_* | ⚙️ | Settings - system issue |
| ERR_AUTH_* | 🔒 | Lock - authentication issue |

---

## Implementation Priority Matrix

| Priority | Requirements | Estimated Effort | Dependencies |
|----------|--------------|------------------|--------------|
| **P0** | R1 (Error Messages), R3 (Error Context), R9 (Templates), R10 (Scenarios), R13 (Response Format) | 5 days | - |
| **P1** | R2 (Visual Categorization), R4 (DB Optimization), R11 (Circuit Breaker), R12 (Frontend Timeout) | 4 days | P0 |
| **P2** | R5 (Error Recovery), R6 (Form Validation), R14 (Visual Component) | 3 days | P0, P1 |
| **P3** | R7 (Performance Monitoring), R8 (Accessibility) | 2 days | P0, P1, P2 |

**Total Estimated Effort:** 14 working days (~3 weeks)

---

## Appendix: Design Decisions

### A1. Timeout Values (R4, R12)

**Decision:** Frontend timeout 30s, Backend timeout 20s

**Rationale:**
- Frontend harus lebih besar dari backend untuk menghindari race condition
- 20s backend = 2x typical query time (10s target)
- 10s buffer untuk network latency
- User experience: 30s masih acceptable untuk operasi kompleks

### A2. Error Message Language (R1, R9)

**Decision:** Bahasa Indonesia formal

**Rationale:**
- Target user: Kasir toko (non-technical)
- Formal = profesional & jelas
- Konsisten dengan aplikasi existing
- Hindari slang/ambiguous terms

### A3. Circuit Breaker Threshold (R11)

**Decision:** 3 failures, 15s recovery

**Rationale:**
- 3 failures = indicator jelas ada issue (bukan fluke)
- 15s = cukup untuk recovery sementara, tidak terlalu lama untuk user
- Half-open dengan 1 test request = conservative approach

### A4. Validation Timing (R6, docs/error.md)

**Decision:** Validasi saat submit only

**Rationale:**
- Reduce API calls (performance)
- Single error display lebih clear
- User dapat memperbaiki semua error sekaligus
- Trade-off: no real-time feedback tapi acceptable untuk use case

### A5. Loading UX (R12)

**Decision:** Single spinner, no step-by-step progress

**Rationale:**
- Step-by-step memerlukan refactor besar (backend event streaming)
- Simple spinner = MVP yang acceptable
- Progressive feedback melalui text (5s, 15s, 30s) sudah cukup
- Future enhancement: WebSocket untuk real-time progress