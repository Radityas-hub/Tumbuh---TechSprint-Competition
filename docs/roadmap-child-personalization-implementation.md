# Implementasi Roadmap yang Lebih Spesifik per Child

Dokumen ini menjelaskan bagaimana roadmap Tumbuh diubah dari roadmap template generik menjadi roadmap yang lebih spesifik untuk setiap child.

Dokumen ini melanjutkan fondasi di [llm-consistency-implementation.md](/d:/techsprint/Tumbuh---TechSprint-Competition/docs/llm-consistency-implementation.md): insight sudah dibuat persisten, stabil, dan bisa dihasilkan melalui Qwen. Langkah berikutnya adalah memastikan dampak insight ke roadmap juga benar-benar personal.

## Tujuan

Target utama perubahan ini:

- roadmap tidak lagi hanya terlihat seperti daftar template per area,
- urutan target lebih relevan untuk kondisi child yang aktif,
- detail target memakai evidence nyata dari progress child,
- status target berubah mengikuti pola observasi terbaru,
- dan perubahan roadmap tetap persisten, terukur, dan bisa diaudit.

## Masalah Saat Ini

Saat ini roadmap di backend masih dibangun dari `roadmapTemplates` di [lib/roadmap.ts](/d:/techsprint/Tumbuh---TechSprint-Competition/lib/roadmap.ts).

Akibatnya:

- child dengan area yang sama bisa mendapat roadmap awal yang sangat mirip,
- roadmap lebih terasa sebagai seed/default daripada adaptive plan,
- insight terbaru belum otomatis mengubah prioritas target,
- evidence roadmap masih banyak bersifat generik,
- dan CTA `Lihat dampak ke roadmap` belum benar-benar berarti “roadmap sudah menyesuaikan child ini”.

Roadmap saat ini sudah backend-driven, tetapi belum cukup child-specific.

## Prinsip Arsitektur

Prinsip utama personalisasi roadmap:

1. roadmap awal boleh tetap berasal dari seed template,
2. personalisasi terjadi setelah ada data child yang cukup,
3. roadmap tidak digenerate ulang total di setiap request,
4. backend menyimpan perubahan roadmap sebagai state yang persisten,
5. LLM memberi rekomendasi perubahan, bukan menulis state seenaknya,
6. backend tetap memegang kontrol final terhadap status, urutan, dan batas perubahan.

Dengan pola ini, roadmap tetap stabil saat refresh tetapi makin lama makin mencerminkan kondisi child yang aktif.

## Level Personalisasi yang Diinginkan

Roadmap yang personal seharusnya dipengaruhi oleh kombinasi sinyal berikut:

- `focusAreas` child,
- usia atau tahap perkembangan yang relevan,
- frekuensi area yang paling sering muncul di progress,
- perubahan pola antar minggu,
- target roadmap yang sering `NEEDS_ATTENTION`,
- target yang sudah `ACHIEVED`,
- insight terbaru yang sudah persisten,
- dan bukti observasi nyata yang paling dekat dengan target tertentu.

Artinya dua child dengan focus area `Perilaku` tidak harus menerima detail, prioritas, dan evidence yang sama.

## Hasil yang Diinginkan di UI

Di halaman roadmap, perubahan yang diinginkan bukan sekadar mengganti kalimat insight.

Yang seharusnya berubah:

- target mana yang berada di urutan atas,
- target mana yang menjadi `IN_PROGRESS`,
- target mana yang menjadi `NEEDS_ATTENTION`,
- detail target yang lebih spesifik,
- evidence singkat yang berasal dari progress nyata,
- confidence score per target,
- dan, bila perlu, target baru yang lebih relevan.

Contoh:

- jika observasi terbaru sering membahas transisi mendadak, maka target `Transisi dengan dukungan visual` harus naik prioritas,
- jika child mulai menunjukkan kemajuan komunikasi spontan, target berikutnya bisa bergeser ke `Meminta bantuan dengan kata atau gestur`,
- jika tidak ada observasi motorik sama sekali, target motorik tidak perlu mendominasi roadmap preview.

## Peran Seed Roadmap

Seed roadmap tetap berguna.

Perannya:

