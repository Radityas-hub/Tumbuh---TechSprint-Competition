# Dashboard Design System — Tumbuh

## Design Philosophy

Dashboard Tumbuh bukan dashboard analytics. Ia adalah **halaman rumah** — tempat orang tua kembali setiap hari untuk merasa tenang, tahu kondisi anak, dan punya satu langkah jelas yang bisa dilakukan.

### Opini Desain yang Kami Pegang

1. **Angka bukan hero.** Angka hanya bermakna kalau sudah diterjemahkan jadi kalimat. Parent tidak butuh "3" di kartu besar — mereka butuh "3 catatan minggu ini, lebih banyak dari minggu lalu."
2. **Satu layar, satu pertanyaan.** Dashboard menjawab: "Bagaimana [anak] minggu ini, dan apa yang bisa saya lakukan hari ini?"
3. **Warmth over precision.** Lebih baik terasa hangat dan sedikit kurang presisi, daripada presisi tapi terasa dingin.
4. **Silence is good news.** Kalau tidak ada alert, tidak perlu ada panel alert kosong. Ruang kosong = tenang.
5. **Setiap blok punya satu aksi.** Tidak ada panel yang hanya menampilkan informasi tanpa memberi arah.

---

## Visual Language

### Referensi yang Diambil dari Screenshot

| Elemen | Inspirasi | Adaptasi untuk Tumbuh |
|--------|-----------|----------------------|
| Hero card dengan greeting personal | Screenshot 1 (Hello, Umar) | Greeting + narasi kondisi anak, bukan badge/predikat |
| Rounded cards dengan gradient lembut | Kedua screenshot | Gradient mint-to-white, bukan purple/pink |
| Progress ring/donut | Screenshot 1 (70%, 60%) | Diubah jadi progress arc sederhana pada fokus target |
| Sidebar navigation yang bersih | Screenshot 2 (TaskLab) | Sudah ada, dipertahankan |
| Color-coded category cards | Screenshot 1 (subject cards) | Dipakai untuk area fokus (Komunikasi, Motorik, dll) |
| Playful but structured layout | Kedua screenshot | Grid asimetris, tapi tanpa 3D character atau blob |

### Yang Sengaja Tidak Diambil

- ❌ 3D character/avatar — terlalu playful untuk konteks anak berkebutuhan khusus
- ❌ Star rating system — framing "nilai" tidak sesuai filosofi produk
- ❌ Warna pink/purple/orange dominan — Tumbuh punya identitas hijau-mint yang sudah kuat
- ❌ Time tracker / countdown — tidak ada urgensi yang perlu ditampilkan
- ❌ Bar chart besar — diganti representasi yang lebih human-readable

---

## Color System (Dashboard-Specific)

```
┌─────────────────────────────────────────────────────────────┐
│  SURFACE HIERARCHY                                          │
│                                                             │
│  Page background    : #f5f8f6 (existing --bg)               │
│  Hero card          : linear-gradient(135deg,               │
│                       rgba(223,244,236,0.6),                │
│                       rgba(255,255,255,0.95))               │
│  Standard card      : #ffffff with 1px --line border        │
│  Spotlight card     : rgba(255,232,228,0.4) border coral    │
│  Action card        : rgba(223,244,236,0.85) — mint-tinted  │
│                                                             │
│  SEMANTIC TONES                                             │
│                                                             │
│  Calm / all good    : --teal (#087a70)                      │
│  Needs attention    : --coral (#e36f5c) — soft, not alarm   │
│  Progress / active  : --blue (#5b79c8)                      │
│  Achievement        : --amber (#eeb94d)                     │
│  Neutral info       : --muted (#5d6b66)                     │
│                                                             │
│  AREA COLORS (focus area identity)                          │
│                                                             │
│  Komunikasi         : --teal + --mint background            │
│  Motorik            : --blue + --blue-soft background       │
│  Perilaku           : --amber + --amber-soft background     │
│  Akademik           : --coral + --coral-soft background     │
└─────────────────────────────────────────────────────────────┘
```

---

## Typography Scale (Dashboard)

```
Hero greeting        : 28px / weight 700 / --ink
Narrative body       : 15px / weight 500 / --muted / line-height 1.65
Card title (h2)      : 18px / weight 600 / --ink
Card body            : 14px / weight 500 / --muted / line-height 1.55
Micro label          : 12px / weight 600 / --muted / uppercase tracking
CTA button           : 14px / weight 500
Timestamp / meta     : 12px / weight 500 / --muted
```

