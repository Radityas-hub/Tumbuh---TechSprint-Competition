# Backend Sprint Task Detail Tumbuh

Dokumen ini adalah pecahan detail dari `docs/backend-sprint-breakdown.md`. Formatnya dibuat seperti backlog engineering agar tiap sprint bisa langsung diubah menjadi issue/task board.

## Cara Membaca

- **P0**: wajib untuk MVP.
- **P1**: penting, tetapi bisa ditunda jika waktu sprint ketat.
- **P2**: polish atau enhancement.
- **BE**: backend.
- **FE**: frontend integration.
- **QA**: testing/verification.
- **DOC**: dokumentasi.
- **S/M/L**: estimasi relatif kecil/sedang/besar.

## Sprint 1 - Fondasi Backend, Auth, dan Database

Status: `Done` pada 5 Mei 2026.

### Target Sprint

Backend punya fondasi yang stabil: environment siap, Prisma schema awal ada, auth context tersedia, format response konsisten, dan endpoint `/api/me` bisa dipakai frontend.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S1-T01 | P0 | BE | S | Lengkapi env backend lokal | Selesai. `.env` aktif dan `.env.example` sudah memuat auth/storage placeholder yang diperlukan. |
| S1-T02 | P0 | BE | S | Validasi Prisma setup | Selesai. `prisma validate` dan typecheck lokal lolos. |
| S1-T03 | P0 | BE | L | Desain Prisma model awal | Selesai. Model `Guardian`, `Child`, `Consent`, `ProgressEntry`, `MediaAsset`, `RoadmapItem`, `Insight`, `AuditLog` sudah ada di schema. |
| S1-T04 | P0 | BE | M | Buat migration pertama | Selesai. Migration awal tersimpan di `prisma/migrations/20260505150000_init`. |
| S1-T05 | P0 | BE | M | Buat API response helper | Selesai. Format sukses dan error konsisten tersedia di helper API. |
| S1-T06 | P0 | BE | M | Buat Zod validation helper | Selesai. Helper parse body, params, dan query dengan response `400` yang seragam sudah tersedia. |
| S1-T07 | P0 | BE | M | Setup auth server helper | Selesai. Helper mengambil user aktif dan membuat/mencari `Guardian`. |
| S1-T08 | P0 | BE | M | Implement auth guard | Selesai. Route private return `401` jika tidak ada session. |
| S1-T09 | P0 | BE | M | Implement `GET /api/me` | Selesai. Endpoint mengembalikan data guardian aktif dan status child/onboarding ringkas. |
| S1-T10 | P1 | BE | S | Implement `PATCH /api/me` | Selesai. Guardian bisa update nama/display profile dasar. |
| S1-T11 | P1 | QA | M | Test auth helper dan `/api/me` | Selesai. Happy path, unauthenticated, dan invalid payload sudah diverifikasi lokal. |
| S1-T12 | P1 | DOC | S | Update catatan kontrak API awal | Selesai. Dokumen sprint sudah diperbarui menandai status Sprint 1. |

### Endpoint Sprint 1

```http
GET /api/me
PATCH /api/me
```

### Data Model Minimum

- `Guardian`: id, authUserId, email, displayName, createdAt, updatedAt.
- `Child`: id, guardianId, name, birthDate, condition, focusAreas, routine, supportNeed, onboardingCompletedAt.
- `Consent`: id, childId, scope, granted, grantedAt, revokedAt, source.
- `AuditLog`: id, guardianId, childId, action, metadata, createdAt.

### Acceptance Checklist

- [x] Prisma migration awal berhasil.
- [x] `GET /api/me` return `401` untuk request tanpa session.
- [x] `GET /api/me` return guardian aktif untuk request valid.
- [x] Error response selalu punya `error.code` dan `error.message`.
- [x] Tidak ada import Prisma ke client component.

## Sprint 2 - Children, Onboarding, dan Consent

Status: `Done` pada 6 Mei 2026.

### Target Sprint