- memberi state awal agar dashboard dan roadmap tidak kosong setelah onboarding,
- memberi struktur target dasar per focus area,
- menjadi objek yang nanti dipersonalisasi, bukan dibuang total.

Jadi perubahan yang disarankan bukan menghapus seed, tetapi:

- seed tetap menjadi baseline,
- personalisasi berjalan di atas baseline itu,
- item yang ada bisa diperbarui, diprioritaskan ulang, dijeda, atau diberi evidence nyata.

## Read Path dan Update Path

### Read Path

Route berikut tetap menjadi route baca:

- `GET /api/children/:childId/roadmap`
- `GET /api/children/:childId/dashboard`

Route ini tidak boleh memanggil LLM langsung.

Route read hanya membaca:

- roadmap item aktif yang sudah disimpan,
- latest persisted insight,
- dan aggregate yang sudah dihitung backend.

### Update Path

Perubahan roadmap hanya terjadi dari jalur update seperti:

- onboarding complete,
- progress create/update/delete,
- insight generate selesai,
- guardian manual update roadmap item,
- atau endpoint debug/regenerate roadmap di masa depan.

## Sumber Data untuk Personalisasi

Backend sebaiknya membangun snapshot roadmap personalization dari:

- child profile,
- focus areas,
- recent progress entries,
- weekly trend summary,
- latest persisted insight,
- current roadmap items,
- dan history status item yang relevan.

Contoh snapshot:

```json
{
  "child": {
    "id": "child_123",
    "name": "Sutha",
    "focusAreas": ["Perilaku", "Komunikasi"]
  },
  "latestInsight": {
    "summary": "Observasi meningkat pada area perilaku.",
    "alerts": [
      "Transisi mendadak masih sering memicu reaksi emosional."
    ],
    "recommendations": [
      "Gunakan timer visual sebelum transisi."
    ]
  },
  "progressSummary": {
    "dominantArea": "Perilaku",
    "currentWeekCount": 6,
    "previousWeekCount": 3
  },
  "roadmap": [
    {
      "id": "rm_1",
      "title": "Transisi dengan dukungan visual",
      "status": "NEEDS_ATTENTION",
      "confidenceScore": 0.58
    }
  ]
}
```

## Bentuk Personalisasi yang Disarankan

Backend perlu membatasi jenis perubahan yang boleh dilakukan.

### Perubahan yang Diizinkan

- update `status`
- update `detail`
- update `evidence`
- update `confidenceScore`
- update `sortOrder`
- menandai item sebagai lebih prioritas
- menandai item sebagai `PAUSED`
- menambahkan item baru jika benar-benar perlu

### Perubahan yang Tidak Langsung Diizinkan

- menghapus semua roadmap lama sekaligus
- mengganti semua target hanya berdasarkan satu observasi
- membuat target diagnosis medis
- menambahkan target yang tidak punya hubungan dengan focus area atau evidence

## Strategi Personalisasi Bertahap

### Tahap 1 - Rule-Based Reprioritization

Sebelum LLM ikut mengubah roadmap, backend bisa mulai dari rule-based personalization:

- hitung area dominan dari progress,
- cari roadmap item yang area-nya sama,
- naikkan item terkait menjadi `IN_PROGRESS` atau `NEEDS_ATTENTION`,
- turunkan item yang tidak relevan,
- isi evidence dari observasi terbaru.

Ini memberi roadmap yang lebih spesifik tanpa risiko halusinasi model.

### Tahap 2 - LLM Suggestion Layer

Setelah insight persisten stabil, LLM memberi saran perubahan roadmap.

Pola yang disarankan:

1. backend membangun snapshot,
2. backend mengirim item roadmap aktif + latest insight ke Qwen,
3. Qwen mengembalikan saran perubahan terstruktur,
4. backend memvalidasi saran,
5. backend menerapkan hanya perubahan yang aman,
6. backend menyimpan hasil final ke `roadmap_items`.

### Tahap 3 - Audit and Version Awareness

Setelah perubahan roadmap diterapkan:

- simpan audit log,
- simpan alasan perubahan,
- simpan source insight,
- simpan prompt/model metadata bila perubahan berasal dari LLM,
- dan pastikan FE bisa membaca status final tanpa regenerate lagi.

