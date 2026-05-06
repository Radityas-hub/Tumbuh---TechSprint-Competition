# Backend Sprint Breakdown Tumbuh

Dokumen ini memecah kebutuhan backend Tumbuh menjadi **6 sprint MVP** berdasarkan audit di `docs/backend-audit.md`. Fokusnya adalah membuat urutan kerja yang jelas: mulai dari fondasi data, persistence fitur inti, lalu media/AI dan hardening.

Versi task-level yang lebih rinci tersedia di `docs/backend-sprint-task-detail.md`.

Asumsi durasi:

- Untuk kompetisi atau sprint cepat: 1 sprint = 1 minggu.
- Untuk tim produksi kecil: 1 sprint = 2 minggu.
- Jika waktu terbatas, Sprint 1 sampai Sprint 4 sudah membentuk MVP backend dasar tanpa AI/media penuh.

## Ringkasan Sprint

| Sprint | Fokus | Outcome utama |
| --- | --- | --- |
| Sprint 1 | Fondasi backend, auth, database | Selesai pada 5 Mei 2026. API siap dibangun, schema awal tersedia, user/guardian bisa dikenali. |
| Sprint 2 | Children, onboarding, consent | Selesai pada 6 Mei 2026. Profil anak dan hasil onboarding tersimpan permanen. |
| Sprint 3 | Progress notes dan timeline | Catatan perkembangan teks bisa dibuat, dilihat, difilter, dan diamankan. |
| Sprint 4 | Dashboard, roadmap, insight dasar | Selesai pada 6 Mei 2026. Dashboard dan roadmap memakai agregasi backend dan insight rule-based yang aman. |
| Sprint 5 | Media upload dan processing async | Foto/suara/dokumen bisa di-upload dan diproses dengan status. |
| Sprint 6 | Edukasi, assistant, konsultasi, hardening | Fitur pendukung lengkap, privacy flow lebih matang, MVP siap demo. |

## Sprint 1 - Fondasi Backend, Auth, dan Database

Status: `Done` pada 5 Mei 2026.

### Goal

Menyiapkan fondasi teknis agar semua sprint berikutnya punya database, auth context, validasi request, dan struktur API yang konsisten.

### Task

- Setup environment backend:
  - Lengkapi kebutuhan `.env.local`: `DATABASE_URL`, `DIRECT_URL`, dan auth/storage secret yang dipilih.
  - Pastikan Prisma CLI bisa menjalankan validate, generate, dan migrate.
- Definisikan model database awal:
  - `Guardian`
  - `Child`
  - `Consent`
  - `ProgressEntry`
  - `MediaAsset`
  - `RoadmapItem`
  - `Insight`
  - `AuditLog`
- Buat migration pertama Prisma.
- Setup auth:
  - Gunakan Supabase Auth sebagai rekomendasi default.
  - Buat helper server-side untuk mengambil guardian aktif.
  - Tambahkan guard agar API private menolak request tanpa session.
- Setup struktur API:
  - `app/api/**/route.ts`
  - shared response helper
  - shared error format
  - Zod validation helper
- Endpoint awal:
  - `GET /api/me`
  - `PATCH /api/me`
- Tambahkan logging dasar untuk error server-side.

### Acceptance Criteria

- `GET /api/me` mengembalikan guardian aktif atau `401`.
- Prisma schema punya model awal dan migration pertama.
- Semua route private punya auth guard.
- Error API memakai format konsisten:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Implementasi Selesai

- Prisma schema awal dan migration pertama sudah tersedia di `prisma/schema.prisma` dan `prisma/migrations/20260505150000_init`.
- Helper response/error dan Zod validation sudah ditambahkan untuk route backend.
- Auth server helper dan auth guard untuk guardian aktif sudah tersedia.
- Endpoint `GET /api/me` dan `PATCH /api/me` sudah terpasang di `app/api/me/route.ts`.
- Verifikasi lokal yang sudah dilakukan: `prisma validate`, `tsc --noEmit`, `GET /api/me` authenticated, `GET /api/me` unauthenticated, `PATCH /api/me` valid, dan `PATCH /api/me` invalid payload.

