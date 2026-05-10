# Tumbuh — Project Context

> Dokumen ini merangkum seluruh konteks proyek Tumbuh: apa produknya, bagaimana arsitekturnya, fitur apa saja yang sudah dibangun, dan bagaimana semua bagian saling terhubung.

---

## 1. Apa Itu Tumbuh

Tumbuh adalah **aplikasi web pendamping untuk orang tua anak berkebutuhan khusus** (autisme, ADHD, Down syndrome, disleksia, speech delay, dll). Produk ini membantu orang tua:

- **Mencatat** observasi perkembangan harian tanpa tekanan format sempurna.
- **Melihat pola** dari catatan yang terkumpul melalui insight berbasis AI.
- **Menyusun roadmap** perkembangan yang adaptif dan personal per anak.
- **Menyiapkan konsultasi** dengan terapis, psikolog, atau sekolah dengan konteks yang lebih rapi.

### Positioning Produk

- Tumbuh **bukan alat diagnosis**. Semua output AI diframing sebagai bahan diskusi dengan profesional.
- Tone produk: hangat, suportif, tidak menghakimi, parent-centered.
- Bahasa utama: **Bahasa Indonesia**.
- Framing: "mendampingi", bukan "menilai".

### Narasi Inti

```
Catat momen kecil → Lihat pola → Susun roadmap → Siapkan konsultasi
```

---

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript |
| Frontend | React 18, GSAP (animasi), Lucide React (ikon) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Auth | Supabase Auth (+ dev-mode header fallback) |
| Storage | Local filesystem (`storage/uploads/`) dengan HMAC-signed URLs (MVP), designed for Supabase Storage/S3 |
| Validasi | Zod |
| AI/LLM | Qwen (via OpenAI-compatible API) |
| Styling | Custom CSS dengan design tokens (tanpa Tailwind, tanpa component library) |
| Font | Poppins |

### Dependencies Utama (`package.json`)

```json
{
  "next": "^14.2.5",
  "react": "^18.3.1",
  "@prisma/client": "^7.8.0",
  "@prisma/adapter-pg": "^7.8.0",
  "@supabase/supabase-js": "^2.105.4",
  "gsap": "^3.15.0",
  "lucide-react": "^0.468.0",
  "zod": "^4.4.3"
}
```

---

## 3. Arsitektur

### 3.1 Frontend

```
app/
├── TumbuhApp.tsx          ← Entry point utama (client component)
├── tumbuh/
│   ├── useTumbuhSession.ts  ← Session, auth, data fetching, navigation
│   ├── api.ts               ← apiRequest<T>() helper + auth injection
│   ├── types.ts             ← Semua TypeScript types untuk API response
│   ├── Dashboard.tsx        ← Halaman dashboard
│   ├── Roadmap.tsx          ← Halaman roadmap
│   ├── Progress.tsx         ← Halaman catatan/timeline
│   ├── Education.tsx        ← Artikel + AI assistant
│   ├── Consultation.tsx     ← Rekomendasi konsultasi
│   ├── Onboarding.tsx       ← Flow onboarding 4 langkah
│   ├── Settings.tsx         ← Export, delete, sign out
│   ├── Landing.tsx          ← Landing page
│   ├── AppShell.tsx         ← Sidebar + workspace layout
│   ├── Header.tsx           ← Header landing
│   ├── components.tsx       ← Shared UI components
│   ├── constants.tsx        ← Konstanta UI
│   ├── personalize.ts       ← Narrative generation berdasarkan data child
│   ├── skeletons.tsx        ← Loading skeletons
│   └── utils.ts             ← Utility functions
├── api/                     ← Next.js Route Handlers (backend)
└── [route pages]            ← Wrapper pages untuk routing
```

**Pola navigasi:** Screen-based routing via `useTumbuhSession` hook. URL disinkronkan dengan `router.push()`.

### 3.2 Backend (API Routes)

```
app/api/
├── me/                          ← Guardian profile
├── children/                    ← CRUD child + sub-resources
│   └── [childId]/
│       ├── dashboard/           ← Aggregated dashboard data
│       ├── roadmap/             ← Roadmap items + personalize
│       ├── progress/            ← Progress entries CRUD
│       ├── insights/            ← Insight read + generate
│       ├── assistant/           ← Conversations, evaluations, snapshot
│       ├── consultations/       ← Recommendations
│       ├── consents/            ← Consent management
│       ├── audit-logs/          ← Activity logs
│       ├── export/              ← Data export
│       └── onboarding/          ← Onboarding complete
├── assistant/chat/              ← AI assistant endpoint
├── articles/                    ← Knowledge articles
├── documents/                   ← Document upload + analyze
├── media/                       ← Media upload + process
├── providers/                   ← Provider search
└── admin/                       ← Admin dashboard + knowledge review
```

### 3.3 Service Layer (`lib/`)