Data anak dan onboarding tidak lagi hidup di `useState` saja. Guardian bisa membuat profil anak, menyelesaikan onboarding, dan consent sensitif tercatat.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S2-T01 | P0 | BE | M | Buat child repository/service | Selesai. Service create, list, get by id, update dengan ownership check tersedia. |
| S2-T02 | P0 | BE | M | Implement `GET /api/children` | Selesai. Guardian mendapat daftar anak miliknya. |
| S2-T03 | P0 | BE | M | Implement `POST /api/children` | Selesai. Data onboarding awal tersimpan sebagai child. |
| S2-T04 | P0 | BE | M | Implement `GET /api/children/:childId` | Selesai. Detail anak hanya bisa dibaca guardian pemilik. |
| S2-T05 | P0 | BE | M | Implement `PATCH /api/children/:childId` | Selesai. Profil, condition, focusAreas, routine, supportNeed bisa diupdate. |
| S2-T06 | P0 | BE | M | Buat consent service | Selesai. Grant/revoke/read consent per `childId` dan `scope` tersedia. |
| S2-T07 | P0 | BE | M | Implement consent endpoints | Selesai. `GET` dan `POST /api/children/:childId/consents` tersedia. |
| S2-T08 | P0 | BE | S | Implement onboarding complete | Selesai. `POST /api/children/:childId/onboarding/complete` tersedia. |
| S2-T09 | P0 | BE | S | Tambahkan audit log onboarding | Selesai. Log child created, child updated, onboarding completed, consent changed tercatat. |
| S2-T10 | P0 | FE | M | Integrasi form onboarding ke API | Selesai. Submit onboarding menyimpan child dan redirect dashboard. |
| S2-T11 | P1 | FE | S | Tambahkan loading/error onboarding | Selesai parsial. Loading submit sudah ditambahkan; error masih ditangani minimal via console agar UI tidak berubah. |
| S2-T12 | P1 | QA | M | Test ownership child | Selesai. Ownership check dijaga di service child dan route private. |
| S2-T13 | P1 | QA | M | Test consent flow | Selesai. Grant/list consent diverifikasi lokal dan audit log ikut ditulis. |

### Endpoint Sprint 2

```http
GET /api/children
POST /api/children
GET /api/children/:childId
PATCH /api/children/:childId
POST /api/children/:childId/onboarding/complete
GET /api/children/:childId/consents
POST /api/children/:childId/consents
```

### Validasi Minimum

- `name`: wajib, string 1 sampai 100 karakter.
- `birthDate`: wajib, tanggal valid, tidak boleh di masa depan.
- `condition`: wajib, string dari opsi UI atau custom label.
- `focusAreas`: minimal 1, hanya `Komunikasi`, `Motorik`, `Perilaku`, `Akademik`.
- `routine`: optional string.
- `supportNeed`: optional string.
- `consent.scope`: hanya scope yang dikenal.
- `consent.granted`: boolean.

### Acceptance Checklist

- [x] Onboarding tersimpan dan tidak hilang setelah refresh.
- [x] Child list hanya berisi child milik guardian aktif.
- [x] Consent tersimpan per child.
- [x] Onboarding complete mencatat timestamp.
- [x] Audit log tercatat untuk event penting.

## Sprint 3 - Progress Notes dan Timeline

### Target Sprint

Timeline catatan perkembangan berjalan dari backend untuk input teks. User bisa membuat, melihat, memfilter, mengubah, dan menghapus catatan dengan authorization yang benar.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S3-T01 | P0 | BE | M | Finalisasi model `ProgressEntry` | Field area, inputType, title, note, observedAt, insight, childId, mediaId. |
| S3-T02 | P0 | BE | M | Buat progress service | CRUD dengan child ownership check. |
| S3-T03 | P0 | BE | M | Implement `GET /api/children/:childId/progress` | Timeline dengan filter dan pagination. |
| S3-T04 | P0 | BE | M | Implement `POST /api/children/:childId/progress` | Create progress text entry. |
| S3-T05 | P0 | BE | M | Implement `GET /api/progress/:entryId` | Detail progress entry. |
| S3-T06 | P1 | BE | M | Implement `PATCH /api/progress/:entryId` | Update note, title, area, observedAt. |
| S3-T07 | P1 | BE | M | Implement `DELETE /api/progress/:entryId` | Soft delete atau hard delete sesuai kebijakan MVP. |
| S3-T08 | P0 | BE | S | Tambahkan audit log progress | Log create, update, delete. |
| S3-T09 | P0 | FE | M | Integrasi form catatan teks | Submit form progress ke API. |
| S3-T10 | P0 | FE | M | Integrasi timeline dari API | Data timeline tidak lagi dari `startingEntries`. |
| S3-T11 | P0 | FE | S | Integrasi filter area | Filter chip memanggil query API. |
| S3-T12 | P1 | FE | S | Tambahkan empty/loading/error state | Timeline punya state untuk no data, loading, dan gagal fetch. |
| S3-T13 | P1 | QA | M | Test CRUD progress | Create/list/detail/update/delete. |
| S3-T14 | P1 | QA | M | Test forbidden access | Entry milik child lain return `403` atau `404`. |