### Dependencies

- Supabase project atau database PostgreSQL aktif.
- Keputusan auth provider dikunci sebelum sprint dimulai.

## Sprint 2 - Children, Onboarding, dan Consent

Status: `Done` pada 6 Mei 2026.

### Goal

Menyimpan data onboarding dari UI menjadi data permanen dan menyiapkan consent untuk pemakaian data sensitif.

### Task

- Implementasikan model dan service untuk profil anak.
- Implementasikan relasi guardian ke anak.
- Implementasikan consent per child dan per scope:
  - `health_data`
  - `ai_insight`
  - `media_upload`
  - `document_analysis`
  - `location`
- Endpoint children:
  - `GET /api/children`
  - `POST /api/children`
  - `GET /api/children/:childId`
  - `PATCH /api/children/:childId`
- Endpoint onboarding:
  - `POST /api/children/:childId/onboarding/complete`
- Endpoint consent:
  - `GET /api/children/:childId/consents`
  - `POST /api/children/:childId/consents`
- Tambahkan audit log untuk:
  - child created
  - onboarding completed
  - consent granted/revoked
- Frontend integration minimal:
  - Onboarding submit mengirim data ke `POST /api/children`.
  - Setelah onboarding complete, redirect ke dashboard dengan child aktif.

### Acceptance Criteria

- Data onboarding tidak hilang setelah refresh.
- Guardian hanya bisa melihat child miliknya.
- `focusAreas` tersimpan sebagai array enum/string yang tervalidasi.
- Consent bisa dibuat dan diperbarui.
- Audit log tercatat untuk perubahan penting.

### Implementasi Selesai

- Service child, consent, dan audit log sudah ditambahkan untuk ownership check dan pencatatan event penting.
- Endpoint `children`, `consents`, dan `onboarding complete` sudah tersedia di `app/api/children/**`.
- Frontend onboarding sudah submit ke backend, menyimpan child, menandai onboarding complete, lalu memuat ulang session context.
- Profile anak aktif dimuat ulang dari backend saat aplikasi dibuka, sehingga data onboarding tidak lagi hanya bergantung pada `useState`.
- Verifikasi lokal yang sudah dilakukan: `tsc --noEmit`, `GET /api/children`, `POST /api/children`, `POST /api/children/:childId/onboarding/complete`, dan `GET /api/children/:childId/consents`.

### Payload Utama

```json
{
  "name": "Dafa",
  "birthDate": "2020-08-12",
  "condition": "Autisme - sudah diagnosis",
  "focusAreas": ["Komunikasi", "Perilaku"],
  "routine": "Rutinitas visual pagi dan transisi sore",
  "supportNeed": "Arahan aktivitas harian yang praktis"
}
```

## Sprint 3 - Progress Notes dan Timeline

### Goal

Mengganti data dummy `startingEntries` dengan API progress notes yang bisa menyimpan dan menampilkan catatan perkembangan.

### Task

- Implementasikan CRUD progress entry:
  - input text terlebih dahulu
  - area perkembangan
  - observed date
  - optional title
  - optional insight placeholder
- Endpoint progress:
  - `GET /api/children/:childId/progress`
  - `POST /api/children/:childId/progress`
  - `GET /api/progress/:entryId`
  - `PATCH /api/progress/:entryId`
  - `DELETE /api/progress/:entryId`
- Query filter:
  - `area`
  - `inputType`
  - `from`
  - `to`
  - pagination sederhana: `limit` dan `cursor` atau `page`
- Validasi:
  - `area` hanya `Komunikasi`, `Motorik`, `Perilaku`, `Akademik`
  - `inputType` hanya `Teks`, `Foto`, `Suara`
  - `note` wajib untuk input text
