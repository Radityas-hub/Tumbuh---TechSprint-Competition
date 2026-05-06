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

### Target Sprint

Dashboard dan roadmap tidak lagi bergantung pada array hardcoded. Backend menyediakan agregasi dan insight dasar yang aman secara bahasa.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S4-T01 | P0 | BE | M | Finalisasi model `RoadmapItem` | Milestone, status, area, detail, order, confidenceScore, childId. |
| S4-T02 | P0 | BE | M | Finalisasi model `Insight` | Summary, alerts, recommendations, confidenceScore, rangeStart, rangeEnd. |
| S4-T03 | P0 | BE | M | Generate roadmap awal | Roadmap dibuat saat onboarding complete jika belum ada. |
| S4-T04 | P0 | BE | M | Implement `GET /api/children/:childId/roadmap` | List roadmap item berdasarkan urutan. |
| S4-T05 | P1 | BE | M | Implement roadmap update | `PATCH /api/children/:childId/roadmap/:itemId`. |
| S4-T06 | P0 | BE | M | Buat dashboard aggregate service | Menghitung metric, chart, latest insight, activities, preview roadmap. |
| S4-T07 | P0 | BE | M | Implement `GET /api/children/:childId/dashboard` | Response agregat untuk dashboard. |
| S4-T08 | P0 | BE | M | Buat rule-based insight generator | Summary dan alert sederhana dari progress entries. |
| S4-T09 | P0 | BE | M | Implement insight endpoints | `GET` dan `POST /insights/generate`. |
| S4-T10 | P0 | BE | S | Tambahkan guardrail wording | Output tidak memakai diagnosis otomatis. |
| S4-T11 | P0 | FE | M | Integrasi dashboard API | Metrics, chart, insight, activities, roadmap preview dari backend. |
| S4-T12 | P0 | FE | M | Integrasi roadmap API | Timeline roadmap dari backend. |
| S4-T13 | P1 | QA | M | Test aggregate dashboard | Data berubah setelah progress dibuat. |
| S4-T14 | P1 | QA | M | Test confidence score | Nilai selalu 0 sampai 1. |

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

- [ ] Dashboard bisa render untuk child baru tanpa progress.
- [ ] Dashboard metric berubah setelah progress entry dibuat.
- [ ] Roadmap awal otomatis tersedia.
- [ ] Insight tersimpan dan dapat diambil ulang.
- [ ] Bahasa insight aman dan tidak diagnostik.

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

### Target Sprint

Fitur pendukung yang tampak di UI mendapat backend minimal, lalu MVP diperkuat dengan test, audit visibility, dan data governance dasar.

### Task Detail

| ID | Prioritas | Area | Estimasi | Task | Output |
| --- | --- | --- | --- | --- | --- |
| S6-T01 | P0 | BE | M | Buat model/katalog artikel | Article dengan slug, title, category, readTime, summary, content. |
| S6-T02 | P0 | BE | S | Seed artikel awal | Artikel milestone, konsultasi, rutinitas visual, aktivitas rumah. |
| S6-T03 | P0 | BE | M | Implement artikel endpoints | `GET /api/articles` dan `GET /api/articles/:slug`. |
| S6-T04 | P0 | BE | M | Implement assistant endpoint | `POST /api/assistant/chat`. |
| S6-T05 | P0 | BE | M | Tambahkan assistant guardrail | Prompt/system rule tidak memberi diagnosis. |
| S6-T06 | P1 | BE | M | Simpan conversation history | `GET /api/children/:childId/assistant/conversations`. |
| S6-T07 | P0 | BE | M | Implement consultation recommendation | Rekomendasi berdasarkan focusAreas, roadmap, dan insight. |
| S6-T08 | P1 | BE | M | Implement provider search MVP | Data provider seeded, filter specialty, radius optional. |
| S6-T09 | P0 | BE | S | Consent check lokasi | Provider search dengan lat/lng butuh consent `location`. |
| S6-T10 | P0 | BE | M | Audit log endpoint | `GET /api/children/:childId/audit-logs`. |
| S6-T11 | P1 | BE | M | Export data sederhana | Endpoint export JSON child profile, progress, roadmap, insight. |
| S6-T12 | P1 | BE | M | Delete/soft delete child data | Soft delete child dan data terkait untuk MVP. |
| S6-T13 | P0 | FE | M | Integrasi artikel backend | Search dan summary artikel dari API. |
| S6-T14 | P0 | FE | M | Integrasi assistant backend | Pertanyaan user dikirim ke API, loading/error ditampilkan. |
| S6-T15 | P0 | FE | M | Integrasi consultation API | Card rekomendasi konsultasi dari backend. |
| S6-T16 | P1 | FE | S | Tambah state consent lokasi | UI meminta/menyimpan consent sebelum memakai lokasi. |
| S6-T17 | P0 | QA | L | Regression test API utama | Auth, ownership, progress, dashboard, consent, media, assistant. |
| S6-T18 | P0 | QA | M | End-to-end demo script | Alur onboarding sampai dashboard/roadmap/progress berjalan. |
| S6-T19 | P1 | DOC | S | Update semua docs kontrak final | Audit/sprint docs sesuai endpoint final. |

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

- [ ] Artikel bisa dicari dan dibuka dari backend.
- [ ] Assistant menjawab dengan guardrail.
- [ ] Recommendation konsultasi muncul untuk child aktif.
- [ ] Provider search dengan lokasi ditolak tanpa consent.
- [ ] Audit log bisa dibaca oleh guardian pemilik.
- [ ] Demo flow end-to-end siap.

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
