---
description: Format dokumentasi task untuk Frontend Developer - React components, hooks, dan UI logic
alwaysApply: false
---

# Panduan Dokumentasi Task Frontend (task-fe-xxx.md)

## Tujuan Panduan

Dokumen ini berisi panduan standar format dokumentasi task Frontend dalam project Maguru. Format ini khusus untuk task yang berhubungan dengan pengembangan React components, custom hooks, state management, dan integrasi UI dengan API sesuai arsitektur 3-layer (Presentation, Logic, Data).

## Format Standar task-fe-xxx.md

# Task FE-[ID]: [Judul Task Frontend]

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Perbandingan dengan Referensi](mdc:#perbandingan-dengan-referensi) (opsional)
3. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
4. [Spesifikasi Teknis FE](mdc:#spesifikasi-teknis-fe)
5. [Implementasi Teknis](mdc:#implementasi-teknis)
6. [Peningkatan UX](mdc:#peningkatan-ux) (opsional)
7. [Test Plan](mdc:#test-plan)
8. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi) (opsional)

## Pendahuluan

[Deskripsi singkat task (1-2 paragraf) mencakup tujuan, konteks dalam sprint/project, dan nilai bisnis yang dihasilkan. Jelaskan bagaimana task ini berkontribusi pada user experience dan fitur aplikasi.]

> **⚠️ PENTING**: Dalam task docs jangan memberikan contoh pseudocode details

## Perbandingan dengan Referensi

[Jika task terinspirasi oleh fitur dari aplikasi lain, sertakan tabel perbandingan seperti ini]

| Fitur        | Referensi (misal: React Admin) | Project Kita                        |
| ------------ | ------------------------------ | ----------------------------------- |
| [Nama Fitur] | [Implementasi di referensi]    | [Implementasi yang kita rencanakan] |
| [Fitur lain] | [Deskripsi]                    | [Deskripsi]                         |

## Batasan dan Penyederhanaan Implementasi

### Technical Constraints

- [Batasan teknis yang mempengaruhi implementasi FE]
- [Keterbatasan library atau framework yang digunakan]

### UI/UX Constraints

- [Batasan desain yang harus diikuti]
- [Komponen UI yang sudah ada dan harus digunakan]

### Performance Constraints

- [Batasan performa yang harus diperhatikan]
- [Bundle size atau loading time requirements]

## Spesifikasi Teknis FE

### Struktur Data (TypeScript Interfaces)

[Deskripsi tipe data yang dibutuhkan untuk komponen dan hooks]

```typescript
// Contoh TypeScript interfaces
interface ComponentProps {
  // Props yang dibutuhkan komponen
}

interface HookReturn {
  // Return value dari custom hook
}
```

### Komponen yang Dibutuhkan

#### Presentation Layer Components

- [Daftar komponen React yang akan dibuat/dimodifikasi]
- [Lokasi: `features/[fitur]/components/`]
- [Props dan state yang dibutuhkan]

#### Existing UI Components

- [Komponen dari `components/ui/` yang akan digunakan]
- [Modifikasi yang diperlukan pada komponen existing]

### Custom Hooks yang Dibutuhkan

#### Logic Layer Hooks

- [Daftar custom hooks yang akan dibuat]
- [Lokasi: `features/[fitur]/hooks/`]
- [Logic yang akan dihandle oleh setiap hook]

#### State Management Strategy

- [Local state vs Context vs external state management]
- [Bagaimana state akan di-share antar komponen]

### Routing & Layout Changes

#### App Router Changes

- [Perubahan pada `app/` directory]
- [Page components yang akan dibuat/dimodifikasi]
- [Layout changes jika diperlukan]

## Implementasi Teknis

### Component Architecture

[Deskripsi high-level pendekatan implementasi komponen]

### Custom Hooks Implementation

[Deskripsi logic yang akan diimplementasikan dalam custom hooks]

### API Integration

#### API Client/Fetcher

- [Implementasi di `features/[fitur]/api.ts`]
- [Fungsi untuk komunikasi dengan backend]

#### Error Handling

- [Strategi error handling di frontend]
- [Loading states dan error states]

### TypeScript Types

#### Type Definitions

- [Types yang akan didefinisikan di `features/[fitur]/types.ts`]
- [Shared types dengan backend]

## Flow Pengguna

[Deskripsi step-by-step bagaimana pengguna berinteraksi dengan fitur]

### User Interaction Flow

1. Pengguna [melakukan aksi di UI]
2. Komponen [menangani event]
3. Custom hook [memproses logic]
4. API client [mengirim request ke backend]
5. UI [menampilkan response/feedback]

### Happy Path

- [Deskripsi alur normal interaksi user]

### Error Paths

- [Deskripsi alur ketika terjadi error]
- [Bagaimana error ditampilkan ke user]

## Peningkatan UX

[Deskripsi peningkatan UX yang direncanakan untuk membuat fitur lebih user-friendly]

### Loading States

- [Implementasi loading indicators]
- [Skeleton screens atau spinners]

### Error Handling UX

- [User-friendly error messages]
- [Recovery options untuk user]

### Accessibility Improvements

- [ARIA labels dan semantic HTML]
- [Keyboard navigation support]

## Test Plan

### Unit Testing

- [Testing strategy untuk komponen React]
- [Testing strategy untuk custom hooks]
- [Tools: Jest + React Testing Library]

### Integration Testing

- [Testing interaksi antar komponen]
- [Testing integrasi dengan API]

### Accessibility Testing

- [Automated accessibility testing]
- [Manual testing checklist]

## Pertanyaan untuk Diklarifikasi

[Daftar pertanyaan yang perlu dijawab sebelum/selama implementasi]

1. [Pertanyaan terkait UI/UX design]
2. [Pertanyaan terkait API contract]
3. [Pertanyaan terkait performance requirements]

## Acceptance Criteria

| Kriteria Frontend                                     | Status | Keterangan |
| ----------------------------------------------------- | ------ | ---------- |
| [Komponen X berfungsi sesuai design]                  |        |            |
| [Custom hook Y mengelola state dengan benar]          |        |            |
| [Error handling menampilkan pesan yang user-friendly] |        |            |
| [Responsive design bekerja di semua device]           |        |            |
| [Accessibility standards terpenuhi]                   |        |            |
| ...                                                   |        |            |

---

## Panduan Penggunaan

### Penamaan File

- Format: `task-fe-[ID].md` (contoh: `task-fe-173.md`)
- Simpan di direktori `features/[feature-name]/docs/task-fe/`

### Integrasi dengan Task Lain

- **FE ← UI**: Setiap task FE harus mereferensikan task UI yang menyediakan design specs
- **FE → BE**: Jika ada kebutuhan API baru, referensikan task BE terkait

### Arsitektur Compliance

- **Presentation Layer**: Fokus pada `features/[fitur]/components/`
- **Logic Layer**: Fokus pada `features/[fitur]/hooks/`
- **Data Layer**: Integrasi via `features/[fitur]/api.ts`

### Approval Process

1. **Draft**: Dokumentasi awal dibuat oleh FE Developer
2. **Review**: Ditinjau oleh UI/UX Designer dan BE Developer
3. **Final**: Disetujui dan siap untuk implementasi

### Best Practices

- Konsistensi terminologi sesuai dengan glossary project
- Spesifik dan terukur untuk acceptance criteria
- Referensi visual dari task UI terkait
- Fokus pada satu fitur/perubahan per task
- Dokumentasikan semua dependencies dan constraints

### Story Points & Prioritas

- **Must Have**: Fitur yang wajib ada untuk release
- **Should Have**: Penting tapi tidak kritis
- **Could Have**: Diinginkan tapi dapat ditunda
- **Story Points**: Ikuti skala Fibonacci (1, 2, 3, 5, 8, 13)

### Integrasi dengan JIRA

1. Cantumkan kode task (FE-xxx) dalam nama file dan judul dokumen
2. Lampirkan link ke dokumen ini di deskripsi task JIRA
3. Update status task di JIRA sesuai progres dokumentasi dan implementasi