```
lib/
├── prisma.ts                    ← Prisma client singleton
├── auth/session.ts              ← Server-side auth helper
├── api/errors.ts                ← Error response helpers
├── api/response.ts              ← Success response helpers
├── api/validation.ts            ← Zod validation helpers
├── children.ts                  ← Child CRUD + ownership
├── progress.ts                  ← Progress entries service
├── dashboard.ts                 ← Dashboard aggregation
├── roadmap.ts                   ← Roadmap CRUD + seed templates
├── roadmap-personalization.ts   ← LLM-powered roadmap personalization
├── curriculum.ts                ← Curriculum library (20+ items)
├── insights.ts                  ← Insight generation + persistence
├── assistant.ts                 ← AI assistant logic
├── assistant-rag.ts             ← RAG pipeline (retrieval, context, policies)
├── assistant-evaluator.ts       ← Response quality evaluation
├── knowledge-review.ts          ← Admin knowledge review
├── articles.ts                  ← Article service
├── consultations.ts             ← Consultation recommendations
├── consents.ts                  ← Consent management
├── audit.ts                     ← Audit logging
├── media.ts                     ← Media upload + processing
├── hardening.ts                 ← Export, delete, governance
├── admin-dashboard.ts           ← Admin dashboard aggregation
└── supabase-browser.ts          ← Client-side Supabase helper
```

### 3.4 AI/LLM Integration

Tumbuh menggunakan arsitektur **RAG (Retrieval-Augmented Generation)** dengan prinsip:

1. **GET endpoints tidak pernah memanggil LLM** — hasil AI dipersist dan dibaca.
2. **Generate-once-and-store** — insight digenerate sekali, disimpan dengan `sourceDataHash`, dan di-reuse jika data belum berubah.
3. **Backend menghitung fakta, LLM menulis narasi** — agregasi numerik dilakukan backend, LLM hanya menyusun kalimat dari evidence yang sudah dihitung.
4. **Guardrail ketat** — non-diagnostik, tidak memberi obat/dosis, mengarahkan ke profesional untuk red flag.

#### Pipeline Assistant (RAG)

```
Pertanyaan Guardian
    ↓
Intent Classification
    ↓
Child Context Snapshot (hash-cached)
    ↓
Knowledge Chunk Retrieval (keyword + metadata filter)
    ↓
Policy Retrieval (berdasarkan intent)
    ↓
Prompt Composition (structured JSON)
    ↓
LLM Call (Qwen, temperature rendah)
    ↓
Output Validation (Zod schema)
    ↓
Response Logging + Evaluation
    ↓
Return to Frontend
```

#### Insight Lifecycle

```
Progress berubah → Insight ditandai STALE → Generate baru (async)
    → Validasi output → Simpan sebagai READY → UI baca hasil persisted
```

Status: `READY` | `STALE` | `PENDING` | `FAILED` | `ARCHIVED`

#### Roadmap Personalization

Dua fase:
1. **Rule-based reprioritization** — hitung area dominan, ubah status/sortOrder.
2. **LLM suggestion layer** — Qwen memberi saran perubahan terstruktur (max 4 changes/cycle, max 1 addition), backend memvalidasi sebelum apply.

---

## 4. Data Model (Prisma Schema)

### Migration History

| Migration | Tanggal | Isi |
|-----------|---------|-----|
| `20260505150000_init` | 5 Mei 2026 | Schema awal: Guardian, Child, Consent, ProgressEntry, MediaAsset, RoadmapItem, Insight, AuditLog, Article, AssistantConversation, AssistantMessage, Provider, ProcessingJob + semua enums + indexes + foreign keys |
| `20260507113000_insight_persistence_metadata` | 7 Mei 2026 | Tambah ke Insight: sourceDataHash, status, version, modelName, promptVersion, rawInput, rawOutput, isActive, staleAt, generatedAt + 2 indexes |
| `20260507133000_roadmap_personalization_metadata` | 7 Mei 2026 | Tambah ke RoadmapItem: lastPersonalizedAt, personalizationSource, sourceInsightId, personalizationReason |
| `20260507170000_assistant_knowledge_rag_foundation` | 7 Mei 2026 | Tabel baru: KnowledgeArticle, KnowledgeChunk, AssistantPolicy, ChildContextSnapshot, AssistantResponseLog + indexes + foreign keys |
| `20260507134530_assistant_stage3_evaluation_review` | 7 Mei 2026 | Tabel baru: AssistantEvaluation. Tambah ke ChildContextSnapshot: dataCompleteness, lastProgressAt, progressCount, progressWindowDays, roadmapCount. Tambah ke KnowledgeArticle/Chunk: reviewedBy, reviewNotes, lastReviewedAt |

### Entitas Utama

