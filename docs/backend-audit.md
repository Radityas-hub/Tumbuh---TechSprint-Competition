# Audit Backend Tumbuh

Dokumen ini merangkum kondisi frontend Tumbuh saat ini dan menerjemahkannya menjadi kebutuhan backend MVP. Fokusnya adalah handoff teknis yang cukup actionable untuk mulai membangun API, persistence, dan integrasi data tanpa mengubah scope produk secara berlebihan.

## 1. Struktur Frontend Saat Ini

### Framework dan dependensi utama

Project menggunakan stack frontend berikut:

- Next.js 14 App Router.
- React 18 dengan TypeScript.
- Client-side UI utama melalui satu komponen besar `app/TumbuhApp.tsx`.
- `gsap` dan `@gsap/react` untuk animasi/reveal.
- `lucide-react` untuk icon UI.
- `next/image` untuk asset gambar di `public/images`.
- Prisma 7, `@prisma/adapter-pg`, dan `pg` sudah tersedia untuk calon backend database.

### Routing

Routing sudah memakai struktur folder App Router:

- `/` dari `app/page.tsx`.
- `/onboarding` dari `app/onboarding/page.tsx`.
- `/dashboard` dari `app/dashboard/page.tsx`.
- `/roadmap` dari `app/roadmap/page.tsx`.
- `/progress` dari `app/progress/page.tsx`.
- `/education` dari `app/education/page.tsx`.
- `/consultation` dari `app/consultation/page.tsx`.
- `/backend` dari `app/backend/page.tsx`.

Namun tiap route saat ini hanya wrapper yang me-render `TumbuhApp` dengan `initialScreen`. Navigasi produk di dalam aplikasi tetap dikontrol oleh state `screen` di `TumbuhApp.tsx`, lalu URL disinkronkan dengan `router.push(screenPaths[target])`.

Dampaknya, URL dan state internal sama-sama menjadi sumber navigasi. Ini masih cukup untuk prototype, tetapi sebaiknya dirapikan sebelum data backend mulai masuk agar page-level data fetching, loading state, dan auth guard lebih mudah diatur.

### Cara data di-handle

Data produk saat ini masih hardcoded dan disimpan sementara di memory React:

- `initialProfile`: profil anak default.
- `startingEntries`: catatan perkembangan default.
- `roadmap`: milestone dan status roadmap.
- `activities`: rekomendasi aktivitas harian.
- `articles`: konten edukasi dummy.
- `backendContracts`: daftar endpoint contoh di halaman handoff backend.

State penting yang saat ini hidup di client:

- `profile` untuk data anak.
- `entries` untuk timeline catatan perkembangan.
- `selectedArea` untuk filter catatan.
- `draft`, `routine`, dan `supportNeed` untuk onboarding.
- `question` dan `assistantReply` untuk AI assistant dummy.

Belum ditemukan penggunaan `fetch`, route handler `app/api`, server action, localStorage, sessionStorage, atau persistence lain. Artinya semua perubahan data hilang saat refresh atau direct navigation.

### Kondisi Prisma

Project sudah punya persiapan Prisma:

- `lib/prisma.ts` membuat `PrismaClient` dengan `@prisma/adapter-pg`.
- `.env.example` mengarah ke Supabase Postgres pooler.
- `prisma.config.ts` memakai `DIRECT_URL` untuk Prisma CLI.
- `prisma/schema.prisma` sudah punya datasource PostgreSQL dan generator client.

Namun schema belum memiliki model database dan belum ada migration. Backend dapat memanfaatkan setup ini, tetapi model data perlu dirancang terlebih dahulu sebelum API dibuat.

## 2. Kebutuhan Backend Berdasarkan UI

### Auth, guardian, dan profil anak

Backend perlu melayani alur identitas dan kepemilikan data:

- Registrasi/login guardian atau orang tua.
- Profil guardian minimum, misalnya nama panggilan dan email.
- Profil anak: nama, tanggal lahir, kondisi, area fokus, rutinitas awal, dan kebutuhan support.
- Relasi guardian ke satu atau lebih anak.
- Consent awal untuk penggunaan AI, data kesehatan, media, lokasi, dan dokumen.

### Onboarding

UI onboarding membutuhkan endpoint untuk menyimpan hasil empat langkah:

- Data dasar anak.
- Kondisi atau status diagnosis.
- Area fokus: komunikasi, motorik, perilaku, akademik.
- Rutinitas awal dan bantuan yang paling dibutuhkan.