Tidak ada font size di atas 30px di dashboard. Ini bukan landing page — ketenangan visual lebih penting dari impact.

---

## Spacing & Rhythm

```
Section gap (antar layer)     : 28px (--space-7, baru)
Card internal padding         : 24px (--space-6)
Card gap (dalam grid)         : 20px (--space-5)
Element gap (dalam card)      : 12px (--space-3)
Micro gap (label ke value)    : 8px (--space-2)
```

Rhythm sengaja lebih longgar dari SaaS standar. Setiap card punya ruang napas. Tidak ada card yang saling berhimpit.

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR (250px, existing)  │  WORKSPACE (fluid)                  │
│                            │                                      │
│                            │  ┌──────────────────────────────┐   │
│                            │  │  LAYER 1: Hero Zone          │   │
│                            │  │  (full width, gradient bg)    │   │
│                            │  └──────────────────────────────┘   │
│                            │                                      │
│                            │  ┌──────────────────────────────┐   │
│                            │  │  LAYER 2: Spotlight           │   │
│                            │  │  (conditional, coral-tinted)  │   │
│                            │  └──────────────────────────────┘   │
│                            │                                      │
│                            │  ┌─────────────┐ ┌──────────────┐   │
│                            │  │  LAYER 3:   │ │  LAYER 4:    │   │
│                            │  │  Daily      │ │  Weekly      │   │
│                            │  │  Actions    │ │  Pulse       │   │
│                            │  │  (taller)   │ │  (shorter)   │   │
│                            │  └─────────────┘ └──────────────┘   │
│                            │                                      │
│                            │  ┌─────────────┐ ┌──────────────┐   │
│                            │  │  LAYER 5:   │ │  LAYER 6:    │   │
│                            │  │  Focus      │ │  Insight     │   │
│                            │  │  Targets    │ │  (expand)    │   │
│                            │  └─────────────┘ └──────────────┘   │
│                            │                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Grid Rules

- Layer 1 & 2: full-width (single column)
- Layer 3-6: two-column grid, ratio `1.15fr 0.85fr`
- Layer 3 (Daily Actions) dan Layer 5 (Focus Targets) di kolom kiri (lebih lebar, karena actionable)
- Layer 4 (Weekly Pulse) dan Layer 6 (Insight) di kolom kanan (lebih ringkas, karena reflective)

Ini berbeda dari dashboard saat ini yang pakai 3-column grid. Dua kolom lebih mudah di-scan dan lebih mobile-friendly.

---

## Component Specifications

### 1. Hero Zone

```
┌─────────────────────────────────────────────────────────────┐
│  background: linear-gradient(135deg,                        │
│              rgba(223,244,236,0.6), rgba(255,255,255,0.95)) │
│  border: 1px solid var(--line)                              │
│  border-radius: var(--radius) — 24px                        │
│  padding: 32px                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  h1: "Selamat pagi, Bunda Rani"                     │   │
│  │  28px / 700 / --ink                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  p.narrative: "Sutha punya minggu yang cukup aktif.  │   │
│  │  3 catatan baru, dan target 'menyebut nama benda'   │   │
│  │  mendekati tercapai. Tidak ada yang perlu            │   │
│  │  dikhawatirkan minggu ini."                          │   │
│  │  15px / 500 / --muted / max-width: 580px             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────┐                                 │
│  │  [+ Catat hari ini]    │  primary-button                 │
│  └────────────────────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Narrative berubah berdasarkan data. Bukan template statis.
- Kalau belum ada data: tone mengajak, bukan menampilkan kosong.
- Greeting mengikuti waktu hari (sudah ada di codebase).

---

### 2. Spotlight Alert (Conditional)

```
┌─────────────────────────────────────────────────────────────┐
│  background: rgba(255,232,228,0.35)                         │
│  border: 1px solid rgba(227,111,92,0.2)                     │
│  border-radius: var(--radius) — 24px                        │
│  padding: 24px                                              │
│  display: flex; gap: 16px; align-items: flex-start          │
│                                                             │
│  ┌────┐                                                     │
│  │ 🌡️ │  icon: 40x40, coral-soft bg, coral icon             │
│  └────┘                                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  strong: "Perlu perhatian"                           │   │
│  │  14px / 600 / --ink                                  │   │
│  │                                                      │   │
│  │  p: "Area komunikasi menunjukkan penurunan           │   │
│  │  frekuensi dalam 2 minggu terakhir. Ini bisa jadi    │   │
│  │  bahan diskusi di sesi terapi berikutnya."           │   │
│  │  14px / 500 / --muted                                │   │
│  │                                                      │   │
│  │  ┌──────────────────┐  ┌─────────────────────┐      │   │
│  │  │ Lihat insight    │  │ Siapkan konsultasi  │      │   │
│  │  │ (text-button)    │  │ (text-button)       │      │   │
│  │  └──────────────────┘  └─────────────────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Hanya muncul kalau `alertCount > 0` dan ada insight alert yang bermakna.
- Maksimal 1 spotlight. Kalau ada banyak alert, tampilkan yang paling penting.
- Tone: "perlu perhatian", bukan "PERINGATAN" atau "WARNING".
- Kalau tidak ada alert: **komponen ini tidak di-render sama sekali.** Bukan hidden, bukan collapsed — tidak ada.