| Model | Fungsi |
|-------|--------|
| `Guardian` | Akun orang tua/pengasuh (linked ke Supabase Auth) |
| `Child` | Profil anak: nama, kondisi, focusAreas, routine, supportNeed |
| `ProgressEntry` | Catatan observasi harian (teks/foto/suara) |
| `RoadmapItem` | Target perkembangan dengan status, evidence, confidence, personalization metadata |
| `Insight` | Ringkasan AI yang dipersist (versioned, hash-based dedup) |
| `Consent` | Consent per-child per-scope |
| `AuditLog` | Log aktivitas sensitif |

### Entitas Pendukung

| Model | Fungsi |
|-------|--------|
| `MediaAsset` | File upload dengan status lifecycle |
| `ProcessingJob` | Async job queue untuk media/document processing |
| `Article` | Konten edukasi |
| `KnowledgeArticle` | Artikel knowledge base untuk RAG |
| `KnowledgeChunk` | Potongan knowledge untuk retrieval (dengan embedding) |
| `AssistantPolicy` | Safety/faithfulness policies untuk AI |
| `AssistantConversation` / `AssistantMessage` | Chat history |
| `ChildContextSnapshot` | Cached child context untuk assistant |
| `AssistantResponseLog` | Log lengkap reasoning AI |
| `AssistantEvaluation` | Skor kualitas response (relevance, safety, faithfulness, actionability) |
| `Provider` | Direktori fasilitas kesehatan |

### Enum Penting

- **FocusArea:** `COMMUNICATION`, `MOTORIC`, `BEHAVIOR`, `ACADEMIC`
- **RoadmapStatus:** `ACHIEVED`, `IN_PROGRESS`, `NEXT_TARGET`, `NEEDS_ATTENTION`, `PAUSED`
- **InsightKind:** `WEEKLY`, `ENTRY`, `ROADMAP`, `ASSISTANT`, `DOCUMENT`
- **ConsentScope:** `HEALTH_DATA`, `AI_INSIGHT`, `MEDIA_UPLOAD`, `DOCUMENT_ANALYSIS`, `LOCATION`
- **MediaStatus:** `PENDING_UPLOAD`, `UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`
- **InputType:** `TEXT`, `PHOTO`, `AUDIO`, `DOCUMENT`
- **JobStatus:** `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`

### Key Database Indexes (Performance)

| Table | Index | Purpose |
|-------|-------|---------|
| children | `guardian_id` | Ownership lookup |
| children | `deleted_at` | Soft delete filter |
| consents | `child_id, granted` | Active consent check |
| consents | `child_id, scope` (unique) | Upsert constraint |
| progress_entries | `child_id, observed_at` | Timeline query |
| progress_entries | `child_id, area` | Area filter |
| progress_entries | `deleted_at` | Soft delete filter |
| roadmap_items | `child_id, sort_order` | Ordered roadmap |
| roadmap_items | `child_id, status` | Status filter |
| insights | `child_id, kind, created_at` | Latest insight by kind |
| insights | `child_id, is_active, created_at` | Active insight lookup |
| insights | `child_id, source_data_hash` | Hash-based dedup |
| child_context_snapshots | `child_id, snapshot_type, created_at` | Latest snapshot |
| child_context_snapshots | `child_id, source_data_hash` | Hash-based reuse |
| assistant_response_logs | `intent, created_at` | Intent analytics |
| assistant_evaluations | `overall_score, created_at` | Quality monitoring |

### Foreign Key Cascade Rules

| Relation | On Delete |
|----------|-----------|
| Child → Guardian | CASCADE (delete children when guardian deleted) |
| Consent → Child | CASCADE |
| ProgressEntry → Child | CASCADE |
| MediaAsset → Child | CASCADE |
| MediaAsset → ProgressEntry | SET NULL |
| RoadmapItem → Child | CASCADE |
| Insight → Child | CASCADE |
| Insight → ProgressEntry | SET NULL |
| AuditLog → Guardian/Child | SET NULL (preserve logs) |
| AssistantConversation → Guardian | CASCADE |
| AssistantConversation → Child | SET NULL |
| AssistantMessage → Conversation | CASCADE |
| KnowledgeChunk → KnowledgeArticle | CASCADE |
| ChildContextSnapshot → Child | CASCADE |
| AssistantResponseLog → Guardian | CASCADE |
| AssistantResponseLog → Child | SET NULL |
| AssistantResponseLog → Conversation | SET NULL |
| AssistantEvaluation → ResponseLog | CASCADE |
| ProcessingJob → MediaAsset | SET NULL |

---

## 5. Fitur Utama

### 5.1 Onboarding

Flow 4 langkah:
1. Identitas dasar anak (nama, tanggal lahir)
2. Kondisi/diagnosis
3. Area fokus (Komunikasi, Motorik, Perilaku, Akademik)
4. Rutinitas awal + kebutuhan bantuan utama

Setelah complete: seed roadmap dibuat otomatis berdasarkan curriculum library.

