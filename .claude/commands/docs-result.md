---
description: Buatlah sebuah docs result dari docs-task sesuai dengan format @docs\rules\format-result.md
globs: 
alwaysApply: true
---

Anda akan membuat dokumentasi hasil implementasi berdasarkan task documentation yang sudah ada. Ikuti format dan struktur yang telah didefinisikan dalam @docs\rules\format-result.md.

## Langkah-langkah:

1. **Identifikasi Task Documentation**: Cari file task-ops-xxx.md yang relevan di direktori `features/[feature-name]/docs/task-docs/`

2. **Analisis Implementasi**: Review implementasi aktual yang telah dilakukan, termasuk:
   - Komponen yang dibuat
   - API endpoints yang diimplementasi
   - Database schema changes
   - Testing yang dilakukan

3. **Buat Result Documentation**: Gunakan template dari format-result.md untuk membuat dokumentasi hasil dengan struktur:
   - Header dengan status, tanggal, developer
   - Ringkasan implementasi
   - Perubahan dari rencana awal
   - Status acceptance criteria
   - Detail implementasi
   - Kendala dan solusi
   - Rekomendasi selanjutnya

4. **Simpan di Lokasi yang Tepat**: Simpan file result-ops-[ID].md di direktori `features/[feature-name]/docs/result-docs/`

## Format Penamaan:
- File: `result-ops-[ID].md` (sesuai dengan ID task asli)
- Lokasi: `features/[feature-name]/docs/result-docs/`

## Panduan Penulisan:
- Faktual dan objektif
- Bandingkan hasil aktual dengan rencana awal
- Dokumentasikan keputusan dan perubahan
- Hindari pseudocode, fokus pada pendekatan tingkat tinggi
- Sertakan status yang akurat untuk setiap acceptance criteria

Pastikan dokumentasi hasil dapat membantu developer lain memahami implementasi yang telah dilakukan dan menjadi referensi untuk pengembangan selanjutnya.