---

### 3. Daily Action Card

```
┌─────────────────────────────────────────────────────────────┐
│  background: var(--surface-solid)                           │
│  border: 1px solid var(--line)                              │
│  border-radius: var(--radius)                               │
│  padding: 24px                                              │
│                                                             │
│  h2: "Yang bisa dilakukan hari ini"                         │
│  18px / 600 / --ink                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ACTION ITEM                                         │   │
│  │  background: var(--mint) — area-tinted               │   │
│  │  border-radius: var(--radius-sm)                     │   │
│  │  padding: 16px                                       │   │
│  │                                                      │   │
│  │  ┌────┐  strong: "Ajak Sutha menyebut 3 benda       │   │
│  │  │icon│  saat makan siang"                           │   │
│  │  └────┘  14px / 600 / --ink                          │   │
│  │                                                      │   │
│  │          small: "Komunikasi"                         │   │
│  │          12px / 600 / --teal                         │   │
│  │                                                      │   │
│  │          ┌─────────────────────┐                     │   │
│  │          │ ✓ Sudah dilakukan   │ ghost-button        │   │
│  │          └─────────────────────┘                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ACTION ITEM (second, optional)                      │   │
│  │  background: var(--blue-soft) — area-tinted          │   │
│  │  ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Maksimal 2 items. Tidak pernah lebih.
- Background item mengikuti warna area (mint untuk Komunikasi, blue-soft untuk Motorik, dll).
- CTA "Sudah dilakukan" bisa trigger quick-note modal atau langsung go("progress").
- Kalau belum ada data: tampilkan 1 item placeholder yang mengajak catat pertama kali.

---

### 4. Weekly Pulse

```
┌─────────────────────────────────────────────────────────────┐
│  background: var(--surface-solid)                           │
│  border: 1px solid var(--line)                              │
│  border-radius: var(--radius)                               │
│  padding: 24px                                              │
│                                                             │
│  h2: "Ritme minggu ini"                                     │
│  18px / 600 / --ink                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DOT ROW                                             │   │
│  │  display: flex; gap: 12px; justify: space-between    │   │
│  │                                                      │   │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │   │
│  │  │ ● │ │ ● │ │ ○ │ │ ● │ │ ○ │ │   │ │   │        │   │
│  │  │Sen│ │Sel│ │Rab│ │Kam│ │Jum│ │Sab│ │Min│        │   │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘        │   │
│  │                                                      │   │
│  │  ● = ada catatan (--teal, 12px circle)               │   │
│  │  ○ = belum ada (--line, 12px circle, border only)    │   │
│  │  empty = hari belum terjadi (no dot)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  p.narrative: "3 catatan dari 5 hari. Lebih aktif dari     │
│  minggu lalu."                                              │
│  14px / 500 / --muted                                       │
│                                                             │
│  ┌─────────────────────────┐                                │
│  │ Lihat semua catatan →   │ text-button                    │
│  └─────────────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design rationale:**
- Dot indicator jauh lebih mudah dipahami daripada bar chart untuk non-tech user.
- Parent hanya perlu tahu: "hari mana saya sudah catat, hari mana belum."
- Narasi di bawah dot menjelaskan artinya — parent tidak perlu menginterpretasi sendiri.
- Hari yang belum terjadi (misal hari ini Kamis, maka Jumat-Minggu) tidak menampilkan dot sama sekali, agar tidak terasa "belum selesai".