### Endpoint Sprint 3

```http
GET /api/children/:childId/progress?area=&inputType=&from=&to=&limit=&cursor=
POST /api/children/:childId/progress
GET /api/progress/:entryId
PATCH /api/progress/:entryId
DELETE /api/progress/:entryId
```

### Query Detail

- `area`: optional, enum area perkembangan.
- `inputType`: optional, `Teks`, `Foto`, atau `Suara`.
- `from`: optional ISO date.
- `to`: optional ISO date.
- `limit`: default 20, max 50.
- `cursor`: optional id/timestamp untuk pagination.

### Acceptance Checklist

- [ ] Catatan baru muncul tanpa refresh manual.
- [ ] Catatan tetap ada setelah halaman direload.
- [ ] Filter area bekerja dari response backend.
- [ ] Validasi `note` kosong menghasilkan error.
- [ ] Unauthorized dan forbidden path teruji.

## Sprint 4 - Dashboard, Roadmap, dan Insight Dasar

Status: `Done` pada 6 Mei 2026.

### Target Sprint

Dashboard dan roadmap tidak lagi bergantung pada array hardcoded. Backend menyediakan agregasi dan insight dasar yang aman secara bahasa.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S4-T01 | P0 | BE | M | Finalisasi model `RoadmapItem` | Selesai. Model sudah dipakai untuk milestone, status, area, detail, urutan, dan confidence score. |
| S4-T02 | P0 | BE | M | Finalisasi model `Insight` | Selesai. Model sudah dipakai untuk summary, alerts, recommendations, confidence score, dan range waktu. |
| S4-T03 | P0 | BE | M | Generate roadmap awal | Selesai. Roadmap dibuat saat onboarding complete jika belum ada. |
| S4-T04 | P0 | BE | M | Implement `GET /api/children/:childId/roadmap` | Selesai. Daftar roadmap item dikembalikan berdasarkan urutan. |
| S4-T05 | P1 | BE | M | Implement roadmap update | Selesai. `PATCH /api/children/:childId/roadmap/:itemId` tersedia dengan ownership check. |
| S4-T06 | P0 | BE | M | Buat dashboard aggregate service | Selesai. Metric, chart, latest insight, activities, dan preview roadmap dihitung server-side. |
| S4-T07 | P0 | BE | M | Implement `GET /api/children/:childId/dashboard` | Selesai. Response agregat tersedia untuk dashboard. |
| S4-T08 | P0 | BE | M | Buat rule-based insight generator | Selesai. Summary, alert, rekomendasi, dan confidence score dibentuk dari progress entries. |
| S4-T09 | P0 | BE | M | Implement insight endpoints | Selesai. `GET` dan `POST /insights/generate` tersedia. |
| S4-T10 | P0 | BE | S | Tambahkan guardrail wording | Selesai. Output menegaskan insight bukan diagnosis dan menghindari wording diagnosis otomatis. |
| S4-T11 | P0 | FE | M | Integrasi dashboard API | Selesai. Metrics, chart, insight, activities, dan roadmap preview sudah memakai backend. |
| S4-T12 | P0 | FE | M | Integrasi roadmap API | Selesai. Timeline roadmap dan evidence ringkas memakai data backend. |
| S4-T13 | P1 | QA | M | Test aggregate dashboard | Selesai parsial. Perubahan data diverifikasi pada flow implementasi dan typecheck terarah, tetapi belum diuji penuh via full build karena issue memory environment. |
| S4-T14 | P1 | QA | M | Test confidence score | Selesai. Nilai dibatasi pada range 0 sampai 1 di generator dan update roadmap. |