Backend juga perlu mengembalikan roadmap awal setelah onboarding selesai, atau setidaknya menandai proses onboarding complete agar dashboard dapat mengambil data awal.

### Catatan perkembangan

Halaman progress membutuhkan backend untuk:

- Membuat catatan teks, foto, atau suara.
- Menyimpan area perkembangan.
- Menampilkan timeline catatan.
- Memfilter berdasarkan area.
- Menyimpan media URL bila input berupa foto/suara.
- Menyimpan hasil insight per catatan.
- Mendukung update/delete catatan jika fitur editing ditambahkan.

Untuk input foto dan suara, UI saat ini masih placeholder. Backend MVP perlu menyediakan mekanisme upload media dan status processing, meskipun pemrosesan AI-nya dapat dibuat asynchronous.

### Dashboard

Dashboard membutuhkan data agregat:

- Jumlah catatan minggu ini.
- Jumlah aktivitas selesai.
- Target tercapai.
- Alert penting.
- Chart progress mingguan per area.
- AI insight ringkas.
- Aktivitas hari ini.
- Preview roadmap.

Data dashboard sebaiknya disediakan sebagai satu endpoint agregat agar UI tidak perlu melakukan terlalu banyak request saat halaman dibuka.

### Roadmap adaptif

Roadmap membutuhkan backend untuk menyimpan dan menghasilkan:

- Daftar milestone.
- Status milestone, misalnya tercapai, berproses, target berikutnya, atau perlu perhatian.
- Detail/alasan milestone.
- Evidence dari catatan, foto, suara, atau dokumen.
- `confidenceScore` untuk menunjukkan kekuatan pola.
- Riwayat perubahan target agar keputusan sistem dapat diaudit.

Backend tidak boleh menampilkan hasil sebagai diagnosis otomatis. Bahasa output perlu dibatasi sebagai pola, indikasi, rekomendasi aktivitas, atau bahan diskusi dengan profesional.

### Edukasi dan AI assistant

Halaman education membutuhkan:

- Artikel edukasi dengan kategori, waktu baca, slug, dan ringkasan.
- Search artikel berdasarkan kata kunci.
- AI assistant untuk pertanyaan orang tua.
- Guardrail agar jawaban tidak menggantikan dokter/terapis.
- Kemampuan menyimpan percakapan atau mengubah jawaban menjadi catatan perkembangan bila dibutuhkan.

### Konsultasi dan fasilitas terdekat

Halaman consultation membutuhkan:

- Rekomendasi jenis profesional berdasarkan focus area dan insight.
- Alasan rekomendasi.
- Checklist data yang perlu dibawa saat konsultasi.
- Pencarian fasilitas terdekat jika user memberi consent lokasi.
- Filter spesialisasi, jarak, dan jam layanan.

Fitur lokasi wajib opt-in dan perlu dicatat dalam consent/audit trail.

### Dokumen medis dan laporan terapi

Halaman backend handoff sudah mengusulkan analisis dokumen. Backend MVP dapat menyiapkan:

- Upload laporan terapi/dokter.
- Metadata dokumen.
- Status analisis.
- Ekstraksi target, rekomendasi, atau catatan penting.
- Relasi dokumen ke anak dan roadmap.

### Privacy dan data governance

Karena data yang ditangani mencakup anak, kesehatan, foto, suara, lokasi, dan dokumen medis, backend perlu menyediakan:

- Authorization berbasis guardian dan child ownership.
- Consent eksplisit per kategori data.
- Audit trail untuk upload, pemrosesan AI, perubahan roadmap, dan akses data penting.
- Delete/export data.
- Retention policy untuk media dan dokumen.
- Pembatasan akses server-side untuk semua file sensitif.

## 3. Rekomendasi Stack Backend

### Rekomendasi utama untuk MVP

Gunakan backend di dalam Next.js terlebih dahulu:

- API: Next.js Route Handlers di `app/api/**/route.ts`.
- Database: Supabase Postgres.
- ORM: Prisma, melanjutkan setup yang sudah ada.
- Auth: Supabase Auth jika ingin satu ekosistem dengan database/storage; Auth.js tetap layak jika ingin provider auth yang lebih fleksibel.
- Storage: Supabase Storage atau S3-compatible storage untuk foto, suara, dan dokumen.
- Validation: Zod untuk request body, params, dan query.
- Background processing: job queue ringan untuk transcription, document analysis, dan insight generation.

Pendekatan ini cocok karena repo sudah Next.js, Prisma, PostgreSQL, dan `.env.example` sudah mengarah ke Supabase. Tim tidak perlu menambah service backend terpisah di fase MVP.