### 5.2 Dashboard

Halaman "rumah" — bukan analytics dashboard, tapi tempat orang tua merasa tenang dan tahu kondisi anak.

Komponen:
- **Hero Zone** — Greeting personal (berdasarkan waktu hari) + narasi kondisi minggu ini (personalized per child)
- **Spotlight Alert** — Conditional, hanya muncul jika ada alert bermakna dari insight
- **Daily Actions** — Max 2 aktivitas dari recommendations insight, area-tinted background
- **Weekly Pulse** — 7 dot indicators per hari (filled/empty/future) + narrative text
- **Focus Targets** — 1-2 target roadmap terdekat dengan SVG progress arc (radius 22, circumference-based)
- **Insight Card** — Expandable (line-clamp 3 → full), dengan status badge dan timestamp freshness
- **QuickNote Modal** — Inline modal untuk rapid entry creation tanpa navigasi ke halaman progress
- **ProductTour** — First-visit guided tour (variant "empty" dan "full")
- **Auth Reminder** — Muncul jika user belum login, mengajak simpan data permanen
- **Empty State** — Ilustrasi + single invitation card (bukan panel kosong)

Data dari: `GET /api/children/:childId/dashboard` (satu endpoint agregat).

Copy personalization: `app/tumbuh/personalize.ts` menghasilkan greeting, narrative, pulse text, insight fallback, dan activity placeholders berdasarkan child context (nama, kondisi, focusAreas, routine).

### 5.3 Progress / Catatan

Input layer utama produk. Sumber data untuk insight, dashboard, roadmap personalization.

- CRUD catatan observasi (teks, foto, suara) dengan soft delete (`deletedAt`)
- Filter per area fokus (query backend)
- Per-entry mini-insight (generated immediately via `generateEntryInsightForProgressEntry`)
- Timeline dengan cursor-based pagination (limit max 50)
- Media linking: progress entry bisa punya `mediaId` yang di-link ke `MediaAsset`
- Setiap create/update/delete progress otomatis: mark insights stale → generate entry insight → schedule weekly insight refresh

### 5.4 Roadmap

Target perkembangan adaptif per anak.

- Status: Achieved, In Progress, Needs Attention, Next Target, Paused
- Status labels (Indonesian): Tercapai, Berproses, Perlu perhatian, Target berikutnya, Dijeda
- Tone colors: green, amber, coral, blue, slate
- Evidence dari observasi nyata (JSON array of strings)
- Confidence score per target (0-1, clamped)
- Personalization metadata (lastPersonalizedAt, source, reason, sourceInsightId)
- Seed dari curriculum library (`lib/curriculum.ts`, 20+ items scored by condition/age/routine/supportNeed) → fallback ke generic templates jika curriculum kosong
- Update roadmap otomatis marks insights stale dan triggers refresh
- `achievedAt` di-set saat status berubah ke ACHIEVED, di-null-kan saat berubah ke status lain

### 5.5 Education

Dua fungsi:
1. **Artikel knowledge base** — 4 seed articles (milestone, konsultasi, rutinitas visual, aktivitas rumah), dicari via query/category filter, auto-seeded jika DB kosong
2. **AI Assistant** — Full RAG pipeline: intent classification → child context snapshot → knowledge chunk retrieval → policy enforcement → structured JSON output → auto-evaluation → conversation history persistence

Assistant guardrails:
- Tidak memberi diagnosis, obat, atau dosis
- Mengarahkan ke profesional untuk red flag
- Output terstruktur: `{ answer, reasoningSummary, nextObservationIdeas, followupQuestions, riskLevel, citations }`
- Fallback ke template aman jika LLM gagal
- Setiap response otomatis dievaluasi (relevance, safety, faithfulness, actionability scores)

### 5.6 Consultation

"Action bridge" dari pemahaman ke tindak lanjut:
- Rekomendasi jenis profesional berdasarkan focus areas (Speech therapist, Psikolog anak, Okupasi terapi, Psikolog pendidikan)
- Alasan rekomendasi yang spesifik per area
- Checklist persiapan konsultasi (apa yang perlu dibawa)
- Provider search dengan 3 seeded providers (Jakarta, Bandung, Surabaya)
- Location-based search memerlukan consent `LOCATION` — ditolak tanpa consent
- Placeholder mode jika belum ada meaningful progress

### 5.7 Settings & Governance

- Export data child (JSON) — includes profile, consents, progress, roadmap, insights, media metadata
- Soft delete child + all progress entries (transactional)
- Sign out (via Supabase Auth state change listener)
- Consent management per scope (5 scopes, upsert pattern)
- Audit log visibility (last 50 entries per child)
- Onboarding auto-seeds consents: health_data=true, ai_insight=true, media/document/location=false

### 5.8 Admin Dashboard

