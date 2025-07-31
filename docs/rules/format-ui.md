---
description: Format dokumentasi task untuk UI/UX Designer - wireframe, mockup, dan style UI
alwaysApply: false
---

# Panduan Dokumentasi Task UI/UX (task-ui-xxx.md)

## Tujuan Panduan

Dokumen ini berisi panduan standar format dokumentasi task UI/UX dalam project Maguru. Format ini khusus untuk task yang berhubungan dengan desain UI, wireframe, mockup, dan style guide yang akan diimplementasikan oleh Frontend Developer.

## Format Standar task-ui-xxx.md

# Task UI-[ID]: [Judul Task UI/UX]

## Pendahuluan

[Deskripsi singkat tujuan, konteks, dan nilai bisnis dari task UI/page ini. Jelaskan mengapa desain ini penting dan bagaimana akan meningkatkan user experience.]

## Scope Fitur

### Cakuoan Fitur

- [Deskripsi singkat tentang fitur yang akan dibuat]

### Inspirasi & Referensi

- [Aplikasi/brand/gaya yang menjadi inspirasi]
- [Alasan pemilihan referensi tersebut]

## Layout and Page Feature

layout dan page apa yang pelru di buat?

### List page feature

### Page 1

- Tujuan
- Kompoennt Utama

### User Journey

- [Langkah-langkah interaksi user pada page/komponen ini]
- [Flow yang diharapkan dari user]

## Acceptance Criteria

| Kriteria UI/UX                  | Status | Keterangan |
| ------------------------------- | ------ | ---------- |
| [Contoh: Button utama gold]     |        |            |
| [Contoh: Layout 2 kolom]        |        |            |
| [Contoh: Responsive mobile]     |        |            |
| [Contoh: Accessibility WCAG AA] |        |            |
| ...                             |        |            |

### Page 2

- Tujuan
- Kompoennt Utama

### User Journey

- [Langkah-langkah interaksi user pada page/komponen ini]
- [Flow yang diharapkan dari user]

## Acceptance Criteria

| Kriteria UI/UX                  | Status | Keterangan |
| ------------------------------- | ------ | ---------- |
| [Contoh: Button utama gold]     |        |            |
| [Contoh: Layout 2 kolom]        |        |            |
| [Contoh: Responsive mobile]     |        |            |
| [Contoh: Accessibility WCAG AA] |        |            |
| ...                             |        |            |

...

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