---

### 5. Focus Target Card

```
┌─────────────────────────────────────────────────────────────┐
│  background: var(--surface-solid)                           │
│  border: 1px solid var(--line)                              │
│  border-radius: var(--radius)                               │
│  padding: 24px                                              │
│                                                             │
│  h2: "Fokus saat ini"                                       │
│  18px / 600 / --ink                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TARGET ITEM                                         │   │
│  │  display: flex; gap: 16px; align-items: center       │   │
│  │                                                      │   │
│  │  ┌──────────┐                                        │   │
│  │  │          │  PROGRESS ARC                          │   │
│  │  │   70%    │  56x56px SVG circle                    │   │
│  │  │          │  stroke: area color                    │   │
│  │  └──────────┘  track: var(--bg-strong)               │   │
│  │                                                      │   │
│  │  strong: "Menyebut nama benda sehari-hari"           │   │
│  │  14px / 600 / --ink                                  │   │
│  │                                                      │   │
│  │  small: "Komunikasi • Mendekati tercapai"            │   │
│  │  12px / 500 / --muted                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  (repeat for max 2 items)                                   │
│                                                             │
│  ┌─────────────────────────┐                                │
│  │ Lihat semua target →    │ text-button                    │
│  └─────────────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design rationale:**
- Progress arc (donut/ring) terinspirasi dari screenshot 1, tapi lebih kecil dan subtle.
- Hanya 1-2 target yang ditampilkan — yang paling dekat achieved atau prioritas tertinggi.
- Label status menggunakan bahasa natural: "Mendekati tercapai", "Baru dimulai", "Sedang berjalan".
- Warna arc mengikuti area color system.

---

### 6. Insight Card (Expandable)

```
┌─────────────────────────────────────────────────────────────┐
│  background: var(--surface-solid)                           │
│  border: 1px solid var(--line)                              │
│  border-radius: var(--radius)                               │
│  padding: 24px                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  display: flex; justify-content: space-between       │   │
│  │  h2: "Ringkasan catatan"   │  Sparkles icon (22px)  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  p.insight-text: "Dalam 2 minggu terakhir, Sutha           │
│  menunjukkan peningkatan konsistensi di area motorik..."   │
│  15px / 500 / --ink / line-clamp: 3 (collapsed)            │
│                                                             │
│  ┌─────────────────────────┐                                │
│  │ Baca selengkapnya ↓     │ text-button (toggle)           │
│  └─────────────────────────┘                                │
│                                                             │
│  small: "Diperbarui 3 hari lalu"                            │
│  12px / 500 / --muted                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Default: collapsed (3 lines max via line-clamp).
- "Baca selengkapnya" expands in-place, tidak navigasi ke halaman lain.
- Timestamp memberi freshness tanpa tekanan.
- Kalau insight sedang di-generate: tampilkan skeleton + "Sedang menyusun ringkasan..."

---

## Empty State Design

### Prinsip Empty State

Empty state bukan error. Ia adalah **undangan**.