## Kontrak Output LLM yang Disarankan

LLM sebaiknya tidak diminta mengembalikan paragraf bebas.

Lebih aman gunakan output JSON seperti:

```json
{
  "changes": [
    {
      "itemId": "rm_1",
      "action": "update",
      "status": "NEEDS_ATTENTION",
      "detail": "Gunakan timer visual 2-3 menit sebelum transisi aktivitas yang sering memicu penolakan.",
      "evidence": [
        "Pada 6 Mei, transisi mendadak masih memicu penolakan.",
        "Timer visual disebut membantu pada observasi terbaru."
      ],
      "confidenceScore": 0.84,
      "reason": "Target ini paling sesuai dengan pola observasi terbaru."
    }
  ],
  "summary": "Roadmap lebih diprioritaskan ke area transisi dan regulasi emosi."
}
```

Field `action` bisa dibatasi menjadi:

- `update`
- `reprioritize`
- `pause`
- `add`

Backend kemudian memvalidasi:

- itemId valid,
- status valid,
- evidence tidak kosong jika status berubah signifikan,
- confidence score tetap `0..1`,
- action `add` dibatasi maksimal satu item per cycle,
- dan tidak ada wording diagnostik.

## Peran Backend Setelah LLM Merespons

LLM tidak menulis ke database secara langsung.

Backend yang bertanggung jawab:

- memfilter perubahan yang valid,
- menolak perubahan yang terlalu agresif,
- memetakan area label ke enum,
- membatasi jumlah item yang diubah,
- menetapkan `sortOrder`,
- menyimpan audit trail,
- dan menjaga agar roadmap tetap konsisten.

Prinsipnya:

LLM memberi saran, backend menerapkan keputusan akhir.

## Kapan Personalisasi Dipicu

Personalisasi roadmap bisa dipicu oleh:

- onboarding complete,
- progress entry baru,
- update progress entry,
- delete progress entry,
- insight baru selesai digenerate,
- atau manual `POST /api/children/:childId/roadmap/personalize`.

Urutan yang paling aman:

1. progress berubah,
2. insight ditandai `STALE/PENDING`,
3. insight baru menjadi `READY`,
4. backend baru menjalankan personalization roadmap.

Dengan urutan ini, roadmap memakai insight terbaru yang sudah stabil.

## Status dan Audit

Perubahan roadmap harus bisa dijelaskan.

Minimal metadata yang perlu dicatat di audit log:

- `childId`
- `trigger`
- `insightId`
- `modelName`
- `promptVersion`
- `changedItemIds`
- `beforeStatus`
- `afterStatus`
- `beforeSortOrder`
- `afterSortOrder`
- `appliedBy`

Ini penting agar tim bisa menjawab pertanyaan:

- kenapa target ini naik ke atas,
- kenapa status item berubah,
- apakah perubahan ini dari guardian atau dari system,
- dan apakah perubahan ini berasal dari LLM atau rule backend.

## Perubahan Data Model yang Direkomendasikan

Model `RoadmapItem` saat ini sudah cukup untuk tahap awal personalisasi, tetapi akan lebih kuat jika nanti ditambah metadata opsional seperti:

- `lastPersonalizedAt`
- `personalizationSource`
- `sourceInsightId`
- `personalizationReason`

Contoh arah perluasan:

```prisma
model RoadmapItem {
  id                    String   @id @default(cuid())
  childId               String
  area                  FocusArea
  title                 String
  detail                String?
  status                RoadmapStatus
  evidence              Json?
  confidenceScore       Float
  sortOrder             Int
  lastPersonalizedAt    DateTime?
  personalizationSource String?
  sourceInsightId       String?
  personalizationReason String?
}
```

Field ini tidak wajib untuk fase pertama, tetapi sangat membantu untuk explainability.

## Perubahan Endpoint yang Disarankan

### Tetap Dipertahankan

- `GET /api/children/:childId/roadmap`
- `PATCH /api/children/:childId/roadmap/:itemId`

### Endpoint Baru yang Disarankan

- `POST /api/children/:childId/roadmap/personalize`
- `GET /api/children/:childId/roadmap/history`

