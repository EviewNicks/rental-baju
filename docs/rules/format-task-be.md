---
description: Format dokumentasi task untuk Backend Developer - API routes, database, dan business logic
alwaysApply: false
---

# Panduan Dokumentasi Task Backend (task-be-xxx.md)

## Tujuan Panduan

Dokumen ini berisi panduan standar format dokumentasi task Backend dalam project Maguru. Format ini khusus untuk task yang berhubungan dengan pengembangan API routes, database schema, business logic, dan data processing sesuai arsitektur 3-layer (Presentation, Logic, Data).

## Format Standar task-be-xxx.md

# Task BE-[ID]: [Judul Task Backend]

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Perbandingan dengan Referensi](mdc:#perbandingan-dengan-referensi) (opsional)
3. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
4. [Spesifikasi Teknis BE](mdc:#spesifikasi-teknis-be)
5. [Implementasi Teknis](mdc:#implementasi-teknis)
6. [Security & Performance](mdc:#security--performance) (opsional)
7. [Test Plan](mdc:#test-plan)
8. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi) (opsional)

## Pendahuluan

[Deskripsi singkat task (1-2 paragraf) mencakup tujuan, konteks dalam sprint/project, dan nilai bisnis yang dihasilkan. Jelaskan bagaimana task ini mendukung fitur frontend dan kebutuhan data aplikasi.]

> **⚠️ PENTING**: Dalam task docs jangan memberikan contoh pseudocode details

## Perbandingan dengan Referensi

[Jika task terinspirasi oleh API atau sistem dari aplikasi lain, sertakan tabel perbandingan seperti ini]

| Fitur        | Referensi (misal: REST API) | Project Kita                        |
| ------------ | --------------------------- | ----------------------------------- |
| [Nama Fitur] | [Implementasi di referensi] | [Implementasi yang kita rencanakan] |
| [Fitur lain] | [Deskripsi]                 | [Deskripsi]                         |

## Batasan dan Penyederhanaan Implementasi

### Technical Constraints

- [Batasan teknis yang mempengaruhi implementasi BE]
- [Keterbatasan database atau framework yang digunakan]

### Performance Constraints

- [Batasan performa yang harus diperhatikan]
- [Response time requirements]
- [Database query optimization needs]

### Security Constraints

- [Batasan keamanan yang harus dipenuhi]
- [Authentication dan authorization requirements]

## Spesifikasi Teknis BE

### Database Schema Changes

[Deskripsi perubahan skema database yang diperlukan]

```prisma
// Contoh skema Prisma yang akan ditambahkan/dimodifikasi
model NewModel {
  id        String   @id @default(uuid())
  field1    String
  field2    Boolean  @default(false)
  // ...lainnya
}
```

### API Endpoints Design

#### Endpoint Specifications

- [Daftar API endpoints yang akan dibuat/dimodifikasi]
- [Lokasi: `app/api/[fitur]/route.ts`]
- [HTTP methods, parameters, dan response format]

#### Request/Response Contracts

- [TypeScript interfaces untuk request dan response]
- [Validation rules dan constraints]

### Business Logic Requirements

#### Core Logic

- [Business rules yang harus diimplementasikan]
- [Data processing dan transformation logic]

#### Validation Rules

- [Input validation requirements]
- [Business rule validations]

## Implementasi Teknis

### API Route Implementation

#### Route Handler Structure

- [Struktur handler untuk setiap HTTP method]
- [Error handling strategy]

#### Middleware Integration

- [Authentication middleware]
- [Validation middleware]
- [Logging dan monitoring]

### Database Operations

#### Prisma ORM Usage

- [Query patterns yang akan digunakan]
- [Database relationships dan joins]

#### Data Processing

- [Data transformation logic]
- [Aggregation dan calculation logic]

### Error Handling Strategy

#### HTTP Status Codes

- [Mapping error types ke status codes]
- [Consistent error response format]

#### Logging & Monitoring

- [Error logging strategy]
- [Performance monitoring points]

## Data Flow & Processing

[Deskripsi alur data dari request sampai response]

### Request Processing Flow

1. Client [mengirim request ke API]
2. Middleware [memvalidasi dan autentikasi]
3. Route handler [memproses business logic]
4. Database [menyimpan/mengambil data]
5. Response [dikirim kembali ke client]

### Data Transformation

- [Input data processing]
- [Output data formatting]

### Caching Strategy

- [Caching requirements jika ada]
- [Cache invalidation strategy]

## Security & Performance

### Authentication & Authorization

- [Authentication method yang digunakan]
- [Role-based access control]
- [API key atau token management]

### Data Validation

- [Input sanitization]
- [SQL injection prevention]
- [XSS protection]

### Performance Optimization

- [Database query optimization]
- [Response time targets]
- [Resource usage optimization]

## Test Plan

### Unit Testing

- [Testing strategy untuk business logic]
- [Testing strategy untuk API handlers]
- [Tools: Jest + testing utilities]

### Integration Testing

- [Database integration testing]
- [API endpoint testing]
- [Authentication flow testing]

### API Testing

- [Endpoint testing dengan Postman/Insomnia]
- [Load testing untuk performance]
- [Security testing]

### Database Testing

- [Schema validation testing]
- [Migration testing]
- [Data integrity testing]

## Pertanyaan untuk Diklarifikasi

[Daftar pertanyaan yang perlu dijawab sebelum/selama implementasi]

1. [Pertanyaan terkait API contract dengan FE]
2. [Pertanyaan terkait database design]
3. [Pertanyaan terkait security requirements]
4. [Pertanyaan terkait performance requirements]

## Acceptance Criteria

| Kriteria Backend                                     | Status | Keterangan |
| ---------------------------------------------------- | ------ | ---------- |
| [API endpoint X berfungsi sesuai spesifikasi]        |        |            |
| [Database schema Y terimplementasi dengan benar]     |        |            |
| [Business logic Z memproses data sesuai rules]       |        |            |
| [Error handling menampilkan response yang konsisten] |        |            |
| [Performance target tercapai]                        |        |            |
| [Security requirements terpenuhi]                    |        |            |
| ...                                                  |        |            |

---

## Panduan Penggunaan

### Penamaan File

- Format: `task-be-[ID].md` (contoh: `task-be-173.md`)
- Simpan di direktori `features/[feature-name]/docs/task-be/`

### Integrasi dengan Task Lain

- **BE ← FE**: Setiap task BE harus mereferensikan task FE yang membutuhkan API
- **BE ← UI**: Jika ada kebutuhan data khusus untuk UI, referensikan task UI terkait

### Arsitektur Compliance

- **Data Layer**: Fokus pada `app/api/[fitur]/route.ts`
- **Database**: Fokus pada `prisma/` schema dan migrations
- **API Client**: Opsional di `features/[fitur]/api.ts` jika logic fetch kompleks

### Approval Process

1. **Draft**: Dokumentasi awal dibuat oleh BE Developer
2. **Review**: Ditinjau oleh FE Developer dan Product Owner
3. **Final**: Disetujui dan siap untuk implementasi

### Best Practices

- Konsistensi terminologi sesuai dengan glossary project
- Spesifik dan terukur untuk acceptance criteria
- Dokumentasikan semua API contracts dengan jelas
- Fokus pada satu fitur/perubahan per task
- Pertimbangkan backward compatibility

### Story Points & Prioritas

- **Must Have**: Fitur yang wajib ada untuk release
- **Should Have**: Penting tapi tidak kritis
- **Could Have**: Diinginkan tapi dapat ditunda
- **Story Points**: Ikuti skala Fibonacci (1, 2, 3, 5, 8, 13)

### Integrasi dengan JIRA

1. Cantumkan kode task (BE-xxx) dalam nama file dan judul dokumen
2. Lampirkan link ke dokumen ini di deskripsi task JIRA
3. Update status task di JIRA sesuai progres dokumentasi dan implementasi

### API Documentation

- Dokumentasikan semua endpoints dengan format yang konsisten
- Sertakan contoh request dan response
- Jelaskan error codes dan handling
- Update API documentation setelah implementasi