### Catatan arsitektur

- Pisahkan kode API, data access, dan AI processing agar route handler tetap tipis.
- Jangan import `lib/prisma.ts` dari client component.
- Gunakan DTO/shared types untuk menyamakan kontrak frontend-backend.
- Untuk proses AI/media yang lambat, simpan status seperti `pending`, `processing`, `completed`, dan `failed`.
- Simpan output AI sebagai data yang bisa diaudit, bukan hanya response sementara.

## 4. Endpoint API Kandidat

Endpoint di bawah adalah kandidat kontrak awal. Nama final boleh disesuaikan, tetapi kebutuhan datanya sudah mengikuti UI saat ini.

### Auth dan session

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/me` | Mengambil user/guardian aktif dan status onboarding. |
| `PATCH` | `/api/me` | Memperbarui profil guardian. |

### Children dan onboarding

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/children` | Mengambil daftar anak milik guardian. |
| `POST` | `/api/children` | Membuat profil anak dari onboarding. |
| `GET` | `/api/children/:childId` | Mengambil detail profil anak. |
| `PATCH` | `/api/children/:childId` | Memperbarui profil, kondisi, focus area, atau preferensi. |
| `POST` | `/api/children/:childId/onboarding/complete` | Menandai onboarding selesai dan memicu roadmap awal. |

Payload konseptual:

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

### Progress dan media

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/children/:childId/progress` | Mengambil timeline catatan dengan filter `area`, `inputType`, `from`, dan `to`. |
| `POST` | `/api/children/:childId/progress` | Membuat catatan perkembangan baru. |
| `GET` | `/api/progress/:entryId` | Mengambil detail satu catatan. |
| `PATCH` | `/api/progress/:entryId` | Mengubah catatan. |
| `DELETE` | `/api/progress/:entryId` | Menghapus catatan. |
| `POST` | `/api/media/upload-url` | Membuat signed upload URL untuk foto/suara. |
| `POST` | `/api/media/:mediaId/process` | Memulai pemrosesan media. |

Payload konseptual untuk progress:

```json
{
  "area": "Komunikasi",
  "inputType": "Teks",
  "note": "Dafa bisa mempertahankan kontak mata sekitar 5 detik.",
  "mediaUrl": null,
  "observedAt": "2026-05-04T09:00:00.000Z"
}
```

### Dashboard, insights, dan roadmap

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/children/:childId/dashboard` | Mengambil metric, chart, aktivitas, insight, dan preview roadmap. |
| `GET` | `/api/children/:childId/insights` | Mengambil ringkasan, alert, rekomendasi aktivitas, dan pola mingguan. |
| `POST` | `/api/children/:childId/insights/generate` | Memicu pembuatan insight baru dari catatan terbaru. |
| `GET` | `/api/children/:childId/roadmap` | Mengambil roadmap adaptif. |
| `PATCH` | `/api/children/:childId/roadmap/:itemId` | Memperbarui status milestone atau feedback guardian. |

Payload konseptual insight:

```json
{
  "summary": "Kontak mata lebih konsisten setelah sensory play sore.",
  "alerts": [
    {
      "type": "attention",
      "message": "Transisi screen time masih perlu strategi bertahap."
    }
  ],
  "recommendedActivities": [],
  "roadmap": [],
  "confidenceScore": 0.78
}
```