Untuk operasional internal (bukan end-user):
- Overview metrics: article count, chunk count, pending review, child count, response log count, fallback count, evaluation count, average score, low score count
- Issue hotspots: aggregated evaluation issues ranked by frequency
- Knowledge article/chunk review queue (pending items)
- Latest evaluations with per-dimension scores
- Child snapshot health: progress count, snapshot version, sparse data flag, weekly insight flag
- Review workflow: approve/reject articles and chunks with reviewer label and notes

---

## 6. Keamanan & Compliance

| Aspek | Implementasi |
|-------|-------------|
| Authorization | Guardian-child ownership check di setiap data access |
| Consent | Explicit per-scope, operasi diblokir tanpa consent aktif |
| Audit Trail | Semua operasi sensitif di-log |
| AI Safety | Non-diagnostik, no medication, professional referral untuk red flag |
| Output Validation | Zod schema validation sebelum persist |
| Fallback | Rule-based fallback jika LLM gagal |
| Auth | Supabase Auth + Bearer token, dev-mode header fallback |
| Media Security | Signed upload URLs |
| Soft Delete | `deletedAt` pattern untuk child dan progress |
| Data Export | JSON export endpoint |

---

## 7. Design System

### Visual Identity

- **Warna utama:** Deep green `#06443e` (--teal-dark), soft mint `#dff4ec` (--mint), off-white `#f5f8f6` (--bg)
- **Surface:** `#ffffff` (--surface-solid), `rgba(255,255,255,0.88)` (--surface)
- **Text:** `#182924` (--ink), `#5d6b66` (--muted)
- **Border:** `rgba(24,58,50,0.1)` (--line)
- **Area colors:** Komunikasi=teal/mint, Motorik=blue/blue-soft, Perilaku=amber/amber-soft, Akademik=coral/coral-soft
- **Font:** Poppins (400/500/600/700) — loaded via Google Fonts
- **Spacing:** 8pt grid: --space-2(8px), --space-3(12px), --space-4(16px), --space-5(20px), --space-6(24px), --space-8(32px), --space-10(40px), --space-12(48px)
- **Radius:** --radius-lg(36px), --radius(24px), --radius-md(20px), --radius-sm(14px)
- **Shadow:** Disabled (`none`) — clean flat design
- **Filosofi:** Calm, warm, parent-centered — bukan clinical dashboard

### Prinsip Dashboard

1. Angka bukan hero — diterjemahkan jadi kalimat
2. Satu layar, satu pertanyaan
3. Warmth over precision
4. Silence is good news (tidak ada panel kosong)
5. Setiap blok punya satu aksi

### Type Scale

| Token | Size | Weight | Pemakaian |
|-------|------|--------|-----------|
| xs | 12px | 500 | Caption, label, meta |
| sm | 13px | 400/500 | Helper text |
| base | 14px | 400 | Body dashboard |
| md | 15px | 500 | Tombol, label |
| lg | 18px | 600 | Subheading panel |
| xl | 20px | 600 | Card title |
| 2xl | 26px | 700 | KPI metric value |
| 3xl | 30px | 700 | Workspace h1 |

---

## 8. API Endpoints (Lengkap — Validated from Route Handlers)

### Auth & Profile
```
GET  /api/me                              → guardian + onboarding stats
PATCH /api/me                             → update displayName
```

### Children & Onboarding
```
GET  /api/children                        → list children for guardian
POST /api/children                        → create child (validated: name, birthDate, condition, focusAreas)
GET  /api/children/:childId               → get child detail
PATCH /api/children/:childId              → update child fields
DELETE /api/children/:childId             → soft delete child + progress
POST /api/children/:childId/onboarding/complete → mark complete + seed consents + seed roadmap + schedule insight
```

### Progress
```
GET  /api/children/:childId/progress      → list with filters: area, inputType, from, to, limit, cursor
POST /api/children/:childId/progress      → create entry (area, inputType, note, title?, mediaId?, observedAt?)
GET  /api/progress/:entryId               → get single entry
PATCH /api/progress/:entryId              → update entry fields
DELETE /api/progress/:entryId             → soft delete entry
```

### Dashboard & Insights
```
GET  /api/children/:childId/dashboard     → aggregated metrics, chart, activities, spotlight, focusTargets, dailyDots
GET  /api/children/:childId/insights      → latest insight + status + isStale
POST /api/children/:childId/insights/generate → generate new insight (hash-based dedup)
```

### Roadmap
```
GET  /api/children/:childId/roadmap       → items + meta (ensures seed if needed)
PATCH /api/children/:childId/roadmap/:itemId → update status/detail/evidence/confidenceScore
POST /api/children/:childId/roadmap/personalize → trigger LLM personalization
```

### Assistant
```
POST /api/assistant/chat                  → RAG-powered answer (question, childId?, conversationId?)
GET  /api/children/:childId/assistant/conversations → list conversations (last 10)
GET  /api/children/:childId/assistant/evaluations → list quality evaluations (last 20)
GET  /api/children/:childId/assistant/snapshot → get latest cached snapshot
POST /api/children/:childId/assistant/snapshot → rebuild child context snapshot
```