```
┌─────────────────────────────────────────────────────────────┐
│  HERO ZONE (empty variant)                                  │
│                                                             │
│  h1: "Selamat datang, Bunda Rani"                           │
│                                                             │
│  p: "Dashboard ini akan jadi tempat Anda melihat            │
│  perkembangan Sutha secara ringkas. Mulai dengan satu       │
│  langkah kecil."                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SINGLE INVITATION CARD (replaces all other layers)         │
│                                                             │
│  background: var(--mint)                                    │
│  border-radius: var(--radius)                               │
│  padding: 32px                                              │
│  text-align: center                                         │
│                                                             │
│  icon: 📝 (or Pencil icon, 48px, --teal)                   │
│                                                             │
│  strong: "Catat satu momen hari ini"                        │
│  18px / 600 / --ink                                         │
│                                                             │
│  p: "Tidak perlu panjang. Satu kalimat tentang apa yang     │
│  Anda perhatikan sudah cukup. Setelah ada beberapa          │
│  catatan, dashboard akan mulai menunjukkan pola."           │
│  14px / 500 / --muted                                       │
│                                                             │
│  ┌────────────────────────┐                                 │
│  │  [Mulai mencatat]      │ primary-button                  │
│  └────────────────────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- Saat empty: HANYA hero + 1 invitation card. Tidak ada grid, tidak ada panel kosong.
- Tidak ada "0" di mana-mana. Angka nol tidak informatif dan terasa mengecilkan.
- Copy menggunakan permission-giving tone: "tidak perlu panjang", "satu kalimat sudah cukup".

---

## Interaction Patterns

### Micro-interactions

| Element | Interaction | Feedback |
|---------|-------------|----------|
| Primary button | Hover | translateY(-2px), subtle shadow |
| Action item "Sudah dilakukan" | Click | Checkmark animation, item fades to muted |
| Insight "Baca selengkapnya" | Click | Smooth height transition, icon rotates |
| Dot (weekly pulse) | Hover | Tooltip: "Selasa — 2 catatan" |
| Progress arc | — | No interaction, purely visual |
| Spotlight alert | Dismiss (optional) | Slide up + fade out |

### Transitions

- Page load: cards stagger in from bottom (50ms delay each), opacity 0→1, translateY(12px→0)
- Spotlight appear/disappear: height transition 300ms ease
- Insight expand: max-height transition 250ms ease

---

## Responsive Behavior

### Breakpoints

```
Desktop (>1024px)  : 2-column grid as designed
Tablet (768-1024px): single column, all layers stack
Mobile (<768px)    : single column, reduced padding (16px)
                     Hero greeting font: 24px
                     Sidebar collapses to bottom nav
```

### Mobile-specific adjustments

- Weekly pulse dots: tetap 7, tapi gap dikurangi
- Action items: full width, stacked
- Focus targets: progress arc tetap, tapi layout jadi vertical
- Insight: default collapsed, expand tetap in-place

---

## Copy Guidelines (Dashboard-Specific)

### Tone Rules

1. **Gunakan nama anak, bukan "anak Anda"** — kalau data tersedia
2. **Kalimat pendek** — max 2 baris per paragraph di card
3. **Hindari jargon** — "milestone" → "target", "metric" → dihilangkan, "insight" → "ringkasan"
4. **Framing positif** — "3 catatan minggu ini" bukan "hanya 3 catatan"
5. **Permission-giving** — "tidak perlu sempurna", "satu kalimat sudah cukup"

### Narrative Templates

**Minggu aktif, tidak ada alert:**
> "Sutha punya minggu yang cukup aktif. 3 catatan baru, dan target 'menyebut nama benda' mendekati tercapai. Tidak ada yang perlu dikhawatirkan."

**Minggu tenang:**
> "Minggu yang tenang untuk Sutha. Konsistensi seperti ini tetap berarti — tidak semua kemajuan terlihat di permukaan."

**Ada alert:**
> "Sutha punya 2 catatan baru minggu ini. Ada satu hal yang mungkin perlu perhatian di area komunikasi."

**Pertama kali (empty):**
> "Dashboard ini akan jadi tempat Anda melihat perkembangan Sutha secara ringkas. Mulai dengan satu langkah kecil."

---

## Component Naming Convention

```
DashboardHero          — Layer 1
DashboardSpotlight     — Layer 2 (conditional)
DashboardDailyActions  — Layer 3
DashboardWeeklyPulse   — Layer 4
DashboardFocusTargets  — Layer 5
DashboardInsight       — Layer 6
DashboardEmptyState    — Full empty replacement
```

---

## Implementation Priority

| Phase | What | Why |
|-------|------|-----|
| 1 | Hero Zone + Empty State | Immediate emotional impact, replaces metric grid |
| 2 | Daily Actions + Weekly Pulse | Core value loop (catat → lihat ritme) |
| 3 | Focus Targets + Insight | Deeper engagement, requires roadmap data |
| 4 | Spotlight Alert | Conditional, needs insight alert data |
| 5 | Data layer changes | narrativeSummary, dailyDots, spotlightAlert |

---

## What This Is NOT

- Ini bukan redesign seluruh app. Hanya dashboard.
- Sidebar, navigation, dan shell tetap sama.
- Design tokens (warna, radius, spacing) tetap menggunakan yang sudah ada di globals.css.
- Tidak ada library baru yang perlu ditambahkan.
- Tidak ada breaking change ke API — hanya penambahan field baru di response.