- Tambahkan audit log untuk create/update/delete progress.
- Frontend integration minimal:
  - Form progress mengirim ke API.
  - Timeline mengambil data dari API.
  - Filter area memakai query API.
  - Tambahkan loading, empty, dan error state.

### Acceptance Criteria

- Catatan baru muncul di timeline dan tetap ada setelah refresh.
- Filter area bekerja dari backend.
- User tidak bisa membaca/menghapus progress milik child lain.
- Empty state muncul jika belum ada catatan.
- Error validasi ditampilkan jelas di UI.

### Payload Utama

```json
{
  "area": "Komunikasi",
  "inputType": "Teks",
  "note": "Dafa bisa mempertahankan kontak mata sekitar 5 detik.",
  "observedAt": "2026-05-04T09:00:00.000Z"
}
```

## Sprint 4 - Dashboard, Roadmap, dan Insight Dasar

Status: `Done` pada 6 Mei 2026.

### Goal

Membuat dashboard dan roadmap memakai data backend, walaupun insight AI masih rule-based atau placeholder server-side.

### Task

- Endpoint dashboard:
  - `GET /api/children/:childId/dashboard`
- Dashboard response berisi:
  - `metrics`
  - `weeklyChart`
  - `latestInsight`
  - `todayActivities`
  - `roadmapPreview`
- Implementasikan agregasi sederhana dari progress:
  - catatan minggu ini
  - jumlah catatan per hari
  - area paling aktif
  - alert sederhana jika ada pola berulang
- Endpoint roadmap:
  - `GET /api/children/:childId/roadmap`
  - `PATCH /api/children/:childId/roadmap/:itemId`
- Generate roadmap awal setelah onboarding:
  - berdasarkan `condition`
  - berdasarkan `focusAreas`
  - berdasarkan `routine`
- Endpoint insight:
  - `GET /api/children/:childId/insights`
  - `POST /api/children/:childId/insights/generate`
- Insight dasar:
  - summary mingguan rule-based
  - alerts sederhana
  - recommended activities dari katalog statis/server-side
  - `confidenceScore` default berdasarkan jumlah evidence
- Frontend integration minimal:
  - Dashboard mengambil data dari endpoint agregat.
  - Roadmap mengambil data dari endpoint roadmap.
  - UI tidak lagi memakai `roadmap` dan `activities` hardcoded untuk area produk utama.

### Acceptance Criteria

- [x] Dashboard tetap render meskipun child belum punya banyak progress.
- [x] Metric dashboard berubah setelah progress baru dibuat.
- [x] Roadmap awal dibuat setelah onboarding.
- [x] Insight tidak memakai bahasa diagnosis otomatis.
- [x] `confidenceScore` selalu berada di range `0` sampai `1`.

### Implementasi Selesai

- Service roadmap, insight, dan dashboard aggregate sudah ditambahkan di `lib/roadmap.ts`, `lib/insights.ts`, dan `lib/dashboard.ts`.
- Endpoint `GET /api/children/:childId/dashboard`, `GET /api/children/:childId/roadmap`, `PATCH /api/children/:childId/roadmap/:itemId`, `GET /api/children/:childId/insights`, dan `POST /api/children/:childId/insights/generate` sudah tersedia.
- `POST /api/children/:childId/onboarding/complete` sekarang sekaligus membuat roadmap awal jika child belum punya roadmap.
- Dashboard frontend sudah mengambil metrics, chart, latest insight, activities, dan roadmap preview dari backend tanpa mengubah UI visual.
- Halaman roadmap frontend sudah memakai data backend, termasuk evidence ringkas dan status milestone.
- Verifikasi yang sudah dilakukan: typecheck terarah untuk file Sprint 4, pengecekan route dan service ownership, serta validasi bahwa `confidenceScore` dibatasi pada range `0` sampai `1`.