### Education & Articles (public — no auth required for GET)
```
GET /api/articles?query=&category=        → search articles
GET /api/articles/:slug                   → get article by slug
```

### Consultation & Providers
```
GET /api/children/:childId/consultations/recommendations → recommendations based on focusAreas + insight
GET /api/providers?childId=&specialty=&lat=&lng=&radius= → search providers (location requires consent)
```

### Media (requires media_upload consent)
```
POST /api/media/upload-url                → create asset + signed upload URL (childId, type: Foto|Suara, fileName)
GET  /api/media/:mediaId                  → get asset metadata
PUT  /api/media/:mediaId/upload?signature= → binary file upload (HMAC verified)
POST /api/media/:mediaId/process          → trigger placeholder processing
GET  /api/media/:mediaId/file             → serve binary file (auth required)
```

### Documents (requires document_analysis consent)
```
POST /api/documents/upload-url            → create asset + signed upload URL (childId, fileName)
GET  /api/documents/:documentId           → get document metadata
PUT  /api/documents/:documentId/upload?signature= → binary file upload (HMAC verified)
POST /api/documents/:documentId/analyze   → trigger document analysis
GET  /api/documents/:documentId/file      → serve binary file (auth required)
```

### Governance
```
GET  /api/children/:childId/consents      → list all consents for child
POST /api/children/:childId/consents      → upsert consent (scope, granted, source?)
GET  /api/children/:childId/audit-logs    → last 50 audit log entries
GET  /api/children/:childId/export        → full JSON export (profile, consents, progress, roadmap, insights, media)
```

### Admin (auth required, no role check — guardian-scoped)
```
GET  /api/admin/dashboard                 → overview metrics, review queue, evaluations, child health
GET  /api/admin/knowledge/articles?reviewStatus=&category= → list articles for review
PATCH /api/admin/knowledge/articles/:articleId → update review status + notes
GET  /api/admin/knowledge/chunks?articleId=&reviewStatus= → list chunks for review
PATCH /api/admin/knowledge/chunks/:chunkId → update review status + notes
```

### Catatan Penting tentang API Pattern
- **Response format:** `{ data: T }` untuk sukses (200/201), `{ error: { code, message, details? } }` untuk error
- **Error codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `BAD_REQUEST` (400), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)
- **Validation errors:** `BAD_REQUEST` dengan `details: [{ path, message, code }]` (Zod issues)
- **Auth:** Semua endpoint (kecuali articles GET) memerlukan auth via `getOrCreateGuardianForRequest()` — upserts guardian on first access
- **Ownership:** Semua child-scoped endpoints memverifikasi guardian ownership via `getOwnedChildForGuardian()`
- **Validation:** Semua input divalidasi dengan Zod schemas sebelum processing (`parseJsonBody`, `parseParams`, `parseQuery`)
- **Audit:** Semua mutasi penting dicatat ke audit log dengan IP address dan user agent
- **Consent:** Media upload requires `media_upload`, document requires `document_analysis`, location requires `location`
- **Upload pattern:** POST upload-url → PUT binary (HMAC signature via query param `?signature=`) → POST process
- **Caching:** Semua route menggunakan `unstable_noStore()` untuk disable Next.js cache
- **Onboarding complete side effects:** marks timestamp → seeds 5 consents → creates seed roadmap → schedules insight refresh → audit log

---

## 9. Status Implementasi

| Sprint | Fokus | Status |
|--------|-------|--------|
| Sprint 1 | Fondasi backend, auth, database | ✅ Done (5 Mei 2026) |
| Sprint 2 | Children, onboarding, consent | ✅ Done (6 Mei 2026) |
| Sprint 3 | Progress notes dan timeline | ✅ Implemented |
| Sprint 4 | Dashboard, roadmap, insight dasar | ✅ Done (6 Mei 2026) |
| Sprint 5 | Media upload dan processing async | ✅ Implemented |
| Sprint 6 | Edukasi, assistant, konsultasi, hardening | ✅ Done (7 Mei 2026) |

### Post-Sprint Enhancements (Done)

- **LLM Consistency** — Insight persistence dengan sourceDataHash, status lifecycle, generate-once-and-store pattern
- **Roadmap Personalization** — Rule-based + LLM suggestion layer, audit trail, personalization metadata
- **AI Knowledge Base RAG** — Knowledge articles/chunks, assistant policies, child context snapshots, response logging, quality evaluation
- **Dashboard Design System** — Redesign dari metric grid ke warm "home page" pattern

---

## 10. Pola Arsitektur Kunci

### Session Management (Frontend)

