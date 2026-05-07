# Implementasi LLM Konsisten untuk Insight, Roadmap, dan Assistant

Dokumen ini menjelaskan cara mengintegrasikan LLM seperti Qwen ke backend Tumbuh tanpa membuat hasil insight berubah-ubah setiap kali halaman di-refresh.

Target utama dokumen ini adalah:

- menjaga hasil insight tetap konsisten untuk data yang sama,
- mencegah dashboard/roadmap menghasilkan narasi yang berbeda di setiap render,
- memisahkan proses generate AI dari proses baca data UI,
- dan tetap menjaga guardrail produk anak, kesehatan, dan non-diagnostik.

## Masalah yang Ingin Diselesaikan

Kalau LLM dipanggil langsung dari `GET /api/children/:childId/dashboard` atau `GET /api/children/:childId/insights`, maka output bisa berubah walaupun data anak tidak berubah.

Akibatnya:

- guardian melihat narasi berbeda saat refresh,
- roadmap bisa terasa tidak stabil,
- confidence terhadap produk turun,
- debugging menjadi sulit karena output tidak deterministik,
- dan frontend sulit membedakan mana data baru dan mana variasi wording model.

Solusi yang disarankan bukan memanggil model berulang kali saat render, tetapi menjadikan hasil LLM sebagai data backend yang persisten.

## Prinsip Arsitektur

Prinsip utama:

1. `GET` endpoint tidak memanggil LLM.
2. LLM hanya dipanggil saat ada aksi generate eksplisit atau background job.
3. Hasil generate disimpan ke database.
4. Frontend hanya membaca hasil yang sudah disimpan.
5. Jika data sumber belum berubah, hasil lama dipakai kembali.

Dengan pola ini, refresh halaman tidak akan menghasilkan insight baru secara acak.

## Pola Arsitektur yang Disarankan

### Read Path

Untuk route seperti:

- `GET /api/children/:childId/dashboard`
- `GET /api/children/:childId/insights`
- `GET /api/children/:childId/roadmap`

backend hanya:

- membaca child,
- membaca progress,
- membaca insight terakhir yang masih valid,
- membaca roadmap yang sudah disimpan,
- lalu merender response ke frontend.

Route read tidak boleh memanggil Qwen.

### Generate Path

LLM dipanggil hanya dari jalur seperti:

- `POST /api/children/:childId/insights/generate`
- background worker setelah progress baru masuk,
- background worker setelah onboarding complete,
- atau tombol manual `Regenerate insight` di masa depan.

Generate path bertugas:

1. ambil snapshot data,
2. hitung hash snapshot,
3. cek apakah hash sudah pernah digenerate,
4. jika sudah ada hasil valid, kembalikan hasil lama,
5. jika belum ada, panggil model,
6. validasi output,
7. simpan hasil ke database,
8. tandai versi terbaru sebagai aktif.

## Alur Data yang Disarankan

### Saat Progress Ditambahkan

1. Guardian membuat progress entry.
2. Backend menyimpan progress seperti biasa.
3. Backend menandai insight child sebagai `stale`.
4. UI tetap membaca insight lama terakhir.
5. Background job membuat insight baru berdasarkan snapshot terbaru.
6. Setelah selesai, insight baru menjadi versi aktif.

Dengan pola ini, user tidak melihat halaman kosong atau hasil yang berubah tiap refresh.

### Saat Halaman Dashboard Dibuka

1. Frontend memanggil `GET /api/children/:childId/dashboard`.
2. Backend mengambil latest persisted insight.
3. Jika ada insight aktif, tampilkan itu.
4. Jika ada data baru tetapi insight belum diperbarui, tampilkan status seperti:
   `Insight sedang diperbarui berdasarkan catatan terbaru.`

Dashboard tetap stabil walaupun proses AI berjalan di belakang.

## Struktur Data yang Disarankan

Saat ini model insight sudah cukup untuk MVP rule-based, tetapi untuk LLM yang konsisten disarankan menambah metadata persistence.

Field yang direkomendasikan:

- `sourceDataHash`
- `status`
- `version`
- `modelName`
- `promptVersion`
- `rawInput`
- `rawOutput`
- `isActive`
- `staleAt`
- `generatedAt`

### Contoh Perluasan Model Insight