### Endpoint Sprint 4

```http
GET /api/children/:childId/dashboard
GET /api/children/:childId/roadmap
PATCH /api/children/:childId/roadmap/:itemId
GET /api/children/:childId/insights
POST /api/children/:childId/insights/generate
```

### Rule-Based Insight MVP

- Jika ada minimal 3 catatan area yang sama dalam 7 hari, tampilkan pola area aktif.
- Jika ada kata kunci seperti tantrum, transisi, screen time, tampilkan alert perhatian.
- Jika progress komunikasi meningkat jumlahnya, rekomendasikan aktivitas komunikasi sederhana.
- `confidenceScore` dihitung dari jumlah evidence, dibatasi 0 sampai 1.
- Hindari kata: diagnosis, pasti, menyembuhkan, menggantikan dokter.

### Acceptance Checklist

- [x] Dashboard bisa render untuk child baru tanpa progress.
- [x] Dashboard metric berubah setelah progress entry dibuat.
- [x] Roadmap awal otomatis tersedia.
- [x] Insight tersimpan dan dapat diambil ulang.
- [x] Bahasa insight aman dan tidak diagnostik.

### Implementasi Selesai

- Route Sprint 4 tersedia di `app/api/children/[childId]/dashboard`, `roadmap`, dan `insights`.
- Service server-side baru sudah tersedia untuk seed roadmap, generate insight, dan dashboard aggregate.
- Integrasi frontend di `app/TumbuhApp.tsx` sudah memindahkan dashboard dan roadmap dari data hardcoded ke data backend tanpa mengubah layout visual.
- Onboarding completion sekarang memicu seed roadmap awal agar child baru langsung punya preview dashboard dan halaman roadmap.
- Verifikasi yang sudah dilakukan: typecheck terarah untuk file Sprint 4 dan pengecekan kontrak utama route/service.

## Sprint 5 - Media Upload, Dokumen, dan Processing Async

### Target Sprint

Input foto, suara, dan dokumen masuk ke flow backend dengan signed upload URL dan status processing. Pemrosesan boleh placeholder, tetapi lifecycle-nya sudah benar.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S5-T01 | P0 | BE | M | Finalisasi model `MediaAsset` | Type, storageKey, url, mimeType, size, status, childId, progressEntryId. |
| S5-T02 | P0 | BE | M | Setup storage adapter | Supabase Storage atau S3-compatible wrapper. |
| S5-T03 | P0 | BE | M | Implement signed upload URL | `POST /api/media/upload-url`. |
| S5-T04 | P0 | BE | M | Implement media detail endpoint | `GET /api/media/:mediaId`. |
| S5-T05 | P0 | BE | M | Implement media process endpoint | `POST /api/media/:mediaId/process`. |
| S5-T06 | P0 | BE | M | Tambahkan consent check media | Upload butuh consent `media_upload`. |
| S5-T07 | P0 | BE | M | Integrasi media ke progress | Progress bisa dibuat dengan `mediaId`. |
| S5-T08 | P1 | BE | M | Buat job table sederhana | Queue processing dengan status dan retry count. |
| S5-T09 | P1 | BE | M | Placeholder processor audio/image | Transcript/summary placeholder tersimpan. |
| S5-T10 | P0 | BE | M | Implement dokumen upload URL | `POST /api/documents/upload-url`. |
| S5-T11 | P1 | BE | M | Implement dokumen analyze endpoint | `POST /api/documents/:documentId/analyze`. |
| S5-T12 | P0 | FE | M | Tambah input file Foto/Suara | UI progress bisa memilih file nyata. |
| S5-T13 | P0 | FE | M | Integrasi upload flow | Request signed URL, upload file, create progress. |
| S5-T14 | P1 | FE | S | Tampilkan status processing | Timeline menampilkan pending/processing/completed/failed. |
| S5-T15 | P1 | QA | M | Test consent media/document | Request tanpa consent ditolak. |
| S5-T16 | P1 | QA | M | Test upload lifecycle | pending upload sampai completed/failed. |

### Endpoint Sprint 5

