Context: Saya sedang mengerjakan project rental management dengan Next.js

- TypeScript + Prisma. Terjadi error pada komponen
  MaterialManagementContent saat menjalankan testing untuk task RPK-45.

Request: Tolong lakukan analisis sistematis dan perbaikan error
berdasarkan log berikut:

- File task: features/manage-product/docs/task/RPK-45/RPK-45.md
- Error logs: services/client.log dan services/server.log

Process yang diharapkan:

1. Analisis Logs: Baca dan interpretasi error dari kedua log files
2. Root Cause Analysis: Identifikasi penyebab utama error pada
   MaterialManagementContent
3. Code Review: Periksa implementasi komponen terkait
4. Solution Implementation: Implementasikan perbaikan yang diperlukan
5. Validation: Pastikan solusi tidak menimbulkan regression

Output yang diinginkan:

- Laporan analisis error (format markdown)
- Kode perbaikan yang diimplementasikan
- Penjelasan perubahan yang dilakukan
- Rekomendasi untuk mencegah error serupa

Kriteria sukses: Error teratasi, testing berjalan lancar, tidak ada
breaking changes pada fitur lain.

4. Improved Prompt — Minimal

Analisis error MaterialManagementContent dari testing RPK-45. Log
tersedia di services/client.log dan services/server.log. Tolong:

1. Identifikasi root cause dari logs
2. Review file task di features/manage-product/docs/task/RPK-45/RPK-45.md
3. Implementasikan perbaikan
4. Berikan laporan analisis + solusi dalam format markdown

5. Templates & Examples

Template untuk analisis error debugging:

## Error Analysis Report

### 1. Error Summary

- Component: [nama komponen]
- Error Type: [runtime/compile/test error]
- Severity: [High/Medium/Low]

### 2. Root Cause Analysis

- Primary cause: [penjelasan]
- Contributing factors: [faktor pendukung]

### 3. Solution Implemented

- Files modified: [daftar file]
- Changes made: [ringkasan perubahan]

### 4. Validation Results

- Tests status: [pass/fail]
- Side effects: [ada/tidak ada]