### Edukasi dan AI assistant

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/articles` | Mengambil artikel dengan filter `query` dan `category`. |
| `GET` | `/api/articles/:slug` | Mengambil detail artikel. |
| `POST` | `/api/assistant/chat` | Mengirim pertanyaan orang tua dan mengambil jawaban AI dengan guardrail. |
| `GET` | `/api/children/:childId/assistant/conversations` | Mengambil riwayat percakapan jika fitur history diaktifkan. |

Payload konseptual assistant:

```json
{
  "childId": "child_123",
  "question": "Dafa sering tantrum saat berhenti menonton. Apa yang bisa dicoba?"
}
```

### Konsultasi, dokumen, dan consent

| Method | Path | Fungsi |
| --- | --- | --- |
| `GET` | `/api/children/:childId/consultations/recommendations` | Mengambil rekomendasi profesional dan checklist persiapan. |
| `GET` | `/api/providers` | Mencari fasilitas dengan filter `lat`, `lng`, `specialty`, dan `radius`. |
| `POST` | `/api/documents/upload-url` | Membuat signed upload URL untuk dokumen. |
| `POST` | `/api/documents/:documentId/analyze` | Memulai analisis dokumen. |
| `GET` | `/api/children/:childId/consents` | Mengambil consent aktif. |
| `POST` | `/api/children/:childId/consents` | Membuat atau memperbarui consent. |
| `GET` | `/api/children/:childId/audit-logs` | Mengambil log aktivitas sensitif untuk kebutuhan transparansi. |

Consent metadata minimum:

```json
{
  "scope": "ai_insight",
  "granted": true,
  "grantedAt": "2026-05-05T00:00:00.000Z",
  "source": "onboarding"
}
```

## 5. Potensi Masalah Sebelum Mulai Backend

### Struktur frontend masih terlalu monolitik

`TumbuhApp.tsx` memuat landing page, app shell, onboarding, dashboard, roadmap, progress, education, consultation, dan backend handoff dalam satu file client component. Saat backend mulai dihubungkan, file ini akan cepat sulit dirawat.

Rekomendasi sebelum integrasi besar:

- Pecah UI menjadi folder feature, misalnya `features/progress`, `features/dashboard`, dan `features/onboarding`.
- Buat layer data fetching terpisah.
- Biarkan route menjadi sumber utama halaman aktif.

### State belum persisten

Semua data penting masih `useState`. Setelah refresh:

- Profil kembali ke `initialProfile`.
- Catatan baru hilang.
- Filter dan onboarding draft hilang.
- Assistant reply kembali ke dummy state.

Backend perlu menjadi source of truth. Untuk UX, tambahkan loading, empty state, optimistic update seperlunya, dan error state.

### URL dan state screen menjadi dua sumber kebenaran

Route wrapper sudah ada, tetapi `screen` internal tetap menentukan tampilan. Ini bisa menyebabkan bug saat direct navigation, auth guard, atau prefetch data per halaman.

Rekomendasi:

- Gunakan file-system route sebagai sumber utama.
- Jadikan `TumbuhApp` atau shell menerima children/props data, bukan menentukan semua screen sendiri.
- Gunakan `Link` untuk navigasi normal dan `router.push` hanya saat memang perlu imperative navigation.

### Upload masih placeholder

Mode Foto dan Suara belum memakai input file nyata. Backend perlu didesain bersama perubahan frontend:

- UI memilih file.
- Client meminta signed upload URL.
- Client upload ke storage.
- Client membuat progress entry dengan `mediaId` atau `mediaUrl`.
- Backend memproses media secara asynchronous.

### Prisma belum siap untuk migration

Schema Prisma belum punya model. Selain itu, Prisma CLI membutuhkan `DIRECT_URL` dari `.env.local` atau `.env`.

Sebelum backend dibuat:

- Lengkapi `.env.local` dengan `DATABASE_URL` dan `DIRECT_URL`.
- Definisikan model awal.
- Buat migration pertama.
- Pastikan generated Prisma client tetap konsisten dengan output `generated/prisma`.

### Risiko privasi dan etika tinggi

Produk ini menangani data anak dan konteks kesehatan. Risiko terbesar bukan hanya teknis, tetapi juga trust dan compliance.

Hal yang perlu dikunci sejak awal:

- Backend tidak boleh menghasilkan diagnosis otomatis.
- AI output harus diberi label sebagai bahan diskusi dengan profesional.
- Semua akses data anak harus melewati authorization.
- Media, dokumen, dan lokasi harus memakai consent eksplisit.
- Delete/export data perlu disediakan sebelum data nyata dipakai luas.

### Belum ada test backend

Saat ini belum ada test API, permission, schema validation, atau data access. Untuk backend MVP, minimal tambahkan:

- Test validasi request untuk endpoint penting.
- Test authorization guardian-child ownership.
- Test create/list progress entry.
- Test consent required untuk media, document, AI, dan lokasi.
- Test error response standar.

## 6. Prioritas Implementasi Backend MVP

Urutan yang disarankan:

1. Siapkan auth, database model awal, dan ownership guardian-child.
2. Implementasikan `children` dan onboarding persistence.
3. Implementasikan progress text entry dan timeline.
4. Tambahkan dashboard aggregate sederhana dari data progress.
5. Tambahkan roadmap dan insight dummy server-side yang tersimpan.
6. Tambahkan upload media dengan signed URL.
7. Tambahkan AI processing asynchronous untuk insight, assistant, dan dokumen.
8. Tambahkan provider search dan fitur lokasi setelah consent flow matang.

Prioritas ini menjaga backend tetap berguna sejak awal tanpa langsung bergantung pada AI/media processing yang lebih kompleks.