`POST /personalize` berguna untuk:

- trigger manual saat development,
- QA,
- dan fallback jika background cycle gagal.

### Behavior `GET /roadmap`

Response roadmap sebaiknya nantinya bisa menyertakan metadata seperti:

- `personalizedAt`
- `personalizationSource`
- `sourceInsightId`
- `isDerivedFromLatestInsight`

Tanpa harus mengubah layout UI secara besar.

## Dampak ke Frontend

Frontend tidak perlu berubah besar untuk fase pertama.

Yang cukup ditambahkan nanti:

- copy kecil bahwa roadmap sudah diperbarui berdasarkan catatan terbaru,
- timestamp personalisasi terakhir,
- dan mungkin indikator ringan bahwa target ini “disesuaikan dari insight terbaru”.

Contoh copy:

- `Roadmap diperbarui berdasarkan catatan terbaru pada 7 Mei 2026, 14:20`
- `Prioritas roadmap disesuaikan dari insight terbaru`

## Strategi Rollout di Repo Ini

### Fase 1 - Dokumentasi dan Contract

- finalisasi desain personalisasi roadmap,
- tetapkan jenis perubahan yang diizinkan,
- tetapkan output schema untuk Qwen.

### Fase 2 - Rule-Based Personalization

- buat helper `applyInsightToRoadmap(childId)`,
- baca latest persisted insight,
- ubah status, evidence, dan sort order roadmap item yang paling relevan,
- simpan audit log.

### Fase 3 - LLM Suggestion

- buat wrapper `generateRoadmapAdjustmentsWithLlm`,
- kirim snapshot child + roadmap + insight ke Qwen,
- validasi output JSON,
- terapkan perubahan aman saja.

### Fase 4 - Endpoint dan Trigger

- tambahkan endpoint manual `POST /roadmap/personalize`,
- panggil otomatis setelah insight `READY`,
- hindari trigger paralel berulang untuk child yang sama.

### Fase 5 - UX Ringan

- tampilkan metadata personalisasi di dashboard/roadmap,
- pertahankan UI existing tanpa redesign besar.

## Risiko dan Mitigasi

### Risiko: roadmap terlalu sering berubah

Mitigasi:

- personalisasi hanya setelah insight `READY`,
- batasi jumlah item yang berubah dalam satu cycle,
- gunakan threshold sebelum status berubah.

### Risiko: roadmap terasa “menghakimi”

Mitigasi:

- gunakan bahasa suportif,
- jangan gunakan wording diagnosis,
- gunakan evidence netral dari observasi.

### Risiko: semua child tetap terlihat mirip

Mitigasi:

- gunakan progress summary nyata,
- pakai evidence child-specific,
- ubah sort order dan status, bukan hanya narasi insight.

### Risiko: roadmap jadi tidak dapat dijelaskan

Mitigasi:

- simpan source insight,
- simpan audit log,
- simpan alasan perubahan,
- dan tampilkan metadata ringan di FE.

## Rekomendasi Akhir

Roadmap Tumbuh sebaiknya tetap dimulai dari seed template, tetapi cepat bertransisi menjadi roadmap yang dipersonalisasi berdasarkan child yang aktif.

Pola yang paling aman:

- seed sebagai baseline,
- insight persisten sebagai sumber sinyal,
- backend sebagai pengendali perubahan state,
- Qwen sebagai pemberi saran terstruktur,
- dan semua perubahan tetap tersimpan serta bisa diaudit.

Dengan pendekatan ini, “Lihat dampak ke roadmap” benar-benar berarti ada dampak nyata dari data child ke target yang ditampilkan.

## Ringkasan Implementasi yang Disarankan

1. Pertahankan seed roadmap sebagai baseline awal.
2. Tambahkan helper personalisasi `applyInsightToRoadmap(childId)`.
3. Gunakan latest persisted insight sebagai input utama.
4. Ubah `status`, `detail`, `evidence`, `sortOrder`, dan `confidenceScore` secara terbatas.
5. Tambahkan wrapper Qwen khusus saran perubahan roadmap.
6. Validasi output dengan schema sebelum menulis ke DB.
7. Simpan audit log dan metadata source agar perubahan bisa dijelaskan.