```prisma
model Insight {
  id               String   @id @default(cuid())
  childId          String
  progressEntryId  String?
  kind             String
  summary          String
  alerts           Json?
  recommendations  Json?
  confidenceScore  Float?
  rangeStart       DateTime?
  rangeEnd         DateTime?
  generatedBy      String?

  sourceDataHash   String?
  status           String   @default("READY")
  version          Int      @default(1)
  modelName        String?
  promptVersion    String?
  rawInput         Json?
  rawOutput        Json?
  isActive         Boolean  @default(true)
  staleAt          DateTime?
  generatedAt      DateTime?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

Catatan:

- `rawInput` tidak harus menyimpan seluruh data sensitif mentah. Bisa juga menyimpan bentuk yang sudah diringkas.
- Jika ada concern privasi, simpan hanya structured evidence yang memang diperlukan.

## Snapshot dan Hash

Agar hasil bisa reuse saat data sama, backend perlu membuat snapshot terstruktur lalu menghitung hash.

Snapshot minimal bisa berisi:

- profil anak yang relevan untuk analisis,
- focus areas,
- age group,
- progress entries pada rentang tertentu,
- status roadmap aktif,
- flags consent yang relevan,
- insight range yang sedang dihitung.

Contoh bentuk snapshot:

```json
{
  "childId": "child_123",
  "rangeStart": "2026-05-01T00:00:00.000Z",
  "rangeEnd": "2026-05-07T23:59:59.999Z",
  "profile": {
    "name": "Sutha",
    "ageMonths": 54,
    "focusAreas": ["Perilaku", "Komunikasi"]
  },
  "progress": [
    {
      "observedAt": "2026-05-06T08:00:00.000Z",
      "area": "Perilaku",
      "note": "Menolak transisi tanpa timer visual"
    }
  ],
  "roadmap": [
    {
      "title": "Transisi dengan dukungan visual",
      "status": "IN_PROGRESS"
    }
  ]
}
```

Hash bisa dibuat dari JSON yang sudah distabilkan urutan key-nya.

Aturan penting:

- jika `sourceDataHash` sama, gunakan insight lama,
- jika hash berubah, buat versi insight baru.

## Strategi Konsistensi per Fitur

### Insight

Insight adalah kandidat paling tepat untuk LLM persistence.

Rekomendasi:

- `POST /api/children/:childId/insights/generate` membuat insight baru hanya jika hash berubah,
- `GET /api/children/:childId/insights` mengembalikan latest active insight,
- insight lama tetap disimpan sebagai histori versi.

### Dashboard

Dashboard tidak perlu memanggil model langsung.

Dashboard cukup menggabungkan:

- aggregate numerik dari backend,
- latest active insight,
- roadmap preview,
- aktivitas yang diturunkan dari insight atau roadmap aktif.

Jika butuh narasi AI di dashboard, narasi itu harus diambil dari insight yang sudah tersimpan.

### Roadmap

Roadmap sebaiknya tidak digenerate ulang penuh di setiap request.

Pola yang lebih aman:

- roadmap item tetap disimpan sebagai entitas database,
- LLM hanya memberi saran perubahan,
- backend memetakan saran itu ke update roadmap yang bisa diaudit,
- perubahan roadmap tetap explicit dan versioned.

Dengan begitu, roadmap tidak berubah liar hanya karena user refresh.

### Assistant

Assistant memang bersifat percakapan, jadi variasi lebih bisa diterima. Tetapi untuk konsistensi produk:

- simpan conversation history,
- simpan model name dan prompt version,
- simpan child context yang dipakai,
- jangan jadikan jawaban assistant sebagai sumber tunggal perubahan roadmap atau insight.

Assistant cocok diposisikan sebagai:

- penjelas,
- peringkas,
- dan pendamping tanya-jawab,

bukan generator state utama produk.

## Pembagian Tanggung Jawab Backend dan LLM

Supaya hasil lebih stabil, backend jangan menyerahkan semuanya ke model.

### Yang Sebaiknya Tetap Dihitung Backend

- jumlah observasi per minggu,
- area dominan,
- trend naik/turun,
- alert sederhana,
- target roadmap aktif,
- progress count,
- rule non-diagnostik,
- filter data berdasarkan guardian ownership.

### Yang Cocok Diserahkan ke LLM

- merapikan narasi menjadi lebih natural,
- menyusun ringkasan dari evidence yang sudah fixed,
- membuat wording rekomendasi latihan rumah,
- menyusun kalimat yang ramah orang tua tanpa keluar dari evidence.

Prinsipnya:

backend menghitung fakta, LLM menulis narasi.

## Guardrail Output Model

Walaupun memakai LLM, guardrail tetap harus kuat.

Aturan minimum:

- tidak boleh memberi diagnosis,
- tidak boleh memberi obat, dosis, atau tindakan medis definitif,
- harus mengarahkan ke profesional untuk red flag,
- tidak boleh mengarang data yang tidak ada di snapshot,
- output wajib terstruktur,
- output harus lolos validasi schema sebelum disimpan.

Contoh instruksi sistem:

- gunakan hanya data dari input,
- jangan menambah fakta baru,
- nyatakan bahwa hasil bukan diagnosis,
- jika evidence lemah, katakan bahwa data masih terbatas.

## Kontrak Output yang Disarankan

Jangan minta model mengembalikan paragraf bebas saja.

Lebih aman gunakan schema seperti:

```json
{
  "summary": "string",
  "alerts": ["string"],
  "recommendations": ["string"],
  "confidenceScore": 0.72,
  "needsProfessionalFollowup": false
}
```

Setelah model merespons:

1. parse JSON,
2. validasi dengan Zod,
3. clamp `confidenceScore` ke `0..1`,
4. sanitasi teks,
5. simpan ke database.

Jika validasi gagal:

- tandai job gagal,
- simpan error ringkas,
- fallback ke generator rule-based yang sudah ada.

## Strategi Integrasi Qwen

Jika akan memakai Qwen melalui library/model AI pilihan tim, integrasi terbaik adalah lewat service wrapper internal.

Contoh interface:

```ts
type GenerateChildInsightInput = {
  snapshot: InsightSnapshot;
  promptVersion: string;
};

