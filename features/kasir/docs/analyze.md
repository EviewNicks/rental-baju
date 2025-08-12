Lakukan analisis komprehensif terhadap log troubleshooting sistem kasir  
 dengan instruksi berikut:

SUMBER DATA:

- File: services/client-log.log (log frontend/client-side)
- File: services/server-log.log (log backend/API)
- Fokus: Sistem pengembalian barang (return process)

METODOLOGI ANALISIS:

1. Timeline Analysis — Identifikasi kronologi error dan pattern
   kegagalan
2. Root Cause Analysis — Tentukan penyebab utama dari setiap issue yang  
   ditemukan
3. Impact Assessment — Evaluasi dampak terhadap business process dan  
   user experience
4. Error Classification — Kategorikan error berdasarkan severity dan  
   priority

OUTPUT REQUIREMENTS:

- Format: Markdown document
- Target file: features/kasir/docs/analyze.md
- Panjang: 1500-3000 kata
- Audience: Development team dan product stakeholders

STRUKTUR DOKUMEN YANG DIHARAPKAN:

# Log Analysis Report - Kasir Return System

## Executive Summary

## Issues Identified (dengan severity classification)

## Root Cause Analysis

## Business Impact Assessment

## Recommended Actions (immediate vs long-term)

## Technical Details & Evidence

KRITERIA KUALITAS:

- Include specific error messages, timestamps, dan request IDs dari log
- Provide actionable recommendations dengan priority matrix
- Cross-reference antara client-side dan server-side events
- Minimum 3 concrete solutions untuk setiap critical issue yang
  ditemukan