### Response Dashboard Konseptual

```json
{
  "metrics": {
    "weeklyEntries": 8,
    "completedActivities": 2,
    "achievedTargets": 1,
    "importantAlerts": 1
  },
  "weeklyChart": [],
  "latestInsight": {
    "summary": "Kontak mata lebih sering muncul setelah aktivitas sensorik.",
    "confidenceScore": 0.65
  },
  "todayActivities": [],
  "roadmapPreview": []
}
```

## Sprint 5 - Media Upload, Dokumen, dan Processing Async

### Goal

Mendukung input foto, suara, dan dokumen tanpa membuat request API lambat. Processing berjalan asynchronous dan statusnya bisa dilihat UI.

### Task

- Implementasikan `MediaAsset` lifecycle:
  - `pending_upload`
  - `uploaded`
  - `processing`
  - `completed`
  - `failed`
- Endpoint media:
  - `POST /api/media/upload-url`
  - `POST /api/media/:mediaId/process`
  - `GET /api/media/:mediaId`
- Integrasikan media ke progress entry:
  - `mediaId`
  - `mediaUrl`
  - `inputType`
  - `processingStatus`
- Endpoint dokumen:
  - `POST /api/documents/upload-url`
  - `POST /api/documents/:documentId/analyze`
  - `GET /api/documents/:documentId`
- Tambahkan consent check:
  - media upload perlu `media_upload`
  - document analysis perlu `document_analysis`
  - AI extraction perlu `ai_insight`
- Implementasikan worker/job sederhana:
  - boleh berupa table-backed job untuk MVP
  - status processing tersimpan di database
- Output processing minimum:
  - audio: placeholder transcript atau status siap diproses
  - image: placeholder observation summary
  - document: extracted targets placeholder
- Frontend integration minimal:
  - Input file untuk Foto/Suara.
  - Upload flow signed URL.
  - Tampilkan status processing di timeline.

### Acceptance Criteria

- File tidak dikirim langsung ke route progress sebagai payload besar.
- Upload hanya bisa dilakukan jika consent sesuai aktif.
- Progress entry bisa dibuat dengan media.
- UI dapat menampilkan status processing.
- Failure processing tidak menghapus progress entry.
- Audit log mencatat upload dan process request.

## Sprint 6 - Edukasi, Assistant, Konsultasi, dan Hardening MVP

### Goal

Melengkapi fitur pendukung yang terlihat di UI dan menutup risiko MVP: privacy, validation, test, dan demo readiness.

### Task

- Endpoint artikel:
  - `GET /api/articles`
  - `GET /api/articles/:slug`
- Seed artikel edukasi awal:
  - milestone
  - konsultasi
  - rutinitas visual
  - aktivitas rumah
- Endpoint assistant:
  - `POST /api/assistant/chat`
  - `GET /api/children/:childId/assistant/conversations`
- Guardrail assistant:
  - tidak memberi diagnosis
  - menyarankan konsultasi profesional untuk red flag
  - jawaban berbasis edukasi dan observasi
  - simpan conversation jika user authenticated
- Endpoint konsultasi:
  - `GET /api/children/:childId/consultations/recommendations`
  - `GET /api/providers`
- Provider search MVP:
  - bisa mulai dari data statis/seeded
  - filter specialty
  - lokasi hanya aktif jika consent `location` diberikan
- Privacy hardening:
  - `GET /api/children/:childId/audit-logs`
  - endpoint export data sederhana
  - endpoint delete child data atau soft delete
- Testing:
  - auth guard
  - guardian-child ownership
  - validation error
  - progress create/list
  - consent required untuk media/document/location/AI
  - dashboard aggregate basic
- Final integration:
  - Pastikan semua halaman utama punya loading/error/empty state.
  - Pastikan tidak ada lagi data dummy untuk alur utama authenticated app.

### Acceptance Criteria