type GenerateChildInsightOutput = {
  summary: string;
  alerts: string[];
  recommendations: string[];
  confidenceScore: number | null;
};

export async function generateChildInsightWithLlm(
  input: GenerateChildInsightInput,
): Promise<GenerateChildInsightOutput> {
  // wrapper untuk provider/model
}
```

Keuntungan wrapper:

- provider bisa diganti tanpa mengubah route,
- prompt version bisa dipusatkan,
- retry policy lebih rapi,
- logging lebih aman,
- test lebih mudah dengan mock service.

## Parameter Model untuk Stabilitas

Untuk use case insight yang harus konsisten:

- gunakan `temperature` rendah, idealnya `0` atau `0.1`,
- gunakan output JSON schema,
- batasi panjang jawaban,
- jangan minta model brainstorming,
- gunakan prompt yang ketat dan deterministik,
- kirim evidence yang sudah diringkas backend.

Ini tidak membuat model 100% identik selamanya, tetapi sangat mengurangi variasi.

## Lifecycle Status yang Disarankan

Supaya frontend tahu kondisi insight, gunakan status eksplisit.

Contoh status:

- `READY`
- `STALE`
- `PENDING`
- `FAILED`
- `ARCHIVED`

Makna umum:

- `READY`: insight aktif dan aman dipakai UI.
- `STALE`: ada data baru, tetapi insight lama masih ditampilkan sementara.
- `PENDING`: generate baru sedang berjalan.
- `FAILED`: generate terakhir gagal.
- `ARCHIVED`: versi lama, disimpan untuk histori.

## Perubahan Endpoint yang Disarankan

### Tetap Dipertahankan

- `GET /api/children/:childId/insights`
- `POST /api/children/:childId/insights/generate`

### Penyesuaian Behavior

`GET /api/children/:childId/insights`

- jangan generate baru,
- kembalikan `latest`,
- kembalikan `status`,
- kembalikan `isStale`,
- kembalikan `generatedAt`.

Contoh response:

```json
{
  "latest": {
    "id": "ins_123",
    "summary": "Observasi minggu ini lebih sering muncul pada area perilaku.",
    "alerts": [],
    "recommendations": [
      "Gunakan timer visual sebelum transisi."
    ],
    "confidenceScore": 0.74,
    "generatedAt": "2026-05-07T10:30:00.000Z"
  },
  "status": "READY",
  "isStale": false
}
```

`POST /api/children/:childId/insights/generate`

- cek hash,
- jika hash sama dan hasil aktif masih valid, return existing insight,
- jika hash berubah, buat versi baru.

### Endpoint Opsional

- `POST /api/children/:childId/insights/regenerate`
- `GET /api/children/:childId/insights/history`

Endpoint ini berguna untuk admin/debugging dan evaluasi prompt.

## Strategi Rollout untuk Repo Ini

Agar aman, implementasi dilakukan bertahap.

### Fase 1 - Persistence Metadata

- tambah field metadata di model `Insight`,
- tambahkan `sourceDataHash`,
- tambahkan `status`, `version`, `modelName`, `promptVersion`, `generatedAt`,
- ubah `generateInsightForChild` agar bisa reuse hasil lama bila hash sama.

### Fase 2 - Snapshot Builder

- ekstrak builder snapshot dari child, progress, dan roadmap,
- buat helper hash terpusat,
- tambahkan audit log untuk generate insight.

### Fase 3 - LLM Wrapper

- buat service wrapper Qwen,
- gunakan schema output terstruktur,
- fallback ke rule-based generator bila gagal.

### Fase 4 - Background Regeneration

- saat progress baru dibuat, tandai insight `STALE`,
- generate versi baru secara async,
- UI tetap menampilkan insight lama sampai versi baru siap.

### Fase 5 - Dashboard dan Roadmap Konsumen Pasif

- pastikan dashboard hanya baca persisted insight,
- pastikan roadmap hanya berubah lewat state database yang eksplisit,
- hindari generate LLM inline pada endpoint GET.

## Dampak ke Frontend

Frontend tidak perlu sering berubah besar.

Perubahan utama hanya:

- tampilkan `generatedAt`,
- tampilkan badge `sedang diperbarui` saat status `STALE` atau `PENDING`,
- tambahkan tombol manual regenerate bila diperlukan,
- jangan mengasumsikan refresh akan menghasilkan narasi baru.

Contoh copy UI:

- `Insight terakhir diperbarui 7 Mei 2026, 10:30`
- `Ada catatan baru. Insight sedang diperbarui.`

## Audit dan Observability

Karena fitur ini sensitif, audit trail penting.

Log minimal yang perlu disimpan:

- siapa memicu generate,
- child mana yang diproses,
- hash snapshot apa yang dipakai,
- model apa yang dipakai,
- prompt version berapa,
- apakah result baru dibuat atau reuse hasil lama,
- apakah validasi output gagal.

Ini membantu saat hasil terasa aneh atau ketika tim ingin membandingkan kualitas prompt.

## Risiko dan Mitigasi

### Risiko: hasil model tetap sedikit bervariasi

Mitigasi:

- generate sekali lalu simpan,
- gunakan temperature rendah,
- gunakan hash-based reuse,
- gunakan JSON schema ketat.

### Risiko: biaya dan latency membesar

Mitigasi:

- jangan panggil model dari endpoint GET,
- gunakan background job,
- generate hanya saat data berubah.

### Risiko: output model halusinatif

Mitigasi:

- kirim evidence yang sudah dihitung backend,
- validasi output dengan schema,
- fallback ke rule-based.

### Risiko: roadmap berubah terlalu agresif

Mitigasi:

- jadikan LLM pemberi saran, bukan pengubah state langsung,
- semua update roadmap tetap lewat persistence dan audit log.

## Rekomendasi Akhir

Untuk Tumbuh, pola paling aman adalah:

- insight dan rekomendasi tetap berbasis data backend yang persisten,
- LLM dipakai untuk menyusun narasi dari evidence yang sudah dihitung,
- dashboard hanya membaca hasil terakhir yang tersimpan,
- dan regenerate hanya dilakukan saat ada data baru atau user memicunya secara eksplisit.

Dengan arsitektur ini, produk tetap terasa pintar tanpa membuat hasil berubah-ubah setiap kali halaman dibuka ulang.

## Ringkasan Implementasi yang Disarankan

1. Tambah metadata persistence pada model `Insight`.
2. Buat snapshot builder dan `sourceDataHash`.
3. Ubah `generateInsightForChild` menjadi generate-once-and-store.
4. Jangan panggil LLM dari endpoint `GET`.
5. Jadikan dashboard dan roadmap pembaca data persisted, bukan generator.
6. Gunakan Qwen hanya untuk narasi terstruktur dengan schema dan guardrail.
7. Tambahkan status `STALE/PENDING/READY` agar frontend tetap stabil.