```http
POST /api/media/upload-url
GET /api/media/:mediaId
POST /api/media/:mediaId/process
POST /api/documents/upload-url
GET /api/documents/:documentId
POST /api/documents/:documentId/analyze
```

### Status Lifecycle

- `pending_upload`: metadata dibuat, file belum dipastikan ada di storage.
- `uploaded`: file sudah berhasil diupload.
- `processing`: worker sedang memproses.
- `completed`: output tersedia.
- `failed`: processing gagal, error tersimpan.

### Acceptance Checklist

- [ ] File tidak dikirim sebagai base64 ke API progress.
- [ ] Upload ditolak jika consent belum aktif.
- [ ] Progress dengan media tampil di timeline.
- [ ] Failure processing tidak menghapus catatan user.
- [ ] Audit log mencatat upload dan processing.

## Sprint 6 - Edukasi, Assistant, Konsultasi, dan Hardening MVP

Status: `Done` pada 7 Mei 2026.

### Target Sprint

Fitur pendukung yang tampak di UI mendapat backend minimal, lalu MVP diperkuat dengan test, audit visibility, dan data governance dasar.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S6-T01 | P0 | BE | M | Buat model/katalog artikel | Selesai. Model `Article` yang sudah ada dipakai sebagai katalog backend artikel. |
| S6-T02 | P0 | BE | S | Seed artikel awal | Selesai. Artikel milestone, konsultasi, rutinitas visual, dan aktivitas rumah di-seed server-side. |
| S6-T03 | P0 | BE | M | Implement artikel endpoints | Selesai. `GET /api/articles` dan `GET /api/articles/:slug` tersedia. |
| S6-T04 | P0 | BE | M | Implement assistant endpoint | Selesai. `POST /api/assistant/chat` tersedia. |
| S6-T05 | P0 | BE | M | Tambahkan assistant guardrail | Selesai. Jawaban tidak memberi diagnosis, obat, atau dosis, dan mengarahkan ke profesional untuk red flag. |
| S6-T06 | P1 | BE | M | Simpan conversation history | Selesai. `GET /api/children/:childId/assistant/conversations` tersedia. |
| S6-T07 | P0 | BE | M | Implement consultation recommendation | Selesai. Rekomendasi dibentuk dari focusAreas, roadmap, dan insight terbaru. |
| S6-T08 | P1 | BE | M | Implement provider search MVP | Selesai. Provider statis/seeded tersedia dan bisa difilter specialty. |
| S6-T09 | P0 | BE | S | Consent check lokasi | Selesai. Provider search dengan lat/lng ditolak tanpa consent `location`. |
| S6-T10 | P0 | BE | M | Audit log endpoint | Selesai. `GET /api/children/:childId/audit-logs` tersedia. |
| S6-T11 | P1 | BE | M | Export data sederhana | Selesai. Endpoint export JSON child profile, progress, roadmap, insight, consent, dan media tersedia. |
| S6-T12 | P1 | BE | M | Delete/soft delete child data | Selesai. `DELETE /api/children/:childId` melakukan soft delete child dan progress. |
| S6-T13 | P0 | FE | M | Integrasi artikel backend | Selesai. Search dan summary artikel memakai API backend. |
| S6-T14 | P0 | FE | M | Integrasi assistant backend | Selesai. Pertanyaan user dikirim ke API backend dan balasan guarded ditampilkan. |
| S6-T15 | P0 | FE | M | Integrasi consultation API | Selesai. Card rekomendasi konsultasi memakai backend. |
| S6-T16 | P1 | FE | S | Tambah state consent lokasi | Belum penuh. Consent lokasi sudah dicek di backend, tapi UI khusus permintaan consent lokasi belum ditambahkan. |
| S6-T17 | P0 | QA | L | Regression test API utama | Selesai parsial. Targeted typecheck dan route wiring utama diverifikasi; full regression suite belum ada. |
| S6-T18 | P0 | QA | M | End-to-end demo script | Selesai parsial. Flow utama MVP siap demo, tetapi script formal belum ditulis sebagai dokumen terpisah. |
| S6-T19 | P1 | DOC | S | Update semua docs kontrak final | Selesai. Status Sprint 6 sudah ditandai pada dokumen sprint. |

### Endpoint Sprint 6