- Artikel bisa dicari dari backend.
- Assistant memberi jawaban dengan guardrail medis.
- Rekomendasi konsultasi muncul berdasarkan focus area/insight.
- Provider location request ditolak jika consent lokasi belum aktif.
- User bisa melihat audit log aktivitas sensitif.
- Test utama backend lolos.
- MVP siap demo dengan data yang persisten.

## Pembagian Prioritas Jika Waktu Terbatas

### MVP Minimum

Selesaikan Sprint 1 sampai Sprint 4:

- Auth dan database siap.
- Onboarding tersimpan.
- Progress text tersimpan.
- Dashboard dan roadmap memakai backend.

Ini sudah cukup untuk menunjukkan value utama produk: orang tua mencatat perkembangan, lalu sistem membantu merangkum pola dan roadmap.

### MVP Plus

Tambahkan Sprint 5:

- Foto/suara/dokumen sudah masuk flow.
- Processing bisa asynchronous walaupun hasil AI masih placeholder.

Ini cocok jika demo ingin menonjolkan multi-modal input.

### MVP Lengkap

Selesaikan Sprint 1 sampai Sprint 6:

- Semua fitur UI utama punya backend.
- Privacy, consent, dan audit trail lebih matang.
- Assistant, konsultasi, dan edukasi lebih siap dipakai.

## Dependencies Antar Sprint

| Task | Bergantung pada |
| --- | --- |
| Children/onboarding | Sprint 1 auth dan schema awal |
| Consent | Sprint 1 guardian-child ownership |
| Progress timeline | Sprint 2 child persistence |
| Dashboard aggregate | Sprint 3 progress data |
| Roadmap awal | Sprint 2 onboarding data |
| Insight generate | Sprint 3 progress dan Sprint 4 roadmap |
| Media upload | Sprint 2 consent dan Sprint 3 progress |
| Document analysis | Sprint 5 media/document storage |
| Assistant personalized answer | Sprint 2 child profile dan Sprint 3 progress |
| Provider location search | Sprint 2 consent location |
| Audit log transparency | Audit log ditulis sejak Sprint 2 |

## Definition of Done Global

Setiap sprint dianggap selesai jika:

- Endpoint yang dibuat punya validation dan error response konsisten.
- Endpoint private memakai auth guard.
- Data child selalu dicek ownership-nya.
- Tidak ada diagnosis otomatis dari backend atau AI output.
- Minimal happy path dan forbidden path diuji.
- Frontend punya loading, error, dan empty state untuk API yang dihubungkan.
- Dokumentasi endpoint/payload diperbarui jika kontrak berubah.

## Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Scope AI terlalu besar | Sprint 4 pakai rule-based insight dulu, AI penuh masuk setelah persistence stabil. |
| Upload media memperlambat API | Gunakan signed URL dan processing async. |
| Data anak bocor antar user | Wajib cek guardian-child ownership di setiap query. |
| Prisma belum bisa migrate | Validasi `DIRECT_URL` dan jalankan migration di Sprint 1 sebelum fitur dibuat. |
| UI masih monolitik | Integrasi backend dilakukan bertahap per fitur; refactor besar dilakukan hanya jika menghalangi API integration. |
| Consent terlambat dipikirkan | Consent dibuat sejak Sprint 2 sebelum media, AI, dokumen, dan lokasi aktif. |

## Rekomendasi Urutan Kerja Harian

Untuk tiap sprint, gunakan pola kerja berikut:

1. Kunci kontrak endpoint dan payload.
2. Tambah/update Prisma model jika perlu.
3. Jalankan migration dan generate client.
4. Implementasikan service/data access.
5. Implementasikan route handler.
6. Tambahkan validation dan auth guard.
7. Tambahkan test minimal.
8. Integrasikan frontend.
9. Uji flow end-to-end dari UI.
10. Catat perubahan kontrak di dokumentasi.
