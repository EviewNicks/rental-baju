  Lakukan analisis mendalam terhadap masalah UI/UX pada sistem kasir rental
  pakaian berdasarkan hasil uji browser langsung.

  **KONTEKS:**
  Setelah melakukan uji browser, ditemukan 2 masalah utama:
  1. Product Detail Card masih menampilkan status "pengambilan" meskipun proses      
  pengembalian sudah selesai
  2. Activity Timeline menunjukkan riwayat yang sesuai dengan ekspektasi
  (referensi: features/kasir/docs/image.png)

  **TUGAS ANALISIS:**
  1. **Root Cause Analysis** - Identifikasi penyebab Product Detail Card tidak       
  ter-update setelah pengembalian
  2. **Code Investigation** - Analisis kode terkait state management dan UI
  rendering
  3. **Solution Design** - Berikan rekomendasi perbaikan teknis dan UI/UX

  **METODOLOGI:**
  1. Periksa flow data dari backend ke frontend untuk status produk
  2. Analisis component lifecycle dan state management
  3. Bandingkan implementasi Activity Timeline (yang berfungsi) dengan Product       
  Detail Card
  4. Identifikasi gap dalam update mechanism

  **OUTPUT YANG DIHARAPKAN:**
  Buat laporan analisis dalam format Markdown di
  `features/kasir/docs/analyze.md` dengan struktur:

  ```markdown
  # Analisis Masalah Product Detail Card Status

  ## Executive Summary
  - Ringkasan masalah (2-3 kalimat)
  - Impact pada user experience
  - Tingkat prioritas perbaikan

  ## Technical Analysis
  ### Root Cause Investigation
  - Analisis flow data dan state management
  - Comparison dengan Activity Timeline implementation
  - Code references dan line numbers

  ### Proposed Solutions
  1. **Short-term fix** (quick wins)
  2. **Long-term improvement** (architectural)

  ## Implementation Plan
  - Langkah prioritas
  - Estimasi effort
  - Testing strategy

  ## Appendix
  - Screenshots perbandingan
  - Code snippets relevan

  KRITERIA KEBERHASILAN:
  - Identifikasi minimal 2 possible root causes
  - Berikan solusi teknis yang actionable
  - Include code references dengan file paths
  - Estimasi implementasi realistis (hours/days)
  - Recommendations harus feasible dengan existing tech stack

  BATASAN:
  - Fokus pada Product Detail Card issue
  - Gunakan existing codebase pattern
  - Pertimbangkan backward compatibility


  ## 4. Improved Prompt — Minimal Change

  Lakukan analisis masalah Product Detail Card yang masih menunjukkan status
  "pengambilan" setelah proses pengembalian selesai, padahal Activity Timeline       
  sudah menampilkan riwayat yang benar (referensi:
  features/kasir/docs/image.png).

  Analisis penyebab masalah ini dan berikan rekomendasi perbaikan UI untuk
  Product Detail Card.

  Buat laporan hasil analisis di features/kasir/docs/analyze.md dengan struktur:     
  1. Root cause analysis
  2. Perbandingan dengan Activity Timeline implementation
  3. Solusi teknis yang direkomendasikan
  4. Implementation plan

  Include code references dan estimasi effort untuk perbaikan.
  
  ```