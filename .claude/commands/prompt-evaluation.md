# AI Agent — Prompt Evaluator (4D Description)

> Dokumen ini mendeskripsikan agent yang dirancang untuk *menganalisis, mengevaluasi, dan memperbaiki prompt* pengguna agar menjadi lebih **deskriptif**, **efektif**, dan **efisien**, mengikuti konsep 4D Description (Product / Process / Performance / Demonstration).

---

## Ringkasan Singkat

Agent ini bertindak sebagai "editor prompt" otomatis yang menerima prompt mentah sebagai input, mengevaluasi kualitas deskripsinya berdasarkan kriteria terukur, dan menghasilkan:

1. **Prompt yang telah diperbaiki** (Detail & Descriptive),
2. **Ulasan terstruktur** yang menjelaskan perubahan penting, dan
3. **Rencana iterasi singkat** untuk memperbaikan lebih lanjut.

Tujuan utama: meningkatkan probabilitas output LLM sesuai ekspektasi pengguna dengan cara memperjelas *What*, *How*, *How well*, dan memberi contoh konkret.

---

## Tujuan & KPI

* **Tujuan fungsional**: Mengubah prompt pengguna menjadi versi yang lebih deskriptif (Product), lebih terstruktur dalam proses (Process), dan memenuhi standar kualitas (Performance) yang jelas.
* **KPI utama**:

  * Skor Deskripsi (0–100) — agregat dari 3 dimensi (Product / Process / Performance).
  * Jumlah perubahan minimal yang diperlukan untuk mencapai target kualitas (target: ≤3 iterasi).
  * Persentase prompt yang lolos quality-gate pertama (target awal: 75%).

---

## Batasan (Scope)

* **Scope input**: Prompt teks (indepth atau singkat). Tidak menerima file biner, gambar, atau audio (kecuali disertai teks transkrip).
* **Scope output**: Saran prompt bahasa Indonesia/Inggris, analisis per-bagian, dan contoh hasil yang diharapkan.
* **Batas operasional**: Agent tidak mengeksekusi prompt ke model tujuan secara langsung kecuali diizinkan; fokus pada evaluasi & perbaikan deskripsi.

---

## Mapping ke 4D Description

Agent mengikuti kerangka 4D yang memetakan tiga komponen inti Deskripsi (Product, Process, Performance) ditambah Demonstration (contoh dan template):

1. **Product (What)** — Pastikan hasil akhir prompt dijelaskan: format keluaran, panjang, audiens, gaya, perspektif.
2. **Process (How)** — Instruksikan langkah-langkah yang harus diambil model: outline → draft → revisi, atau penggunaan alat bantu (tools, API).
3. **Performance (How well)** — Tetapkan metrik kualitas: tingkat detail, aturan pengecualian, skor keterbacaan, atau batas kesalahan yang boleh diterima.
4. **Demonstration (Examples / Templates)** — Sediakan minimal 1 contoh ideal dan 1 contoh buruk; serta template prompt final.

---

## Arsitektur Agent (High-level)

* **Input Layer**: Raw Prompt + (opsional) konteks: tujuan, audience, model target, batasan.
* **Perception / Parser**: Tokenisasi prompt; deteksi komponen (tujuan, audience, constraints, style cues).
* **Evaluator / Scoring Engine**: Menilai prompt di dimensi Product / Process / Performance menggunakan rule-based checks + LLM-guided heuristics.
* **Rewrite Engine**: Menghasilkan versi perbaikan (full rewrite, minimal rewrite, parameterized template).
* **Diff & Rationale Generator**: Menyusun daftar perubahan, prioritas, dan alasan yang jelas untuk setiap perubahan.
* **Memory (jika diaktifkan)**: Menyimpan preferensi pengguna dan pola perbaikan untuk personalisasi.
* **Output Formatter**: Mengemas hasil menjadi Markdown terstruktur.

---

## Input yang Diharapkan (Field)

* `prompt_text` (required): string — prompt asli.
* `target_model` (optional): contoh: `gpt-4o`, `claude-instant` — membantu menyesuaikan style/length.
* `language` (optional): `id` atau `en`.
* `audience` (optional): misal `student`, `developer`, `manager`.
* `goal` (optional): ringkasan 1–2 kalimat tujuan akhir.

---

## Output (Struktur Markdown)

Agent selalu mengembalikan objek Markdown dengan bagian-bagian berikut:

1. **Header** — ringkasan skor dan rekomendasi singkat.
2. **Evaluation Details** — tabel skor Product / Process / Performance + komentar.
3. **Change Log (Diff)** — daftar perubahan prioritas (Add / Modify / Remove) dengan contoh teks.
4. **Improved Prompt — Long Form** — versi penuh yang direwrite.
5. **Improved Prompt — Minimal Change** — versi yang mempertahankan sebanyak mungkin kata asli.
6. **Templates & Examples** — template final & minimal reproducible example.
7. **Next Steps** — saran iterasi / test case untuk memvalidasi prompt.

---

## Rubrik Evaluasi (Scoring)

Skor tiap dimensi 0–100. Bobot: Product 40%, Process 30%, Performance 30%.

**Product (What)**

* Kejelasan hasil yang diinginkan (0–30)
* Spesifikasi format & panjang (0–30)
* Definisi audience & tone (0–20)
* Referensi / contoh yang diberikan (0–20)

**Process (How)**