`useTumbuhSession` hook mengelola seluruh state aplikasi:
- Auth state lifecycle: `loading` → `ready` | `unauthenticated` | `error`
- Auto-loads `/api/me` → children list → active child → dashboard + roadmap + progress
- Supabase auth state change listener (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- Onboarding pending resume: jika user belum login saat onboarding, payload disimpan ke localStorage dan di-resume setelah login
- Optimistic updates: roadmap item update langsung reflected di UI sebelum aggregate refresh
- Media upload flow: consent grant → signed URL request → binary upload → create progress → trigger processing

### Generate-Once-and-Store (Insight)

```
1. Progress berubah
2. Insight ditandai STALE
3. POST /insights/generate dipanggil
4. Backend hitung sourceDataHash
5. Jika hash sama → return existing
6. Jika hash baru → panggil LLM → validasi → simpan → tandai READY
7. GET endpoints hanya baca hasil persisted
```

### Curriculum Library (Seed Roadmap)

```
1. Onboarding complete
2. Backend baca child profile (condition, focusAreas, age, routine, supportNeed)
3. selectCurriculumForChild() scores items by:
   - condition match (conditionTags)
   - age range (ageMinMonths/ageMaxMonths)
   - focus area match
   - routine hints (substring matching)
   - supportNeed hints (substring matching)
   - base priority (1-5)
4. Top items dipilih per area, deduped
5. Jika curriculum kosong → fallback ke generic templates (2 items per area)
6. Status assignment: first item = IN_PROGRESS, Perilaku first = NEEDS_ATTENTION, rest = NEXT_TARGET
7. Disimpan sebagai RoadmapItem dengan personalizationSource="curriculum_v1"
```

### RAG Pipeline (Assistant)

```
1. Intent classification (rule-based): education_general, child_specific_observation,
   activity_suggestion, roadmap_explanation, consultation_preparation,
   report_interpretation, high_risk_or_clinical_boundary
2. Child context snapshot (hash-cached, regenerated saat data berubah)
   - child profile, strengths, risks, active focus areas, latest patterns,
     roadmap targets, progress count, data completeness
3. Knowledge chunk retrieval (keyword + metadata filter, limit 4 chunks)
4. Policy retrieval (berdasarkan intent + risk)
   - non_diagnostic_response, no_medication_or_dosage,
     escalate_when_self_harm_or_severe_regression, etc.
5. Prompt composition (system + context + task + format)
6. LLM call (Qwen, temperature 0-0.1, structured JSON output)
7. Output validation (Zod): { answer, reasoningSummary, nextObservationIdeas,
   followupQuestions, riskLevel, citations }
8. Response logging (full retrieval trace: snapshot IDs, progress IDs,
   chunk IDs, policy IDs, model name, latency)
9. Auto-evaluation (relevance, safety, faithfulness, actionability scores)
   - Issues detected: fallback_used, sparse_child_context, no_knowledge_chunks,
     high_risk_boundary, possible_overclaim, no_followup_guidance
   - Weighted overall: relevance*0.3 + safety*0.3 + faithfulness*0.2 + actionability*0.2
```

### Roadmap Personalization

```
1. Trigger: progress baru / insight READY / manual POST /roadmap/personalize
2. Build snapshot (child + progress + insight + current roadmap)
3. Phase 1: Rule-based reprioritization (area dominan, status update)
4. Phase 2: LLM suggestion (max 5 changes total, validated before apply)
   - Allowed actions: update, reprioritize, pause, add
   - Validation: itemId valid, status valid, evidence non-empty for significant changes,
     confidence 0-1, max 1 add per cycle, no diagnostic wording
5. Audit log (source, reason, before/after state, model name, prompt version)
6. Persist changes to roadmap_items with personalization metadata
7. Schema: roadmapAdjustmentSchema validates LLM output with Zod
```

---

## 11. Struktur Folder Proyek

```
Tumbuh---TechSprint-Competition/
├── app/                    ← Next.js App Router (pages + API routes)
│   ├── api/                ← Backend route handlers
│   ├── tumbuh/             ← Frontend feature components
│   └── [route pages]      ← Page wrappers
├── lib/                    ← Business logic & services
├── prisma/                 ← Schema + migrations
├── generated/prisma/       ← Generated Prisma client
├── docs/                   ← Design & implementation docs
├── scripts/                ← Utility scripts (seed knowledge base)
├── public/                 ← Static assets
└── .kiro/                  ← Kiro steering files
```

---

## 12. Environment Variables

```env
DATABASE_URL=            # Supabase Postgres pooler URL
DIRECT_URL=              # Direct Postgres URL (untuk Prisma CLI)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
QWEN_API_KEY=            # LLM API key
QWEN_BASE_URL=           # LLM endpoint
```

Dev mode (tanpa Supabase Auth):
```env
NEXT_PUBLIC_DEV_AUTH_USER_ID=dev-user-1
NEXT_PUBLIC_DEV_AUTH_EMAIL=dev@example.com
NEXT_PUBLIC_DEV_AUTH_NAME=Guardian Dev
```

---

## 13. Dokumentasi Terkait

| Dokumen | Isi |
|---------|-----|
| `DESIGN.md` | Style prompt, warna, tipografi, motion guidelines |
| `docs/website-context.md` | Product narrative, experience map, content structure |
| `docs/dashboard-design-system.md` | Spesifikasi komponen dashboard, layout, copy guidelines |
| `docs/backend-audit.md` | Audit frontend → kebutuhan backend |
| `docs/backend-sprint-breakdown.md` | 6 sprint MVP breakdown |
| `docs/backend-sprint-task-detail.md` | Task-level backlog per sprint |
| `docs/llm-consistency-implementation.md` | Arsitektur insight persistence + LLM consistency |
| `docs/roadmap-child-personalization-implementation.md` | Personalisasi roadmap per child |
| `docs/ai-knowledge-base-rag-implementation.md` | RAG architecture, knowledge base, guardrails |

---

## 14. Ringkasan

Tumbuh adalah produk yang sudah melewati fase prototype dan memasuki **sistem production-ready** dengan:

- Backend penuh (6 sprint selesai)
- Database PostgreSQL dengan 15+ model
- AI/LLM integration yang mature (RAG, persistence, evaluation, guardrails)
- Design system yang terdokumentasi
- Security & compliance layer (consent, audit, ownership)
- Admin tooling untuk knowledge review dan quality monitoring

**Value proposition utama:** Orang tua mencatat momen kecil → sistem merangkai pola → roadmap menyesuaikan → konsultasi lebih siap. Semua dengan rasa aman, hangat, dan tidak menghakimi.

---

## 15. Detail Implementasi Tambahan (Validated from Code)

### Copy Personalization System (`app/tumbuh/personalize.ts`)

Seluruh copy di UI di-generate secara dinamis berdasarkan child context:
- `dashboardGreeting()` — berdasarkan jam hari
- `dashboardNarrative()` — berdasarkan notesThisWeek, delta, alertCount, closestTarget
- `weeklyPulseNarrative()` — berdasarkan notesThisWeek, delta, todayIndex
- `insightFallbackText()` — menyebut nama, kondisi, focusAreas, routine
- `personalizedActivityPlaceholders()` — per-area activity suggestions
- `roadmapEmptyBody()`, `progressEmptyState()`, `educationHeaderBody()`, `consultationHeaderBody()` — semua personalized

Aturan copy:
- Tidak pernah menampilkan data onboarding sebagai kartu/list telanjang
- Copy generic hanya jika data belum ada
- Output selalu bahasa natural, bukan template "Kondisi: X, Fokus: Y"

### AppShell Sidebar Hints

Sidebar navigation menampilkan hint badges berdasarkan `supportNeed` child:
- "konsultasi" → Consultation link mendapat badge "Rekomendasi"
- "reminder"/"rutinitas" → Progress link mendapat badge "Rutin"
- "artikel"/"edukasi" → Education link mendapat badge "Cocok"

### Media Upload Flow (Validated)

```
1. Frontend: user pilih file di progress form
2. Auto-grant consent media_upload via POST /consents
3. POST /api/media/upload-url → signed URL + asset metadata
4. PUT binary ke signed URL (HMAC signature verified)
5. File disimpan ke storage/uploads/{date}/{uuid}-{filename}
6. POST /api/children/:childId/progress dengan mediaId
7. POST /api/media/:mediaId/process → placeholder processing
8. Processing output disimpan ke MediaAsset.processedOutput
9. Entry insight di-regenerate dengan media context
```

### Evaluation Scoring (Validated from `assistant-evaluator.ts`)

Base scores: relevance=88, safety=92, faithfulness=90, actionability=86

Deductions:
- `fallback_used`: relevance -12, faithfulness -4
- `no_knowledge_chunks`: relevance -20, actionability -10
- `sparse_child_context`: relevance -8, faithfulness -6
- `possible_overclaim` (no disclaimer text): safety -10
- `no_followup_guidance`: actionability -18

Bonuses:
- 2+ retrieved chunks: relevance +4
- high_risk intent handled: safety floor at 96

### Onboarding → Dashboard Flow (Validated)

```
1. User completes 4-step onboarding form
2. If not authenticated: save to localStorage, redirect to /login?next=/dashboard
3. If authenticated: POST /api/children (or PATCH if editing)
4. POST /api/children/:childId/onboarding/complete
   → marks onboardingCompletedAt
   → seeds consents (health_data=true, ai_insight=true, rest=false)
   → creates seed roadmap via curriculum library
5. Frontend: refreshSession() → refreshAggregateData() → go("dashboard")
6. On next app load: useTumbuhSession detects hasCompletedOnboarding → routes to dashboard
```