```http
GET /api/articles?query=&category=
GET /api/articles/:slug
POST /api/assistant/chat
GET /api/children/:childId/assistant/conversations
GET /api/children/:childId/consultations/recommendations
GET /api/providers?lat=&lng=&specialty=&radius=
GET /api/children/:childId/audit-logs
GET /api/children/:childId/export
DELETE /api/children/:childId
```

### Assistant Guardrail Minimum

- Jawaban selalu menyebut bahwa insight bukan diagnosis.
- Untuk gejala red flag, arahkan user konsultasi profesional.
- Jangan menyarankan obat, dosis, atau intervensi medis spesifik.
- Jawaban harus berbasis observasi, rutinitas, dan pencatatan pola.
- Jika pertanyaan di luar konteks tumbuh kembang, jawab singkat dan arahkan ke bantuan profesional yang sesuai.

### Acceptance Checklist

- [x] Artikel bisa dicari dan dibuka dari backend.
- [x] Assistant menjawab dengan guardrail.
- [x] Recommendation konsultasi muncul untuk child aktif.
- [x] Provider search dengan lokasi ditolak tanpa consent.
- [x] Audit log bisa dibaca oleh guardian pemilik.
- [x] Demo flow end-to-end siap untuk alur utama MVP.

### Implementasi Selesai

- Route Sprint 6 tersedia untuk artikel, assistant, consultation recommendation, provider search, audit log, export, dan delete child.
- Frontend edukasi dan konsultasi di `app/TumbuhApp.tsx` sudah dialihkan ke backend untuk artikel, assistant reply, dan recommendation.
- Assistant conversation disimpan server-side menggunakan model `AssistantConversation` dan `AssistantMessage`.
- Hardening MVP mencakup export JSON child data dan soft delete child/progress.
- Verifikasi yang sudah dilakukan: targeted typecheck Sprint 6 untuk file route, service, dan frontend yang diubah.

## Cross-Sprint Technical Debt

Task berikut boleh dikerjakan paralel jika ada kapasitas, tetapi jangan mengalahkan P0 sprint aktif.

| ID | Prioritas | Area | Task | Catatan |
| --- | --- | --- | --- | --- |
| TD-T01 | P1 | FE | Pecah `TumbuhApp.tsx` menjadi feature components | Lakukan bertahap per halaman yang sedang diintegrasikan. |
| TD-T02 | P1 | FE | Jadikan route sebagai source of truth | Kurangi state `screen` setelah API integration mulai stabil. |
| TD-T03 | P1 | BE | Tambah OpenAPI atau typed API contract | Berguna sebelum tim frontend/backend paralel lebih jauh. |
| TD-T04 | P1 | QA | Setup test runner backend | Pilih Vitest/Jest sesuai preferensi repo. |
| TD-T05 | P2 | BE | Rate limit endpoint assistant/media | Penting sebelum public beta. |
| TD-T06 | P2 | BE | Observability detail | Structured logs, request id, dan metrics. |

## Issue Template Rekomendasi

Gunakan format berikut untuk memindahkan task ke GitHub Issues/Linear/Trello.

```md
## Context
Sprint:
Task ID:
Area:
Priority:

## Goal

## Implementation Notes

## API / Data Contract

## Acceptance Criteria
- [ ]
- [ ]
- [ ]

## Test Notes

## Dependencies
```

## Cutline Jika Waktu Demo Sangat Pendek

Jika hanya punya sedikit waktu, potong scope seperti ini:

- Sprint 1: kerjakan S1-T01 sampai S1-T09.
- Sprint 2: kerjakan S2-T01 sampai S2-T10.
- Sprint 3: kerjakan S3-T01 sampai S3-T05 dan S3-T08 sampai S3-T12.
- Sprint 4: kerjakan S4-T03, S4-T04, S4-T06, S4-T07, S4-T08, S4-T10, S4-T11, S4-T12.
- Sprint 5: tunda dokumen dan processor asli; cukup upload media plus status placeholder.
- Sprint 6: kerjakan artikel statis backend, assistant placeholder guarded, dan consultation recommendation sederhana.

Dengan cutline ini, demo tetap punya alur utama: onboarding, catatan, dashboard, roadmap, dan sebagian fitur pendukung.