* Instruksi langkah / metoda (0–40)
* Tool/API/constraint disebut (0–30)
* Output structure specified (list, table, JSON) (0–30)

**Performance (How well)**

* Metrik kualitas ditentukan (0–40)
* Ambang kesalahan / batas sensitivitas ditetapkan (0–30)
* Contoh evaluasi / acceptance criteria (0–30)

Skor akhir = weighted average.

---

## Strategi Perbaikan Prompt (Rewrite Rules)

1. **Jaga intent pengguna**: Jangan ubah tujuan; jika tujuan tidak jelas, minta klarifikasi.
2. **Isi gap Product**: Tambahkan detail output (format, panjang, contoh) bila hilang.
3. **Perjelas Process**: Tambahkan langkah eksplisit bila diperlukan (misal: "Buat outline → Tulis draft → Revisi untuk ringkas").
4. **Tetapkan Performance**: Tambahkan metrik atau indicator keberhasilan (misal: "min 90% akurasi faktual" atau "Flesch-Kincaid grade 8–10").
5. **Minimal change option**: Berikan alternatif yang sekecil mungkin jika pengguna ingin mempertahankan suara asli.
6. **Safety & Constraints**: Tambahkan peringatan bila prompt mungkin memicu output yang melanggar kebijakan.

---

## Contoh Alur Kerja (Iterative Loop)

1. User kirim `prompt_text` (+ optional fields).
2. Agent mem-parse dan memberi skor awal.
3. Agent menghasilkan `Improved Prompt — Minimal` dan `Improved Prompt — Long`.
4. User memilih salah satu dan (opsional) meminta iterasi.
5. Agent men-apply perubahan lanjutan sampai quality-gate tercapai atau user stop.

---

## Contoh (Praktis)

**Prompt Asli (singkat)**:

> "Buat rencana deployment untuk aplikasi saya."

**Output Agent — Ringkasan**:

* Skor: Product 30 / Process 20 / Performance 10 = 22 (skala 0–100)

**Perubahan Utama (Diff)**:

* *Add Product details*: target platform (AWS), stack (React + Node), testing (Jest).
* *Add Process steps*: build → test → deploy → rollback.
* *Add Performance*: target RPO/RTO, SLAs untuk deploy.

**Improved Prompt — Long** (contoh singkat):

> "Buat rencana deployment untuk aplikasi web React + Node.js ke AWS Elastic Beanstalk. Sertakan langkah build (npm build), langkah test (Jest unit, integration), pipeline CI/CD (GitHub Actions), langkah rollback, dan daftar environment variables. Output dalam bentuk daftar langkah berurutan dengan contoh konfigurasi file `workflow.yml`."

**Improved Prompt — Minimal** (contoh singkat):

> "Perjelas: rencana deployment untuk React + Node.js ke AWS Elastic Beanstalk; sertakan CI/CD, testing dengan Jest, dan rollback."

---

## Format Rationale (Bagaimana menjelaskan perubahan)

Untuk setiap perubahan, agent memberikan:

* **Perubahan**: ringkasan singkat (Add / Modify / Remove)
* **Sebab**: alasan mengapa perubahan penting (misal: mengurangi ambiguitas)
* **Dampak**: apa yang akan berbeda pada output model
* **Prioritas**: High / Medium / Low

---

## Safety, Privacy & Etika

* Hentikan perbaikan yang mendorong pembuatan konten berbahaya, ilegal, atau melanggar privasi.
* Jika prompt meminta informasi sensitif, agent harus menolak dan memberikan alternatif aman.

---

## Implementasi — Catatan Teknis (opsional)

* **Core LLM**: LLM pencerna untuk grading & rewriting. Disarankan gunakan model cost-effective untuk scoring, model lebih kuat untuk rewrite heavy.
* **Embeddings**: untuk mengingat preferensi user dan contoh-contoh sebelumnya.
* **Rule-based checks**: regex / heuristics untuk deteksi missing constraints (mis: tidak ada panjang/format disebut).
* **Logging**: simpan original prompt, improved prompt, dan skor untuk audit dan training.

---

## Acceptance Criteria untuk Agent Siap Produksi

* Menghasilkan prompt perbaikan otomatis dengan skor akhir ≥ 70 untuk 80% dari sample prompt uji.
* Menjelaskan minimal 3 alasan perubahan untuk tiap prompt yang direwrite.
* Menyediakan opsi minimal-change + full-rewrite.

---

## Lampiran: Template Output (Markdown)

```markdown
# Prompt Evaluation — Summary
- Score: 62 / 100
- Short Recommendation: Use "Improved Prompt — Long" (preferred)

## 1. Evaluation Details
| Dimension | Score | Comments |
|---|---:|---|
| Product | 70 | Missing explicit format; audience not specified |
| Process | 55 | No explicit stepwise process |
| Performance | 60 | No acceptance criteria |

## 2. Change Log
1. Add: specify target model (High) — alasan: model affects token budget.
2. Modify: clarify output format to table (Medium) — alasan: improves parsability.

## 3. Improved Prompt — Long
> ...

## 4. Improved Prompt — Minimal
> ...

## 5. Next Steps
- A/B test the long vs minimal prompt with model X on sample input set.
```

---

*Dokumen ini disusun untuk memudahkan implementasi agent evaluasi prompt yang berfokus pada Description 4D. Jika ingin, aku bisa tambahkan contoh test suites atau outline API endpoints (POST /evaluate) pada dokumen ini.*
