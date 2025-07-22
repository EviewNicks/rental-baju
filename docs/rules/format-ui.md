---
description: Format dokumentasi task untuk UI/UX Designer - wireframe, mockup, dan style UI
alwaysApply: false
---

# Panduan Dokumentasi Task UI/UX (task-ui-xxx.md)

## Tujuan Panduan

Dokumen ini berisi panduan standar format dokumentasi task UI/UX dalam project Maguru. Format ini khusus untuk task yang berhubungan dengan desain UI, wireframe, mockup, dan style guide yang akan diimplementasikan oleh Frontend Developer.

## Format Standar task-ui-xxx.md

# Task UI-[ID]: [Judul Task UI/UX]

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Referensi Visual & Inspirasi](mdc:#referensi-visual--inspirasi)
3. [Prinsip & Guideline UI/UX](mdc:#prinsip--guideline-uiux)
4. [Spesifikasi UI & Komponen](mdc:#spesifikasi-ui--komponen)
5. [Flow Pengguna & Interaksi](mdc:#flow-pengguna--interaksi)
6. [Layout, Responsive & Accessibility](mdc:#layout-responsive--accessibility)
7. [Design Rationale & Constraints](mdc:#design-rationale--constraints)
8. [Handoff Requirements](mdc:#handoff-requirements)
9. [Acceptance Criteria](mdc:#acceptance-criteria)
10. [Test Plan](mdc:#test-plan)
11. [Lampiran](mdc:#lampiran)

## Pendahuluan

[Deskripsi singkat tujuan, konteks, dan nilai bisnis dari task UI/page ini. Jelaskan mengapa desain ini penting dan bagaimana akan meningkatkan user experience.]

## Referensi Visual & Inspirasi

### Wireframe & Mockup

- [Link/attach wireframe, mockup, atau referensi visual lain]
- [Deskripsi singkat tentang konsep desain]

### Inspirasi & Referensi

- [Aplikasi/brand/gaya yang menjadi inspirasi]
- [Alasan pemilihan referensi tersebut]

### Existing Components

- [Referensi ke komponen UI yang sudah ada di `components/ui/`]
- [Komponen yang perlu dimodifikasi atau dibuat baru]

## Prinsip & Guideline UI/UX

### Design System

- [Sebutkan guideline utama yang harus diikuti: theme, token, komponen, dsb]
- [Referensi ke dokumen UI/UX utama project]

### Brand Consistency

- [Prinsip yang memastikan konsistensi dengan brand guidelines]
- [Color palette, typography, spacing yang digunakan]

### User Experience Principles

- [Prinsip UX yang diterapkan dalam desain ini]
- [Bagaimana desain ini memenuhi kebutuhan user]

## Spesifikasi UI & Komponen

### Komponen Utama

- [Daftar komponen utama yang digunakan (card, button, table, dsb)]
- [Spesifikasi detail setiap komponen]

### State Management

- [State penting (loading, error, empty, success, dsb)]
- [Bagaimana setiap state ditampilkan secara visual]

### Visual Elements

- [Token warna, font, spacing, dsb yang wajib digunakan]
- [Icon, illustration, atau visual elements lain]

## Flow Pengguna & Interaksi

### User Journey

- [Langkah-langkah interaksi user pada page/komponen ini]
- [Flow yang diharapkan dari user]

### Interaction Patterns

- [Event penting, affordance, feedback visual]
- [Micro-interactions dan animasi]

### Error States

- [Bagaimana error ditampilkan]
- [Recovery path untuk user]

## Layout, Responsive & Accessibility

### Layout Structure

- [Struktur grid/layout, breakpoints]
- [Hierarchy visual dan information architecture]

### Responsive Design

- [Prinsip responsive (mobile, tablet, desktop)]
- [Adaptasi layout untuk berbagai ukuran layar]

### Accessibility Standards

- [Kontras warna yang memenuhi WCAG guidelines]
- [Focus ring, keyboard navigation]
- [ARIA labels dan semantic HTML]
- [Screen reader compatibility]

## Design Rationale & Constraints

### Design Decisions

- [Alasan di balik keputusan desain utama]
- [Trade-off yang dipertimbangkan]

### Technical Constraints

- [Batasan teknis yang mempengaruhi desain]
- [Keterbatasan library UI atau framework]

### Business Constraints

- [Batasan bisnis yang mempengaruhi desain]
- [Timeline, budget, atau resource constraints]

## Handoff Requirements

### Assets & Resources

- [Figma/Zeplin link untuk developer]
- [Export assets (icons, images, etc.)]
- [Design tokens dan variables]

### Documentation

- [Spesifikasi teknis untuk developer]
- [Komponen yang perlu dibuat atau dimodifikasi]
- [Integration points dengan existing components]

### Collaboration Points

- [Kapan review implementasi akan dilakukan]
- [Feedback mechanism dengan FE developer]

## Acceptance Criteria

| Kriteria UI/UX                  | Status | Keterangan |
| ------------------------------- | ------ | ---------- |
| [Contoh: Button utama gold]     |        |            |
| [Contoh: Layout 2 kolom]        |        |            |
| [Contoh: Responsive mobile]     |        |            |
| [Contoh: Accessibility WCAG AA] |        |            |
| ...                             |        |            |

## Test Plan

### Visual Testing

- [Deskripsi test visual yang akan dilakukan]
- [Cross-browser compatibility testing]
- [Device testing checklist]

### Accessibility Testing

- [Checklist aksesibilitas manual]
- [Tools yang akan digunakan (axe, WAVE, etc.)]
- [Screen reader testing]

### User Testing

- [Usability testing plan]
- [User feedback collection method]

## Lampiran

### Wireframe/Mockup/Diagram

- [Sisipkan wireframe, mockup, atau diagram yang relevan]
- [Link website yang bisa dijadikan referensi]

### Design Files

- [Link ke file Figma/Sketch]
- [Asset library dan resources]

### Related Tasks

- [Link ke task FE terkait]
- [Link ke task BE jika ada kebutuhan data khusus]

---

## Panduan Penggunaan

### Penamaan File

- Format: `task-ui-[ID].md` (contoh: `task-ui-21.md`)
- Simpan di direktori `features/[feature-name]/docs/task-ui/`

### Integrasi dengan Task Lain

- **UI → FE**: Setiap task UI harus mereferensikan task FE yang akan mengimplementasikan desain
- **UI → BE**: Jika ada kebutuhan data khusus untuk UI, referensikan task BE terkait

### Approval Process

1. **Draft**: Dokumentasi awal dibuat oleh UI/UX Designer
2. **Review**: Ditinjau oleh FE Developer untuk feasibility
3. **Final**: Disetujui dan siap untuk handoff ke FE Developer

### Best Practices

- Gunakan format ini untuk semua task yang berhubungan dengan desain UI, wireframe, atau pembuatan page baru
- Pastikan semua komponen dan style mengacu pada guideline UI/UX utama project
- Sertakan screenshot atau mockup untuk kejelasan
- Dokumentasikan semua constraint dan rationale untuk referensi masa depan
